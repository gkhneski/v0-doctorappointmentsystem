import { NextResponse } from "next/server"
import { sendDueDigests } from "@/lib/staff-reminder"

// Her saat basi calisir; o an Turkiye saatine (send_hour) denk gelen alicilara
// sectikleri icerigi (bugun/yarin/onaylanmamis/iptal) Telegram ile gonderir.
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sendDueDigests()
    console.log("[v0] Staff digest cron:", result)
    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    console.error("[v0] Staff digest cron error:", error?.message)
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 })
  }
}
