import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { validateAppointmentToken, markTokenAsUsed } from "@/lib/generate-appointment-token"

export async function POST(request: NextRequest) {
  try {
    const { token, appointmentId, formData } = await request.json()

    // Token'ı validate et
    const tokenData = await validateAppointmentToken(token)

    if (!tokenData) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş link" }, { status: 403 })
    }

    const supabase = createServiceRoleClient()

    // Form verisini kaydet
    const { error: formError } = supabase.from("appointment_forms").upsert(
      {
        appointment_id: appointmentId,
        form_data: formData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "appointment_id",
      },
    )

    if (formError) {
      console.error("[v0] Form save error:", formError)
      return NextResponse.json({ error: "Form kaydedilemedi" }, { status: 500 })
    }

    // Token'ı kullanılmış olarak işaretle
    await markTokenAsUsed(token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Appointment link submit error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
