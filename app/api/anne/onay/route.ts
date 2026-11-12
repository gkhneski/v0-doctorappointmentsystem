import { NextResponse } from "next/server"
import { CONSENT_KINDS, hasRequired, latestConsents, recordConsents, type ConsentState } from "@/lib/anne/consents"
import { requireAppUser } from "@/lib/anne/server"

// Hastanın onayları. Her gönderim yeni satırlar ekler; eski satırlar kayıt olarak kalır.

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const changes: Partial<ConsentState> = {}
  for (const kind of CONSENT_KINDS) {
    if (typeof body[kind] === "boolean") changes[kind] = body[kind]
  }
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  if (!(await recordConsents(gate.db, gate.user.id, changes))) {
    return NextResponse.json({ error: "Onaylar kaydedilemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }

  const state = await latestConsents(gate.db, gate.user.id)
  return NextResponse.json({ ok: true, consents: state, complete: hasRequired(state) })
}
