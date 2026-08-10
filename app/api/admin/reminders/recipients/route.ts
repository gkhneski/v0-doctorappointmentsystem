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
  const {
    full_name,
    telegram_chat_id,
    phone,
    role,
    send_hour,
    content_today,
    content_tomorrow,
    content_unconfirmed,
    content_cancelled,
  } = body

  if (!full_name || !telegram_chat_id) {
    return NextResponse.json({ error: "Ad ve Telegram Chat ID zorunludur" }, { status: 400 })
  }

  const hour = Number.isInteger(send_hour) && send_hour >= 0 && send_hour <= 23 ? send_hour : 19

  const { data, error: dbError } = await supabase
    .from("staff_recipients")
    .insert({
      full_name,
      telegram_chat_id: String(telegram_chat_id).trim(),
      phone: phone || null,
      role: role || "hemsire",
      send_hour: hour,
      content_today: content_today ?? false,
      content_tomorrow: content_tomorrow ?? true,
      content_unconfirmed: content_unconfirmed ?? false,
      content_cancelled: content_cancelled ?? false,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })
  return NextResponse.json({ recipient: data })
}
