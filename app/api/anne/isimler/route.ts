import { NextResponse } from "next/server"
import { isKnownName } from "@/lib/anne/content/names"
import { requireAppUser } from "@/lib/anne/server"

// Beğenilen isimler. Yalnızca uygulamanın kendi listesindeki isimler kabul edilir.

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const body = await request.json().catch(() => null)
  if (!isKnownName(body?.name) || typeof body?.liked !== "boolean") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const table = gate.db.from("app_name_likes")
  const { error } = body.liked
    ? await table.upsert({ user_id: gate.user.id, name: body.name }, { onConflict: "user_id,name" })
    : await table.delete().eq("user_id", gate.user.id).eq("name", body.name)
  if (error) {
    return NextResponse.json({ error: "Kaydedilemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
