import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized", supabase: null }
  const { data: adminUser } = await supabase.from("admin_users").select("id").eq("id", user.id).single()
  if (!adminUser) return { error: "Unauthorized", supabase: null }
  return { error: null, supabase }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const allowed: Record<string, any> = {}
  for (const key of ["full_name", "telegram_chat_id", "phone", "role", "receive_evening", "receive_morning", "is_active"]) {
    if (key in body) allowed[key] = body[key]
  }
  allowed.updated_at = new Date().toISOString()

  const { data, error: dbError } = await supabase
    .from("staff_recipients")
    .update(allowed)
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })
  return NextResponse.json({ recipient: data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error: dbError } = await supabase.from("staff_recipients").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
