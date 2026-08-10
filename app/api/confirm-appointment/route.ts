import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { token, action } = await request.json()

    if (!token || !action) {
      return NextResponse.json({ error: "Token ve işlem gerekli" }, { status: 400 })
    }

    if (!["confirm", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    const ipAddress = forwardedIp || request.headers.get("x-real-ip") || null
    const userAgent = request.headers.get("user-agent")?.slice(0, 1000) || null
    const responseType = action === "confirm" ? "confirmed" : "cancelled"

    const { data, error } = await supabase.rpc("record_appointment_response", {
      p_token: token,
      p_response: responseType,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    })

    if (error) {
      console.error("[v0] Confirmation audit error:", error)
      const status = error.message.includes("not found") ? 404 : 500
      return NextResponse.json({ error: status === 404 ? "Randevu bulunamadı" : "İşlem kaydedilemedi" }, { status })
    }

    if (data?.already_responded) {
      return NextResponse.json({ error: "Bu randevu zaten işlenmiş", status: data.status }, { status: 400 })
    }

    return NextResponse.json({ success: true, status: responseType })
  } catch (error: any) {
    console.error("[v0] Confirmation error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
