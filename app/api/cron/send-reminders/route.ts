import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { getDocumentListByType } from "@/lib/send-document-list-sms"
import { recordAppointmentAudit } from "@/lib/appointment-audit"

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function getTomorrowInIstanbul() {
  const istanbulNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }))
  istanbulNow.setDate(istanbulNow.getDate() + 1)
  return `${istanbulNow.getFullYear()}-${String(istanbulNow.getMonth() + 1).padStart(2, "0")}-${String(istanbulNow.getDate()).padStart(2, "0")}`
}

async function sendSMS(phone: string, message: string) {
  const netgsmUser = process.env.NETGSM_USER
  const netgsmPassword = process.env.NETGSM_PASSWORD
  const netgsmHeader = process.env.NETGSM_HEADER || "SAGLIK"

  if (!netgsmUser || !netgsmPassword) {
    console.error("[v0] NETGSM credentials not found")
    return { sent: false, providerReference: "credentials_missing" }
  }

  const cleanPhone = phone.replace(/\D/g, "")
  if (!/^0?5\d{9}$/.test(cleanPhone)) {
    console.error("[v0] Invalid patient phone format")
    return { sent: false, providerReference: "invalid_phone" }
  }

  const params = new URLSearchParams({
    usercode: netgsmUser,
    password: netgsmPassword,
    gsmno: cleanPhone,
    message,
    msgheader: netgsmHeader,
  })

  try {
    const response = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${params}`, {
      signal: AbortSignal.timeout(15_000),
    })
    const result = (await response.text()).trim()
    const sent = response.ok && (result.startsWith("00") || result.startsWith("01"))

    if (!sent) console.error("[v0] NETGSM rejected reminder:", result)
    return { sent, providerReference: result.slice(0, 200) }
  } catch (error) {
    console.error("[v0] SMS send error:", error)
    return { sent: false, providerReference: "network_error" }
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

    // Always calculate the reminder date in the clinic's timezone.
    const tomorrowDate = getTomorrowInIstanbul()

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

      const smsResult = await sendSMS(appointment.patients?.phone || "", message)

      if (smsResult.sent) {
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

        await recordAppointmentAudit({
          patientId: appointment.patient_id,
          appointmentId: appointment.id,
          eventType: "reminder_sent",
          patientName: appointment.patients?.full_name || "Bilinmeyen Hasta",
          patientPhone: appointment.patients?.phone,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
          messageText: message,
          channel: "sms",
          deliveryStatus: "accepted_by_provider",
          providerReference: smsResult.providerReference,
        })

        successCount++
      } else {
        console.error("[v0] Reminder SMS failed for appointment:", appointment.id, smsResult.providerReference)
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
