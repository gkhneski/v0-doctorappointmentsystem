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
    // Sadece token'in ait oldugu randevuya yazilir (istekteki appointmentId'ye guvenilmez).
    const targetAppointmentId = tokenData.appointment_id || appointmentId
    const { error: formError } = await supabase.from("appointment_forms").upsert(
      {
        appointment_id: targetAppointmentId,
        form_data: formData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "appointment_id",
      },
    )

    if (formError) {
      console.error("Form save error:", formError)
      return NextResponse.json({ error: "Form kaydedilemedi" }, { status: 500 })
    }

    // Token'ı kullanılmış olarak işaretle
    await markTokenAsUsed(token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Appointment link submit error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
