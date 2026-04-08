import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: NextRequest) {
  try {
    const { phone, code, appointmentId } = await request.json()

    const supabase = await createServiceRoleClient()

    // Kodu kontrol et
    const { data: verification, error } = await supabase
      .from("sms_verifications")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("appointment_id", appointmentId)
      .eq("verified", false)
      .maybeSingle()

    if (error) {
      console.error("[v0] SMS verification query error:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Doğrulama hatası",
        },
        { status: 500 },
      )
    }

    if (!verification) {
      return NextResponse.json(
        {
          success: false,
          message: "Geçersiz kod",
        },
        { status: 400 },
      )
    }

    // Kod süresi dolmuş mu kontrol et
    const now = new Date()
    const expiresAt = new Date(verification.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Kod süresi dolmuş",
        },
        { status: 400 },
      )
    }

    const verifiedAt = new Date().toISOString()

    // Kodu verified olarak işaretle
    await supabase
      .from("sms_verifications")
      .update({ verified: true, verified_at: verifiedAt })
      .eq("id", verification.id)

    // Randevuyu onayla
    await supabase.from("appointments").update({ status: "confirmed" }).eq("id", appointmentId)

    // Hastanın KVKK onay tarihini ve kanalını kaydet
    const { data: appointment } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("id", appointmentId)
      .single()

    if (appointment?.patient_id) {
      await supabase
        .from("patients")
        .update({
          kvkk_approved: true,
          kvkk_approved_at: verifiedAt,
          kvkk_approved_via: `SMS - ${phone} - Kod: ${code}`,
        })
        .eq("id", appointment.patient_id)
    }

    return NextResponse.json({
      success: true,
      message: "Randevu onaylandı",
    })
  } catch (error) {
    console.error("[v0] Kod doğrulama hatası:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Doğrulama hatası",
      },
      { status: 500 },
    )
  }
}
