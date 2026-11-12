import { NextResponse } from "next/server"
import { consentBlock, requireAppUser } from "@/lib/anne/server"

// Vizitede sorulacak sorular. Her işlem oturumdaki hesabın satırlarıyla sınırlıdır.

const MAX_OPEN = 50
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  const blocked = await consentBlock(gate)
  if (blocked) return blocked

  const payload = await request.json().catch(() => null)
  const text = typeof payload?.body === "string" ? payload.body.trim().replace(/\s+/g, " ") : ""
  if (text.length < 3 || text.length > 300) {
    return NextResponse.json({ error: "Soru 3 ile 300 karakter arasında olmalı." }, { status: 400 })
  }

  const { count } = await gate.db
    .from("app_visit_questions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", gate.user.id)
  if ((count ?? 0) >= MAX_OPEN) {
    return NextResponse.json({ error: "Liste doldu. Yeni soru eklemek için eskilerden silin." }, { status: 400 })
  }

  const { data, error } = await gate.db
    .from("app_visit_questions")
    .insert({ user_id: gate.user.id, body: text })
    .select("id, body, asked_at")
    .single()
  if (error || !data) {
    return NextResponse.json({ error: "Soru eklenemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  return NextResponse.json({ ok: true, question: { id: data.id, body: data.body, asked: Boolean(data.asked_at) } })
}

export async function PUT(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const payload = await request.json().catch(() => null)
  if (typeof payload?.question !== "string" || !UUID.test(payload.question) || typeof payload?.asked !== "boolean") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const { error } = await gate.db
    .from("app_visit_questions")
    .update({ asked_at: payload.asked ? new Date().toISOString() : null })
    .eq("user_id", gate.user.id)
    .eq("id", payload.question)
  if (error) {
    return NextResponse.json({ error: "Güncellenemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const payload = await request.json().catch(() => null)
  if (typeof payload?.question !== "string" || !UUID.test(payload.question)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const { error } = await gate.db.from("app_visit_questions").delete().eq("user_id", gate.user.id).eq("id", payload.question)
  if (error) {
    return NextResponse.json({ error: "Silinemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
