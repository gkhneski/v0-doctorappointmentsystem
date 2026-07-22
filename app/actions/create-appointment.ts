"use server"

import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { resolvePatientId } from "@/lib/resolve-patient"

export async function createAppointment(data: {
  patientData: {
    tc_no: string
    full_name: string
    phone: string
    birth_date: string
  }
  appointmentData: {
    doctor_id: string
    appointment_date: string
    appointment_time: string
    appointment_type: string
    referral_doctor?: string
  }
}) {
  const supabase = await createServiceRoleClient()

  try {
    // Hasta kaydını çöz: gerçek TC → aynı telefonlu geçici kaydı yükselt → yeni kayıt
    // (duplicate oluşmasını engeller)
    const patientId = await resolvePatientId(supabase, {
      tc_no: data.patientData.tc_no,
      full_name: data.patientData.full_name,
      phone: data.patientData.phone,
      date_of_birth: data.patientData.birth_date,
    })

    // Create appointment with notes containing extra data
    const notes = JSON.stringify({
      appointment_type: data.appointmentData.appointment_type,
      referral_doctor: data.appointmentData.referral_doctor || null,
    })

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        doctor_id: data.appointmentData.doctor_id,
        appointment_date: data.appointmentData.appointment_date,
        appointment_time: data.appointmentData.appointment_time,
        status: "pending",
        notes,
      })
      .select()
      .single()

    if (appointmentError) throw appointmentError

    return { success: true, data: appointment }
  } catch (error) {
    console.error("[v0] Server action error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Randevu oluşturulamadı",
    }
  }
}
