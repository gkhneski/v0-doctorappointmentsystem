import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTelegramChats } from "@/lib/telegram"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }
  const { data: adminUser } = await supabase.from("admin_users").select("id").eq("id", user.id).single()
  if (!adminUser) return { error: "Unauthorized" }
  return { error: null }
}

// Bota /start yazan kisilerin chat_id'lerini getirir
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const chats = await getTelegramChats()
    return NextResponse.json({ chats })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Chat listesi alinamadi" }, { status: 500 })
  }
}
