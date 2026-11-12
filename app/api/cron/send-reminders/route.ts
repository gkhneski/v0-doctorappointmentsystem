import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { sendSms } from "@/lib/sms"
import { SITE_URL } from "@/lib/site-url"
import { getDocumentListByType } from "@/lib/send-document-list-sms"
import { recordAppointmentAudit } from "@/lib/appointment-audit"
import { normalizePhone } from "@/lib/phone"
import { generateUrlToken } from "@/lib/secure-random"

function getTomorrowInIstanbul() {
  const istanbulNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }))
  istanbulNow.setDate(istanbulNow.getDate() + 1)
  return `${istanbulNow.getFullYear()}-${String(istanbulNow.getMonth() + 1).padStart(2, "0")}-${String(istanbulNow.getDate()).padStart(2, "0")}`
}

export async function GET(request: Request) {
  try {
    // CRON_SECRET tanimliysa gecerli Bearer header ZORUNLUDUR.
    // (Eski kod header yoksa geciyordu; boylece internetten herkes cron'u tetikleyebiliyordu.)
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServiceRoleClient()

    // Always calculate the reminder date in the clinic's timezone.
    const tomorrowDate = getTomorrowInIstanbul()

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
      console.error("Fetch error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: "No appointments to remind", count: 0 })
    }

    let successCount = 0
    let noPhoneCount = 0
    const siteUrl = SITE_URL

    for (const appointment of appointments) {
      // Hizli blok ile acilan kayitlarda telefon yoktur ("0000000000"); SMS denemeden atla.
      if (!normalizePhone(appointment.patients?.phone)) {
        noPhoneCount++
        continue
      }

      // Generate confirmation token if not exists
      let token = appointment.confirmation_token
      if (!token) {
        token = generateUrlToken()
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

      const smsResult = await sendSms(appointment.patients?.phone, message, { strictPhone: true })

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
          providerReference: smsResult.reference,
        })

        successCount++
      } else {
        console.error("Reminder SMS failed for appointment:", appointment.id, smsResult.reference)
      }
    }

    return NextResponse.json({
      message: "Reminders sent",
      total: appointments.length,
      success: successCount,
      skippedNoPhone: noPhoneCount,
    })
  } catch (error: any) {
    console.error("Cron error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
