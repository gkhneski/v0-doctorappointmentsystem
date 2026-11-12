import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { ALBUM_BUCKET, consentBlock, requireAppUser } from "@/lib/anne/server"

// Albüm fotoğrafları. Dosyalar herkese kapalı depoda durur ve yalnızca sahibine,
// bu yol üzerinden verilir; depoya doğrudan bağlantı yoktur.

const MAX_BYTES = 4 * 1024 * 1024
const MAX_PHOTOS = 120
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Dosyanın gerçekten JPEG olduğunu ilk baytlarından denetler. */
function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

export async function GET(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const photo = new URL(request.url).searchParams.get("photo") ?? ""
  if (!UUID.test(photo)) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })

  const { data: row } = await gate.db
    .from("app_photos")
    .select("storage_path")
    .eq("user_id", gate.user.id)
    .eq("id", photo)
    .maybeSingle()
  if (!row) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })

  const { data: file, error } = await gate.db.storage.from(ALBUM_BUCKET).download(row.storage_path)
  if (error || !file) return NextResponse.json({ error: "Bulunamadı." }, { status: 404 })

  return new NextResponse(file.stream(), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
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
  const kind = form?.get("kind")
  const week = Number(form?.get("week"))
  const file = form?.get("file")
  if ((kind !== "karin" && kind !== "ultrason") || !Number.isInteger(week) || week < 0 || week > 44 || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fotoğraf çok büyük. Lütfen başka bir fotoğraf deneyin." }, { status: 400 })
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!isJpeg(bytes)) {
    return NextResponse.json({ error: "Bu dosya bir fotoğraf değil." }, { status: 400 })
  }

  const { count } = await gate.db.from("app_photos").select("id", { count: "exact", head: true }).eq("user_id", gate.user.id)
  if ((count ?? 0) >= MAX_PHOTOS) {
    return NextResponse.json({ error: "Albüm doldu. Yeni fotoğraf için eskilerden silin." }, { status: 400 })
  }

  const path = `${gate.user.id}/${randomUUID()}.jpg`
  const upload = await gate.db.storage.from(ALBUM_BUCKET).upload(path, bytes, { contentType: "image/jpeg", upsert: false })
  if (upload.error) {
    return NextResponse.json({ error: "Fotoğraf yüklenemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }

  const { data, error } = await gate.db
    .from("app_photos")
    .insert({ user_id: gate.user.id, kind, week, storage_path: path })
    .select("id, kind, week")
    .single()
  if (error || !data) {
    await gate.db.storage.from(ALBUM_BUCKET).remove([path])
    return NextResponse.json({ error: "Fotoğraf kaydedilemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  return NextResponse.json({ ok: true, photo: data })
}

export async function DELETE(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const payload = await request.json().catch(() => null)
  if (typeof payload?.photo !== "string" || !UUID.test(payload.photo)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const { data: row } = await gate.db
    .from("app_photos")
    .delete()
    .eq("user_id", gate.user.id)
    .eq("id", payload.photo)
    .select("storage_path")
    .maybeSingle()
  if (!row) return NextResponse.json({ error: "Fotoğraf silinemedi." }, { status: 404 })

  await gate.db.storage.from(ALBUM_BUCKET).remove([row.storage_path])
  return NextResponse.json({ ok: true })
}
