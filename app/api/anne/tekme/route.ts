import { NextResponse } from "next/server"
import { consentBlock, requireAppUser } from "@/lib/anne/server"

// Tekme sayacı oturumu. Yalnızca saklanır; sayı değerlendirilmez.

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  const blocked = await consentBlock(gate)
  if (blocked) return blocked

  const body = await request.json().catch(() => null)
  const count = Number(body?.count)
  const seconds = Number(body?.seconds)
  if (!Number.isInteger(count) || count < 1 || count > 500 || !Number.isInteger(seconds) || seconds < 0 || seconds > 86400) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const { error } = await gate.db
    .from("app_kick_sessions")
    .insert({ user_id: gate.user.id, kick_count: count, duration_seconds: seconds })
  if (error) {
    return NextResponse.json({ error: "Kaydedilemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
