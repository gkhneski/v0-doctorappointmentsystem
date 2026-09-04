import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram"
import { NextResponse } from "next/server"

// Hasta linkten randevusunu iptal edince tum aktif Telegram alicilarina anlik haber ver.
async function notifyStaffOfCancellation(
  supabase: ReturnType<typeof createServiceRoleClient>,
  details: { patient_name?: string; patient_phone?: string; appointment_date?: string; appointment_time?: string },
) {
  try {
    const { data: recipients } = await supabase
      .from("staff_recipients")
      .select("full_name, telegram_chat_id")
      .eq("is_active", true)
      .not("telegram_chat_id", "is", null)

    if (!recipients?.length) return

    const dateLabel = details.appointment_date
      ? new Date(details.appointment_date + "T12:00:00").toLocaleDateString("tr-TR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "-"
    const timeLabel = details.appointment_time ? String(details.appointment_time).slice(0, 5) : "-"

    const text =
      `<b>❌ Randevu İptali (Hasta Bildirimi)</b>\n\n` +
      `Hasta: <b>${escapeHtml(details.patient_name || "Bilinmeyen Hasta")}</b>\n` +
      `Telefon: ${escapeHtml(details.patient_phone || "-")}\n` +
      `Tarih: ${escapeHtml(dateLabel)}\n` +
      `Saat: <b>${escapeHtml(timeLabel)}</b>\n\n` +
      `Bu saat takvimde dolu görünmeye devam ediyor. Yerine yeni hasta vermek için admin panelini kullanın.`

    await Promise.all(
      recipients
        .filter((r) => r.telegram_chat_id)
        .map((r) => sendTelegramMessage(String(r.telegram_chat_id), text)),
    )
  } catch (err: any) {
    console.log("[v0] Telegram cancellation notify error:", err?.message)
  }
}

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
    console.error("[v0] Confirmation error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
