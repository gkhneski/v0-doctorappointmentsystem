import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildDigestForTypes, sendDueDigests, type ContentType } from "@/lib/staff-reminder"
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

const VALID: ContentType[] = ["today", "tomorrow", "unconfirmed", "cancelled"]

function parseTypes(raw: string | null | undefined): ContentType[] {
  if (!raw) return ["tomorrow"]
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ContentType => (VALID as string[]).includes(s))
  return parts.length ? parts : ["tomorrow"]
}

// GET -> secilen icerik turlerinin onizleme metni (gonderim yapmaz)
export async function GET(request: Request) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const types = parseTypes(new URL(request.url).searchParams.get("types"))

  try {
    const { text, totalCount } = await buildDigestForTypes(types)
    return NextResponse.json({ types, text, count: totalCount })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Onizleme hatasi" }, { status: 500 })
  }
}

// POST -> tek chat_id'ye test gonderimi (telegram_chat_id + types)
//         veya belirli bir saatteki tum alicilara "simdi gonder" (hour)
export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  try {
    if (body.telegram_chat_id) {
      const types = Array.isArray(body.types) && body.types.length ? (body.types as ContentType[]) : ["tomorrow"]
      const { text } = await buildDigestForTypes(types)
      const res = await sendTelegramMessage(String(body.telegram_chat_id).trim(), text)
      return NextResponse.json({ mode: "single", ...res })
    }

    // Belirli saatteki alicilara manuel tetikleme
    const hour = typeof body.hour === "number" ? body.hour : undefined
    const result = await sendDueDigests(hour)
    return NextResponse.json({ mode: "broadcast", ...result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Gonderim hatasi" }, { status: 500 })
  }
}
