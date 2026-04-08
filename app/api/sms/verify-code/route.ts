import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: NextRequest) {
  try {
    const { phone, code, appointmentId, tc_no, date_of_birth } = await request.json()

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

    // Randevuyu onayla ve is_intermediate false yap
    await supabase
      .from("appointments")
      .update({ status: "confirmed", is_intermediate: false })
      .eq("id", appointmentId)

    // Randevunun patient_id'sini al
    const { data: appointment } = await supabase
      .from("appointments")
      .select("patient_id, patients(tc_no)")
      .eq("id", appointmentId)
      .single()

    if (appointment?.patient_id) {
      // Hasta bilgilerini güncelle — TEMP_ TC'sini gerçek TC ile değiştir
      const updateData: Record<string, string | boolean> = {
        kvkk_approved: true,
        kvkk_approved_at: verifiedAt,
        kvkk_approved_via: `SMS - ${phone} - Kod: ${code}`,
        phone: phone, // Telefonu güncelle
      }

      // TC numarası TEMP_ ile başlıyorsa gerçek TC'yi kaydet
      const existingTc = (appointment as any).patients?.tc_no
      if (tc_no && existingTc?.startsWith("TEMP_")) {
        console.log(`[v0] Updating TEMP TC ${existingTc} to real TC ${tc_no}`)
        updateData.tc_no = tc_no
        updateData.is_intermediate = false
      } else if (tc_no) {
        updateData.tc_no = tc_no
      }

      // Doğum tarihini de güncelle
      if (date_of_birth && date_of_birth !== "1900-01-01") {
        updateData.date_of_birth = date_of_birth
      }

      const { error: updateError } = await supabase
        .from("patients")
        .update(updateData)
        .eq("id", appointment.patient_id)

      if (updateError) {
        console.error("[v0] Patient update error:", updateError)
        // TC duplicate hatası olsa bile randevuyu onaylayalım, sadece uyarı log'u
        if (updateError.code === "23505") {
          console.warn("[v0] TC already exists, but appointment confirmed anyway")
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Randevu onaylandı ve hasta bilgileri güncellendi",
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
