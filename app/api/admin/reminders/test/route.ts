import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildDailyDigest, sendStaffDigest } from "@/lib/staff-reminder"
import { sendTelegramMessage } from "@/lib/telegram"

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

// GET -> aksam/sabah ozet metnini onizler (gonderim yapmaz)
export async function GET(request: Request) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const which = new URL(request.url).searchParams.get("which") === "morning" ? "morning" : "evening"
  const target = new Date()
  if (which === "evening") target.setDate(target.getDate() + 1)

  try {
    const { text, count } = await buildDailyDigest(target, which === "evening" ? "yarin" : "bugun")
    return NextResponse.json({ which, text, count })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Onizleme hatasi" }, { status: 500 })
  }
}

// POST -> ya tum alicilara gonderir (which) ya da tek numaraya test (phone)
export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const which = body.which === "morning" ? "morning" : "evening"

  try {
    // Tek chat_id'ye test gonderimi
    if (body.telegram_chat_id) {
      const target = new Date()
      if (which === "evening") target.setDate(target.getDate() + 1)
      const { text } = await buildDailyDigest(target, which === "evening" ? "yarin" : "bugun")
      const res = await sendTelegramMessage(String(body.telegram_chat_id).trim(), text)
      return NextResponse.json({ mode: "single", ...res })
    }

    // Tum alicilara gonderim
    const result = await sendStaffDigest(which)
    return NextResponse.json({ mode: "broadcast", ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Gonderim hatasi" }, { status: 500 })
  }
}
