import { NextResponse, after } from "next/server"
import { CONSENT_VERSION } from "@/lib/anne/consents"
import { gestationalAge, todayInIstanbul } from "@/lib/anne/pregnancy"
import { consentBlock, requireAppUser } from "@/lib/anne/server"
import { MIN_GENERATION_WEEK, failGeneration, runGeneration, startGeneration } from "@/lib/anne/generation/service"
import { readJpegUpload } from "@/lib/anne/generation/upload"
import { validateUltrasoundImage } from "@/lib/anne/generation/validator"
import { checkRateLimit } from "@/lib/rate-limit"

// Bebek yüzü üretimini başlatır. Akış eski sistemle aynıdır: görüntü denetlenir, iş başlatılır,
// yanıt hemen döner ve üretim arkada sürer; ekran durumu /api/anne/uretim üzerinden sorar.
// Hak yalnızca üretim başarıyla bittiğinde düşer.

// Üretim: Google için 3 deneme, gerekirse yedek sağlayıcı. Hepsi bu sürenin içinde biter.
export const maxDuration = 300
const BUDGET_MS = 285_000

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  const blocked = await consentBlock(gate)
  if (blocked) return blocked
  const startedAt = Date.now()

  const form = await request.formData().catch(() => null)
  const gender = form?.get("gender")
  if (gender !== "female" && gender !== "male") {
    return NextResponse.json({ error: "Bebeğin cinsiyetini seç." }, { status: 400 })
  }
  if (form?.get("onay") !== "1") {
    return NextResponse.json({ error: "Devam etmek için görüntünün işlenmesine onay vermen gerekiyor." }, { status: 400 })
  }

  // Hafta istekten okunmaz; hesaptaki tarihten hesaplanır.
  const age = gate.user.lmp_date ? gestationalAge(gate.user.lmp_date, todayInIstanbul()) : null
  if (!age) return NextResponse.json({ error: "Önce gebelik tarihini Hesap ekranından tamamla." }, { status: 400 })
  if (age.weeks < MIN_GENERATION_WEEK) {
    return NextResponse.json(
      { error: `Bebeğin yüzü ${MIN_GENERATION_WEEK}. haftadan itibaren üretilebiliyor. Şu an ${age.weeks}. haftadasın.` },
      { status: 400 },
    )
  }

  const upload = await readJpegUpload(form?.get("file"))
  if (!upload.ok) return NextResponse.json({ error: upload.error }, { status: 400 })

  // Denetim ve üretim ücretli çağrılardır: sınır denetlenemiyorsa yapılmaz.
  if (!(await checkRateLimit(`anne-uretim:${gate.user.id}`, 8, 3600, { failClosed: true }))) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Lütfen bir süre sonra yeniden dene." }, { status: 429 })
  }

  // Görüntü gerçekten bebeğin yüzünü gösteren bir ultrason mu? (ultrason + yüz + kalite >= 30)
  const validation = await validateUltrasoundImage(upload.bytes)
  if (validation.unavailable) {
    console.error("[anne/uretim/baslat] denetim yapılamadı:", validation.error)
    return NextResponse.json({ error: "Görüntü şu anda denetlenemedi. Lütfen biraz sonra yeniden dene." }, { status: 502 })
  }
  if (!validation.is_valid) {
    const reason = !validation.is_ultrasound
      ? "Bu fotoğraf bir ultrason görüntüsüne benzemiyor."
      : !validation.has_fetal_face
        ? "Bu görüntüde bebeğin yüzü seçilemiyor. Yüzün göründüğü 3B/4B görüntüyü çekmeyi dene."
        : "Görüntü yeterince net değil. Işıkta, yansımasız ve daha yakından çekmeyi dene."
    return NextResponse.json({ error: reason }, { status: 422 })
  }
  // Görüntünün üzerinde gebelik haftası yazıyorsa alt sınır ona göre de denetlenir.
  if (typeof validation.gestational_weeks === "number" && validation.gestational_weeks > 0 && validation.gestational_weeks < MIN_GENERATION_WEEK) {
    return NextResponse.json(
      { error: `Bu görüntü ${validation.gestational_weeks}. haftaya ait görünüyor. Üretim ${MIN_GENERATION_WEEK}. haftadan sonraki görüntülerle yapılabiliyor.` },
      { status: 422 },
    )
  }

  const started = await startGeneration(gate.db, gate.user.id, { week: Math.min(age.weeks, 44), gender })
  if (!started.ok) return NextResponse.json({ error: started.error }, { status: started.status })

  // Görüntünün yurt dışındaki yapay zekâ hizmetine gönderilmesine verilen onay kayda geçer.
  await gate.db.from("app_consents").insert({ user_id: gate.user.id, kind: "bebek_resmi", version: CONSENT_VERSION, granted: true })

  const { db, user } = gate
  after(async () => {
    try {
      await runGeneration(db, started.row, upload.bytes, started.biometrics, {
        patientName: user.display_name ?? "",
        // Zaman sınırları, sunucunun toplam süresini aşmayacak şekilde kendiliğinden kısalır.
        deadlineAt: startedAt + BUDGET_MS,
      })
    } catch (error) {
      await failGeneration(db, started.row, error instanceof Error ? error.message : String(error))
    }
  })

  return NextResponse.json({ ok: true, id: started.row.id })
}
