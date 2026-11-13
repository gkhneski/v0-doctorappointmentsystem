import { NextResponse } from "next/server"
import { findDocumentForStaff, listDocumentsForAccount, listDocumentsForPatient, markDocumentSeen } from "@/lib/app-documents"
import { requireAdmin } from "@/lib/require-admin"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

// Hastaların uygulamadan yüklediği belgeler. Yalnızca personel.
//   ?hasta=<klinik hasta kimliği>   o hastanın belgeleri (hasta kartında gösterilir)
//   ?hesap=<uygulama hesabı>        o hesabın belgeleri (Hasta Uygulaması ekranı)
//   ?dosya=<belge kimliği>          dosyanın kendisi; ilk açılışta "görüldü" işaretlenir

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BUCKET = "anne-belge"
const NO_STORE = { "Cache-Control": "private, no-store" }

export async function GET(request: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  const params = new URL(request.url).searchParams
  const db = createServiceRoleClient()

  const file = params.get("dosya")
  if (file !== null) {
    if (!UUID.test(file)) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
    const found = await findDocumentForStaff(db, file)
    if (!found) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
    const { data: blob, error } = await db.storage.from(BUCKET).download(found.path)
    if (error || !blob) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
    await markDocumentSeen(db, found.id)
    const pdf = found.mime === "application/pdf"
    return new NextResponse(blob.stream(), {
      headers: {
        "Content-Type": pdf ? "application/pdf" : "image/jpeg",
        "Content-Disposition": `inline; filename="hasta-belgesi.${pdf ? "pdf" : "jpg"}"`,
        "X-Content-Type-Options": "nosniff",
        ...NO_STORE,
      },
    })
  }

  const patient = params.get("hasta")
  if (patient !== null) {
    if (!UUID.test(patient)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
    return NextResponse.json({ documents: await listDocumentsForPatient(db, patient) }, { headers: NO_STORE })
  }

  const account = params.get("hesap")
  if (account !== null && UUID.test(account)) {
    return NextResponse.json({ documents: await listDocumentsForAccount(db, account) }, { headers: NO_STORE })
  }
  return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
}
