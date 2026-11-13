import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  DOCUMENT_BUCKET,
  DOCUMENT_COLUMNS,
  MAX_DOCUMENTS,
  MAX_DOCUMENT_BYTES,
  cleanTitle,
  isDocumentCategory,
  sniffDocument,
  toAppDocument,
} from "@/lib/anne/document-types"
import { CONSENT_VERSION } from "@/lib/anne/consents"
import { consentBlock, requireAppUser } from "@/lib/anne/server"

// Hastanın belgeleri (tahlil, rapor, reçete). Dosyalar herkese kapalı depoda durur ve
// hastaya yalnızca bu yol üzerinden, kendi hesabıyla süzülerek verilir. Kliniğin görmesi
// ayrı bir personel yolundadır (app/api/admin/uygulama/belgeler).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const file = new URL(request.url).searchParams.get("dosya")
  if (file === null) {
    const { data } = await gate.db
      .from("app_documents")
      .select(DOCUMENT_COLUMNS)
      .eq("user_id", gate.user.id)
      .order("created_at", { ascending: false })
      .limit(MAX_DOCUMENTS)
    return NextResponse.json({ documents: (data ?? []).map(toAppDocument) }, { headers: { "Cache-Control": "private, no-store" } })
  }

  if (!UUID.test(file)) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  const { data: row } = await gate.db
    .from("app_documents")
    .select("storage_path, mime")
    .eq("user_id", gate.user.id)
    .eq("id", file)
    .maybeSingle()
  if (!row) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })

  const { data: blob, error } = await gate.db.storage.from(DOCUMENT_BUCKET).download(row.storage_path)
  if (error || !blob) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })

  const pdf = row.mime === "application/pdf"
  return new NextResponse(blob.stream(), {
    headers: {
      "Content-Type": pdf ? "application/pdf" : "image/jpeg",
      "Content-Disposition": `inline; filename="belge.${pdf ? "pdf" : "jpg"}"`,
      // Silinen belge ortak cihazın önbelleğinde kalmasın.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  const blocked = await consentBlock(gate)
  if (blocked) return blocked

  const form = await request.formData().catch(() => null)
  const category = form?.get("tur")
  const file = form?.get("dosya")
  // Belgeyi kliniğin göreceğini hasta her yüklemede açıkça onaylar.
  if (!isDocumentCategory(category) || !(file instanceof Blob) || form?.get("onay") !== "1") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }
  if (file.size === 0 || file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json(
      { error: "Dosya çok büyük (en çok 4 MB). Sayfaların fotoğrafını çekip yükleyebilirsin." },
      { status: 400 },
    )
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mime = sniffDocument(bytes)
  if (!mime) return NextResponse.json({ error: "Yalnızca fotoğraf ya da PDF yüklenebilir." }, { status: 400 })

  if (!(await checkRateLimit(`anne:belge:${gate.user.id}`, 30, 3600))) {
    return NextResponse.json({ error: "Çok fazla yükleme yapıldı. Lütfen bir süre sonra yeniden dene." }, { status: 429 })
  }

  const { count } = await gate.db.from("app_documents").select("id", { count: "exact", head: true }).eq("user_id", gate.user.id)
  if ((count ?? 0) >= MAX_DOCUMENTS) {
    return NextResponse.json({ error: "Belge sınırına ulaştın. Yenisi için eskilerden sil." }, { status: 400 })
  }

  const path = `${gate.user.id}/${randomUUID()}.${mime === "application/pdf" ? "pdf" : "jpg"}`
  const upload = await gate.db.storage.from(DOCUMENT_BUCKET).upload(path, bytes, { contentType: mime, upsert: false })
  if (upload.error) return NextResponse.json({ error: "Belge yüklenemedi. Lütfen yeniden dene." }, { status: 500 })

  const { data, error } = await gate.db
    .from("app_documents")
    .insert({
      user_id: gate.user.id,
      category,
      title: cleanTitle(form?.get("baslik")),
      storage_path: path,
      mime,
      size_bytes: bytes.length,
    })
    .select(DOCUMENT_COLUMNS)
    .single()
  if (error || !data) {
    await gate.db.storage.from(DOCUMENT_BUCKET).remove([path])
    return NextResponse.json({ error: "Belge kaydedilemedi. Lütfen yeniden dene." }, { status: 500 })
  }

  // Onay kaydı (app_consents) bu sürüm için bir kez yazılır; hasta onayı her yüklemede yeniler.
  const { data: consent } = await gate.db
    .from("app_consents")
    .select("id")
    .eq("user_id", gate.user.id)
    .eq("kind", "belge_paylasimi")
    .eq("version", CONSENT_VERSION)
    .limit(1)
  if (!consent || consent.length === 0) {
    const saved = await gate.db.from("app_consents").insert({ user_id: gate.user.id, kind: "belge_paylasimi", version: CONSENT_VERSION, granted: true })
    if (saved.error) console.error("Document consent row failed:", saved.error.message)
  }

  return NextResponse.json({ ok: true, document: toAppDocument(data) })
}

export async function DELETE(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const payload = await request.json().catch(() => null)
  if (typeof payload?.belge !== "string" || !UUID.test(payload.belge)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const { data: row } = await gate.db
    .from("app_documents")
    .select("storage_path")
    .eq("user_id", gate.user.id)
    .eq("id", payload.belge)
    .maybeSingle()
  if (!row) return NextResponse.json({ error: "Belge silinemedi." }, { status: 404 })

  // Önce dosya, sonra kayıt: dosya silinemezse kayıt durur ve hasta yeniden deneyebilir;
  // tersi olsaydı depoda kimsenin bulamayacağı bir sağlık belgesi kalırdı.
  const removal = await gate.db.storage.from(DOCUMENT_BUCKET).remove([row.storage_path])
  if (removal.error) return NextResponse.json({ error: "Belge silinemedi. Lütfen yeniden dene." }, { status: 500 })
  const { error } = await gate.db.from("app_documents").delete().eq("user_id", gate.user.id).eq("id", payload.belge)
  if (error) return NextResponse.json({ error: "Belge silinemedi. Lütfen yeniden dene." }, { status: 500 })
  return NextResponse.json({ ok: true })
}
