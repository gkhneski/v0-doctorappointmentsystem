import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patient_id, appointment_id, phone, code } = body

    if (!patient_id || !appointment_id || !phone || !code) {
      return NextResponse.json(
        { error: "Gerekli bilgiler eksik" },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Kodu kontrol et
    const { data: verification, error } = await supabase
      .from("sms_verifications")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("appointment_id", appointment_id)
      .eq("verified", false)
      .maybeSingle()

    if (error) {
      console.error("[v0] SMS verification query error:", error)
      return NextResponse.json(
        { error: "Doğrulama hatası" },
        { status: 500 }
      )
    }

    if (!verification) {
      return NextResponse.json(
        { error: "Geçersiz kod" },
        { status: 400 }
      )
    }

    // Kod süresi dolmuş mu kontrol et
    const now = new Date()
    const expiresAt = new Date(verification.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: "Kod süresi dolmuş" },
        { status: 400 }
      )
    }

    const verifiedAt = new Date().toISOString()

    // Kodu verified olarak işaretle
    await supabase
      .from("sms_verifications")
      .update({ verified: true, verified_at: verifiedAt })
      .eq("id", verification.id)

    // Hastayı KVKK onaylı yap
    await supabase
      .from("patients")
      .update({
        kvkk_approved: true,
        kvkk_approved_at: verifiedAt,
        kvkk_approved_via: `SMS Onay - Admin Panel - ${phone}`,
      })
      .eq("id", patient_id)

    // Randevuyu onayla
    await supabase
      .from("appointments")
      .update({ 
        status: "confirmed",
        confirmation_status: "confirmed",
        confirmed_at: verifiedAt,
      })
      .eq("id", appointment_id)

    return NextResponse.json({
      success: true,
      message: "KVKK onayı tamamlandı",
    })
  } catch (error) {
    console.error("[v0] KVKK verify error:", error)
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    )
  }
}
