import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { getDocumentListByType } from "@/lib/send-document-list-sms"

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

async function sendSMS(phone: string, message: string) {
  const netgsmUser = process.env.NETGSM_USER
  const netgsmPassword = process.env.NETGSM_PASSWORD
  const netgsmHeader = process.env.NETGSM_HEADER || "SAGLIK"

  if (!netgsmUser || !netgsmPassword) {
    console.error("[v0] NETGSM credentials not found")
    return false
  }

  const cleanPhone = phone.replace(/\D/g, "")
  const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${netgsmUser}&password=${netgsmPassword}&gsmno=${cleanPhone}&message=${encodeURIComponent(message)}&msgheader=${netgsmHeader}`

  try {
    const response = await fetch(url)
    const result = await response.text()
    console.log("[v0] SMS result:", result)
    return result.includes("00") || result.includes("01")
  } catch (error) {
    console.error("[v0] SMS send error:", error)
    return false
  }
}

export async function GET(request: Request) {
  try {
    // CRON_SECRET opsiyoneldir - Vercel Cron Jobs kullanildiginda otomatik eklenir
    // Manuel test icin veya CRON_SECRET yoksa dogrudan calisir
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")
    
    // Sadece CRON_SECRET varsa ve authorization header varsa kontrol et
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServiceRoleClient()

    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split("T")[0]

    console.log("[v0] Checking appointments for:", tomorrowDate)

    // Find appointments for tomorrow that haven't received reminder
    // Include both scheduled and confirmed appointments
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        patients (full_name, phone)
      `
      )
      .eq("appointment_date", tomorrowDate)
      .in("status", ["scheduled", "confirmed"])
      .is("reminder_sent_at", null)

    if (error) {
      console.error("[v0] Fetch error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      console.log("[v0] No appointments to remind")
      return NextResponse.json({ message: "No appointments to remind", count: 0 })
    }

    console.log("[v0] Found appointments:", appointments.length)

    let successCount = 0
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dreraycaliskan.com"

    for (const appointment of appointments) {
      // Generate confirmation token if not exists
      let token = appointment.confirmation_token
      if (!token) {
        token = generateToken()
        await supabase.from("appointments").update({ confirmation_token: token }).eq("id", appointment.id)
      }

      const confirmUrl = `${siteUrl}/confirm/${token}`

      // Evrak listesini randevu tipine gore olustur
      const documents = appointment.appointment_type
        ? getDocumentListByType(appointment.appointment_type)
        : []
      const documentSection = documents.length > 0
        ? `\nGetirmeniz gereken evraklar:\n${documents.join("\n")}\n`
        : ""

      const message = `Merhaba ${appointment.patients?.full_name},\n\nYarinki randevunuzu hatirlatmak isteriz.\nTarih: ${new Date(appointment.appointment_date).toLocaleDateString("tr-TR")}\nSaat: ${appointment.appointment_time}\n${documentSection}\nRandevunuza gelip gelmeyeceginizi lutfen bildirin:\n${confirmUrl}`

      const sent = await sendSMS(appointment.patients?.phone || "", message)

      if (sent) {
        // Mark as sent
        await supabase
          .from("appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", appointment.id)

        // Log to sent_messages
        await supabase.from("sent_messages").insert({
          patient_id: appointment.patient_id,
          message_content: message,
          channel: "sms",
          status: "sent",
          phone_number: appointment.patients?.phone,
        })

        successCount++
      }
    }

    console.log("[v0] Reminders sent:", successCount)

    return NextResponse.json({
      message: "Reminders sent",
      total: appointments.length,
      success: successCount,
    })
  } catch (error: any) {
    console.error("[v0] Cron error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
