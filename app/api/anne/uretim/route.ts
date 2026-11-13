import { NextResponse } from "next/server"
import { consentBlock, requireAppUser } from "@/lib/anne/server"
import { MOMENT_BUCKET } from "@/lib/anne/animation/moments"
import { GENERATION_BUCKET, readState } from "@/lib/anne/generation/service"

// Bebek yüzü üretimi: durum, sonuç resmi ve silme. Her işlem oturumdaki hesaba süzülür.
// Resimler herkese kapalı depoda durur ve yalnızca sahibine, bu yol üzerinden verilir.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const picture = new URL(request.url).searchParams.get("resim")
  if (picture === null) {
    return NextResponse.json(await readState(gate.db, gate.user.id), { headers: { "Cache-Control": "no-store" } })
  }

  if (!UUID.test(picture)) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })
  const { data: row } = await gate.db
    .from("app_generations")
    .select("storage_path")
    .eq("user_id", gate.user.id)
    .eq("id", picture)
    .eq("status", "generated")
    .maybeSingle()
  if (!row?.storage_path) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })

  const { data: file, error } = await gate.db.storage.from(GENERATION_BUCKET).download(row.storage_path)
  if (error || !file) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })

  const download = new URL(request.url).searchParams.get("indir") === "1"
  return new NextResponse(file.stream(), {
    headers: {
      "Content-Type": "image/png",
      // Silinen resim tarayıcıda (özellikle ortak cihazda) kalmasın diye saklanmaz.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      ...(download ? { "Content-Disposition": 'attachment; filename="bebegimin-yuzu.png"' } : {}),
    },
  })
}

/** Bir sonucu (resim ya da başarısız deneme) siler. Silinen başarılı üretimin hakkı geri gelmez. */
export async function DELETE(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  const blocked = await consentBlock(gate)
  if (blocked) return blocked

  const payload = await request.json().catch(() => null)
  const target = typeof payload?.uretim === "string" ? payload.uretim : ""
  if (!UUID.test(target)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })

  const { data: row } = await gate.db
    .from("app_generations")
    .select("id, status, storage_path")
    .eq("user_id", gate.user.id)
    .eq("id", target)
    .maybeSingle()
  if (!row || row.status === "processing" || row.status === "draft") {
    return NextResponse.json({ error: "Silinemedi." }, { status: 404 })
  }

  if (row.status === "failed") {
    await gate.db.from("app_generations").delete().eq("user_id", gate.user.id).eq("id", target).eq("status", "failed")
    return NextResponse.json({ ok: true })
  }

  // Resim silinince ondan üretilmiş canlandırmalar (videolar) da silinir.
  const { data: moments } = await gate.db.from("app_moments").select("storage_path").eq("user_id", gate.user.id).eq("generation_id", target)
  const videos = (moments ?? []).map((m) => m.storage_path).filter((p): p is string => typeof p === "string")
  if (videos.length > 0) {
    const removal = await gate.db.storage.from(MOMENT_BUCKET).remove(videos)
    if (removal.error) return NextResponse.json({ error: "Silinemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  await gate.db.from("app_moments").delete().eq("user_id", gate.user.id).eq("generation_id", target)

  // Başarılı üretimin kaydı kalır (hak hesabı için); yalnızca resim dosyası silinir.
  if (row.storage_path) {
    const removal = await gate.db.storage.from(GENERATION_BUCKET).remove([row.storage_path])
    if (removal.error) return NextResponse.json({ error: "Silinemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  await gate.db.from("app_generations").update({ storage_path: null }).eq("user_id", gate.user.id).eq("id", target)
  return NextResponse.json({ ok: true })
}
