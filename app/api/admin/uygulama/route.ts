import { NextResponse } from "next/server"
import { changeAllowance, listAppAccounts } from "@/lib/app-accounts"
import { requireAdmin } from "@/lib/require-admin"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

// Hasta uygulaması hesapları: liste ve bebek yüzü üretim hakkı. Yalnızca personel.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  return NextResponse.json({ accounts: await listAppAccounts(createServiceRoleClient()) }, { headers: { "Cache-Control": "no-store" } })
}

/** Bir hesaba bir üretim hakkı verir (delta: 1) ya da kullanılmamış bir hakkı geri alır (delta: -1). */
export async function POST(request: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  const body = await request.json().catch(() => null)
  const account = typeof body?.account === "string" ? body.account : ""
  if (!UUID.test(account) || (body?.delta !== 1 && body?.delta !== -1)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const result = await changeAllowance(createServiceRoleClient(), account, body.delta, gate.user.id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true, allowance: result.allowance })
}
