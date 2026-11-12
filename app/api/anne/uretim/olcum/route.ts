import { NextResponse } from "next/server"
import { consentBlock, requireAppUser } from "@/lib/anne/server"
import { extractBiometricsFromImage } from "@/lib/anne/generation/ocr"
import { addPaperToDraft, findDraft, resetDraft, summarizeDraft } from "@/lib/anne/generation/service"
import { readJpegUpload } from "@/lib/anne/generation/upload"
import { checkRateLimit } from "@/lib/rate-limit"

// Ölçüm kâğıdının fotoğrafını okur ve değerleri üretim taslağına işler.
// Fotoğraf saklanmaz. Okunan değerler hastaya gösterilmez (ana plan 5.3: uygulama ölçüm
// değeri, yorum ya da değerlendirme göstermez); yalnızca kaç ölçüm okunduğu döner.

// Okuma, yoğunlukta 5 kez yeniden denenir (5/10/15/20/25 saniye beklemeyle).
export const maxDuration = 300

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  const blocked = await consentBlock(gate)
  if (blocked) return blocked

  // Her okuma ücretli bir yapay zekâ çağrısıdır: sınır denetlenemiyorsa yapılmaz.
  if (!(await checkRateLimit(`anne-olcum:${gate.user.id}`, 12, 3600, { failClosed: true }))) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Lütfen bir süre sonra yeniden dene." }, { status: 429 })
  }

  const form = await request.formData().catch(() => null)
  const upload = await readJpegUpload(form?.get("file"))
  if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: 400 })

  // Deneme başına 40 saniye: 5 deneme ve aradaki beklemeler sunucunun süresine sığar.
  const ocr = await extractBiometricsFromImage(upload.bytes, { timeoutMs: 40_000 })
  if (!ocr.success) {
    if (ocr.found_count === 0) {
      return NextResponse.json(
        { error: "Bu fotoğrafta ölçüm okunamadı. Kâğıdın tamamı görünecek şekilde, ışıkta ve net çekmeyi dene." },
        { status: 422 },
      )
    }
    console.error("[anne/uretim/olcum] okuma hatası:", ocr.error)
    return NextResponse.json(
      {
        error: ocr.transient
          ? "Okuma servisi şu anda yoğun. Yarım dakika sonra yeniden dene."
          : "Kâğıt şu anda okunamadı. Lütfen yeniden dene.",
      },
      { status: 502 },
    )
  }

  const saved = await addPaperToDraft(gate.db, gate.user.id, ocr)
  if (!saved.ok) {
    return NextResponse.json(
      {
        error:
          saved.reason === "limit"
            ? "Yeterince kâğıt okundu. Baştan başlamak için ölçümleri sıfırla."
            : "Ölçümler kaydedilemedi. Lütfen yeniden dene.",
      },
      { status: saved.reason === "limit" ? 400 : 500 },
    )
  }
  if (saved.filled === 0) {
    return NextResponse.json(
      { error: "Bu fotoğrafta yüz ve baş ölçümleri bulunamadı. Doktorunun verdiği ölçüm kâğıdını çekmeyi dene." },
      { status: 422 },
    )
  }
  return NextResponse.json({ ok: true, filled: saved.filled, draft: saved.draft })
}

/** Okunan ölçümleri sıfırlar (yanlış kâğıt çekildiyse). */
export async function DELETE(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  await resetDraft(gate.db, gate.user.id)
  return NextResponse.json({ ok: true, draft: summarizeDraft(await findDraft(gate.db, gate.user.id)) })
}
