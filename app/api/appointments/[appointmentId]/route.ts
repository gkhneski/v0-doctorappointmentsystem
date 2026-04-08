import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { sendRescheduleSMS } from "@/lib/send-reschedule-sms"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params
    const body = await request.json()
    const { appointment_date, appointment_time, appointment_type, notes, status } = body

    const supabase = createServiceRoleClient()

    const updateData: Record<string, string | null> = {}
    if (appointment_date) updateData.appointment_date = appointment_date
    if (appointment_time) updateData.appointment_time = appointment_time
    if (appointment_type) updateData.appointment_type = appointment_type
    if (notes !== undefined) updateData.notes = notes
    if (status) updateData.status = status

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Guncellenecek veri bulunamadi" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select(`
        *,
        patients(full_name, phone),
        doctors(name)
      `)

    if (error) {
      console.error("[v0] Error updating appointment:", error)
      return NextResponse.json(
        { error: "Randevu guncellenirken hata olustu" },
        { status: 500 }
      )
    }

    // Tarih veya saat degistiyse hastaya SMS gonder (gecerli telefon varsa)
    const updatedAppointment = data?.[0]
    if (updatedAppointment && (appointment_date || appointment_time)) {
      const patientPhone = updatedAppointment.patients?.phone
      const patientName = updatedAppointment.patients?.full_name

      // Gecerli telefon kontrolu (0000000000 veya bos degilse)
      const isValidPhone = patientPhone && 
        patientPhone !== "0000000000" && 
        patientPhone.length >= 10

      if (isValidPhone && patientName) {
        try {
          await sendRescheduleSMS(
            patientPhone,
            patientName,
            updatedAppointment.appointment_date,
            updatedAppointment.appointment_time,
            updatedAppointment.appointment_type
          )
        } catch (smsError) {
          // SMS hatasi randevu guncellemeyi etkilememeli
          console.error("[v0] Reschedule SMS failed (non-blocking):", smsError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Randevu basariyla guncellendi",
      data,
    })
  } catch (error) {
    console.error("[v0] Error in update appointment:", error)
    return NextResponse.json(
      { error: "Beklenmeyen bir hata olustu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params

    console.log("[v0] Deleting appointment:", appointmentId)

    const supabase = createServiceRoleClient()

    // Delete the appointment
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId)

    if (error) {
      console.error("[v0] Error deleting appointment:", error)
      return NextResponse.json(
        { error: "Randevu silinirken hata oluştu" },
        { status: 500 }
      )
    }

    console.log("[v0] Appointment deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Randevu başarıyla silindi",
    })
  } catch (error) {
    console.error("[v0] Error in delete appointment:", error)
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu" },
      { status: 500 }
    )
  }
}
