import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { getDocumentListByType } from "@/lib/send-document-list-sms"
import { getAdminAuth } from "@/lib/admin-auth"
import { recordAppointmentAudit } from "@/lib/appointment-audit"

export async function POST(request: Request) {
  try {
    const { user, adminUser } = await getAdminAuth()
    if (!user || !adminUser) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })

    const { appointmentId } = await request.json()
    const supabase = createServiceRoleClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dreraycaliskan.com"

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
      token = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      await supabase.from("appointments").update({ confirmation_token: token }).eq("id", appointmentId)
    }

    const confirmUrl = `${siteUrl}/confirm/${token}`

    // Get document list
    const documents = appointment.appointment_type ? getDocumentListByType(appointment.appointment_type) : []
    const documentSection = documents.length > 0 ? `\nGetirmeniz gereken evraklar:\n${documents.join("\n")}\n` : ""

    const message = `Merhaba ${appointment.patients?.full_name},\n\nYarinki randevunuzu hatirlatmak isteriz.\nTarih: ${new Date(appointment.appointment_date).toLocaleDateString("tr-TR")}\nSaat: ${appointment.appointment_time}\n${documentSection}\nRandevunuza gelip gelmeyeceginizi lutfen bildirin:\n${confirmUrl}`

    // Send SMS
    const smsResponse = await fetch(
      "https://api.netgsm.com.tr/sms/send/get?" +
        new URLSearchParams({
          usercode: process.env.NETGSM_USER || "",
          password: process.env.NETGSM_PASSWORD || "",
          gsmno: appointment.patients?.phone || "",
          message: message,
          msgheader: process.env.NETGSM_HEADER || "",
        })
    )

    const smsResult = await smsResponse.text()

    if (!smsResult.startsWith("00")) {
      return NextResponse.json({ error: "SMS gonderilemedi: " + smsResult }, { status: 500 })
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
      providerReference: smsResult.trim(),
    })

    return NextResponse.json({
      success: true,
      message: "Hatirlatma SMS gonderildi",
      token,
      confirmUrl,
    })
  } catch (error) {
    console.error("[v0] Test reminder SMS error:", error)
    return NextResponse.json({ error: "Beklenmeyen hata" }, { status: 500 })
  }
}
