import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { notifyStaffOfCancellation } from "@/lib/cancellation-notice"
import { NextResponse } from "next/server"
import { isConfirmationExpired } from "@/lib/confirmation-view"

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

    // Gecmis randevularin baglantisi islem yapmaz (baglanti suresiz kalmasin).
    if (typeof token !== "string") {
      return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 })
    }
    const { data: tokenRows } = await supabase
      .from("appointments")
      .select("appointment_date")
      .eq("confirmation_token", token)
      .limit(1)
    if (tokenRows?.[0] && isConfirmationExpired(tokenRows[0].appointment_date)) {
      return NextResponse.json({ error: "Bu bağlantının süresi dolmuş" }, { status: 410 })
    }

    const { data, error } = await supabase.rpc("record_appointment_response", {
      p_token: token,
      p_response: responseType,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    })

    if (error) {
      console.error("Confirmation audit error:", error)
      const status = error.message.includes("not found") ? 404 : 500
      return NextResponse.json({ error: status === 404 ? "Randevu bulunamadı" : "İşlem kaydedilemedi" }, { status })
    }

    if (data?.already_responded) {
      return NextResponse.json({ error: "Bu randevu zaten işlenmiş", status: data.status }, { status: 400 })
    }

    if (responseType === "cancelled") {
      await notifyStaffOfCancellation(supabase, {
        patient_name: data?.patient_name,
        patient_phone: data?.patient_phone,
        appointment_date: data?.appointment_date,
        appointment_time: data?.appointment_time,
      })
    }

    return NextResponse.json({ success: true, status: responseType })
  } catch (error: any) {
    console.error("Confirmation error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
