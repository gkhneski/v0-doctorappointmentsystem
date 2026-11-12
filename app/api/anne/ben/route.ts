import { NextResponse } from "next/server"
import { deleteAccount } from "@/lib/anne/auth"
import { resolvePregnancyStart, todayInIstanbul } from "@/lib/anne/pregnancy"
import { clearSessionCookie, publicProfile, requireAppUser } from "@/lib/anne/server"

// Hastanın kendi hesabı. Her işlem oturumdaki hesabın kimliğiyle süzülür;
// istekten hesap kimliği okunmaz.

export async function GET(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  return NextResponse.json({ profile: publicProfile(gate.user) })
}

/** Başlangıç formu ve sonradan düzeltme: ad ve son adet / tahmini doğum tarihi. */
export async function PUT(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  const rawName = typeof body.displayName === "string" ? body.displayName.trim() : ""
  if (rawName.length > 60) {
    return NextResponse.json({ error: "Ad en fazla 60 karakter olabilir." }, { status: 400 })
  }

  const start = resolvePregnancyStart({ lmp: body.lmp, dueDate: body.dueDate }, todayInIstanbul())
  if (!start.ok) return NextResponse.json({ error: start.error }, { status: 400 })

  const { data, error } = await gate.db
    .from("app_users")
    .update({
      display_name: rawName || null,
      lmp_date: start.lmp,
      due_date: start.dueDate,
      due_date_source: start.source,
      onboarded_at: gate.user.onboarded_at ?? new Date().toISOString(),
    })
    .eq("id", gate.user.id)
    .select("id")

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "Kaydedilemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    profile: publicProfile({
      ...gate.user,
      display_name: rawName || null,
      lmp_date: start.lmp,
      due_date: start.dueDate,
      due_date_source: start.source,
      onboarded_at: gate.user.onboarded_at ?? new Date().toISOString(),
    }),
  })
}

/** Hesabı kalıcı olarak siler (mağaza kuralı ve KVKK). */
export async function DELETE(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  if (!(await deleteAccount(gate.db, gate.user))) {
    return NextResponse.json({ error: "Hesap silinemedi. Lütfen yeniden deneyin." }, { status: 500 })
  }
  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response)
  return response
}
