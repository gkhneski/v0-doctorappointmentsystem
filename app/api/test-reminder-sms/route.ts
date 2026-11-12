import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { sendSms } from "@/lib/sms"
import { SITE_URL } from "@/lib/site-url"
import { getDocumentListByType } from "@/lib/send-document-list-sms"
import { getAdminAuth } from "@/lib/admin-auth"
import { recordAppointmentAudit } from "@/lib/appointment-audit"
import { generateUrlToken } from "@/lib/secure-random"

export async function POST(request: Request) {
  try {
    const { user, adminUser } = await getAdminAuth()
    if (!user || !adminUser) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

    const { appointmentId } = await request.json()
    const supabase = createServiceRoleClient()
    const siteUrl = SITE_URL

    // Fetch appointment with patient info
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(`*, patients (full_name, phone)`)
      .eq("id", appointmentId)
      .single()

    if (error || !appointment) {
      return NextResponse.json({ error: "Randevu bulunamadi" }, { status: 404 })
    }

    // Generate or get existing token
    let token = appointment.confirmation_token
    if (!token) {
      token = generateUrlToken()
      await supabase.from("appointments").update({ confirmation_token: token }).eq("id", appointmentId)
    }

    const confirmUrl = `${siteUrl}/confirm/${token}`

    // Get document list
    const documents = appointment.appointment_type ? getDocumentListByType(appointment.appointment_type) : []
    const documentSection = documents.length > 0 ? `\nGetirmeniz gereken evraklar:\n${documents.join("\n")}\n` : ""

    const message = `Merhaba ${appointment.patients?.full_name},\n\nYarinki randevunuzu hatirlatmak isteriz.\nTarih: ${new Date(appointment.appointment_date).toLocaleDateString("tr-TR")}\nSaat: ${appointment.appointment_time}\n${documentSection}\nRandevunuza gelip gelmeyeceginizi lutfen bildirin:\n${confirmUrl}`

    // Send SMS
    const sms = await sendSms(appointment.patients?.phone, message)

    if (!sms.sent) {
      return NextResponse.json({ error: "SMS gonderilemedi: " + sms.code }, { status: 500 })
    }

    const sentAt = new Date().toISOString()
    await supabase.from("appointments").update({ reminder_sent_at: sentAt }).eq("id", appointmentId)
    await recordAppointmentAudit({
      patientId: appointment.patient_id,
      appointmentId: appointment.id,
      eventType: "reminder_sent",
      occurredAt: sentAt,
      patientName: appointment.patients?.full_name || "Bilinmeyen Hasta",
      patientPhone: appointment.patients?.phone,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      messageText: message,
      channel: "sms",
      deliveryStatus: "sent",
      providerReference: sms.reference,
    })

    return NextResponse.json({
      success: true,
      message: "Hatirlatma SMS gonderildi",
      token,
      confirmUrl,
    })
  } catch (error) {
    console.error("Test reminder SMS error:", error)
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 })
  }
}
