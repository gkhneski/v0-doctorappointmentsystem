import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { sendDocumentListSMS } from "@/lib/send-document-list-sms"

export async function POST(request: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const { appointmentId } = await params
    const supabase = createServiceRoleClient()

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(`appointment_type, patients ( full_name, phone )`)
      .eq("id", appointmentId)
      .single()

    if (error || !appointment) {
      return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 })
    }

    const patient = appointment.patients as any
    if (!patient?.phone || patient.phone === "0000000000") {
      return NextResponse.json({ error: "Hastanın geçerli bir telefon numarası yok" }, { status: 400 })
    }
    if (!appointment.appointment_type) {
      return NextResponse.json({ error: "Randevu tipi belirtilmemiş" }, { status: 400 })
    }

    const sent = await sendDocumentListSMS(patient.phone, patient.full_name, appointment.appointment_type)

    if (!sent) {
      return NextResponse.json({ error: "SMS gönderilemedi" }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending document list SMS:", error)
    return NextResponse.json({ error: "Evrak SMS'i gönderilirken hata oluştu" }, { status: 500 })
  }
}
