import { NextResponse } from "next/server"
import { sendStaffDigest } from "@/lib/staff-reminder"

// Her sabah 08:00 (TR) — bugunku randevu listesini sekretere WhatsApp ile gonderir.
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await sendStaffDigest("morning")
    console.log("[v0] Staff morning digest:", result)
    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    console.error("[v0] Staff morning cron error:", error?.message)
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 })
  }
}
