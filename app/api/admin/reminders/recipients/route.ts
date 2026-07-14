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

export async function GET() {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error: dbError } = await supabase
    .from("staff_recipients")
    .select("*")
    .order("created_at", { ascending: true })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })
  return NextResponse.json({ recipients: data })
}

export async function POST(request: Request) {
  const { error, supabase } = await requireAdmin()
  if (error || !supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { full_name, phone, role, receive_evening, receive_morning } = body

  if (!full_name || !phone) {
    return NextResponse.json({ error: "Ad ve telefon zorunludur" }, { status: 400 })
  }

  const { data, error: dbError } = await supabase
    .from("staff_recipients")
    .insert({
      full_name,
      phone,
      role: role || "hemsire",
      receive_evening: receive_evening ?? true,
      receive_morning: receive_morning ?? false,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })
  return NextResponse.json({ recipient: data })
}
