import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { sendAppointmentLinkSMS } from "@/lib/send-appointment-link-sms"
import { sendDocumentListSMS } from "@/lib/send-document-list-sms"

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  console.log("[v0] POST /api/appointments/verify called")
  console.log("[v0] Request URL:", request.url)
  console.log("[v0] Request method:", request.method)
  
  try {
    const body = await request.json()
    const { appointmentId, code } = body

    console.log("[v0] Verifying SMS code for appointment:", appointmentId)
    console.log("[v0] Code provided:", code)

    const supabase = createServiceRoleClient()

    // Find verification record
    const { data: verification, error: verificationError } = await supabase
      .from("sms_verifications")
      .select("*")
      .eq("appointment_id", appointmentId)
      .eq("verified", false)
      .maybeSingle()

    console.log("[v0] Verification query result:", { verification, verificationError })

    if (verificationError || !verification) {
      console.error("[v0] Verification record not found:", verificationError)
      return NextResponse.json({ error: "Doğrulama kaydı bulunamadı" }, { status: 404 })
    }

    // Check if code has expired
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ error: "Doğrulama kodu süresi doldu" }, { status: 400 })
    }

    // Verify code
    if (verification.code !== code) {
      console.log("[v0] Code mismatch - expected:", verification.code, "got:", code)
      return NextResponse.json({ error: "Geçersiz doğrulama kodu" }, { status: 400 })
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from("sms_verifications")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", verification.id)

    if (updateError) {
      console.error("[v0] Error updating verification:", updateError)
      throw updateError
    }

    // Update appointment status to confirmed
    const { error: appointmentError } = await supabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", appointmentId)

    if (appointmentError) {
      console.error("[v0] Error updating appointment:", appointmentError)
      throw appointmentError
    }

    console.log("[v0] Appointment verified successfully:", appointmentId)

    try {
      // Randevu ve hasta bilgilerini al
      const { data: appointmentData } = await supabase
        .from("appointments")
        .select(
          `
          id,
          patient_id,
          appointment_type,
          patients (
            full_name,
            phone
          )
        `,
        )
        .eq("id", appointmentId)
        .single()

      if (appointmentData && appointmentData.patients) {
        const patient = appointmentData.patients as any

        // 1. Onay SMS'i gonder
        await sendAppointmentLinkSMS(patient.phone, patient.full_name)

        // 2. Evrak listesi SMS'i ayri olarak gonder
        if (appointmentData.appointment_type) {
          await sendDocumentListSMS(patient.phone, patient.full_name, appointmentData.appointment_type)
          console.log("[v0] Document list SMS sent for type:", appointmentData.appointment_type)
        }
      }
    } catch (linkError) {
      // Link gönderme hatası randevu oluşturmayı engellemez
      console.error("[v0] Error sending appointment confirmation SMS:", linkError)
    }

    return NextResponse.json({
      success: true,
      message: "Randevunuz onaylandı",
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/appointments/verify:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Doğrulama sırasında bir hata oluştu" },
      { status: 500 },
    )
  }
}
