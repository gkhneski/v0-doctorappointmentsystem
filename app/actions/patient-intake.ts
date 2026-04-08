"use server"

import { createServiceRoleClient } from "@/lib/supabase/service-role"

type IntakeFlowAction =
  | { action: "verify_sms"; phone: string; smsCode: string; appointmentData: any }
  | { action: "save_intake_form"; patientId: string; intakeData: any }
  | { action: "upload_documents"; patientId: string; appointmentId: string; documents: any[] }

export async function createPatientIntakeFlow(params: IntakeFlowAction) {
  const supabase = createServiceRoleClient()

  try {
    if (params.action === "verify_sms") {
      const { data: verification, error: verifyError } = await supabase
        .from("sms_verifications")
        .select("*")
        .eq("phone", params.phone)
        .eq("code", params.smsCode)
        .eq("verified", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle()

      if (verifyError || !verification) {
        return { success: false, error: "Geçersiz veya süresi dolmuş SMS kodu" }
      }

      // Mark as verified
      await supabase
        .from("sms_verifications")
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq("id", verification.id)

      let { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("phone", params.phone)
        .maybeSingle()

      if (!patient) {
        // Create new patient
        const { data: newPatient, error: createError } = await supabase
          .from("patients")
          .insert({
            phone: params.phone,
            full_name: "Telefon ile kayıtlı hasta",
            has_completed_intake_form: false,
          })
          .select()
          .single()

        if (createError) {
          return { success: false, error: "Hasta kaydı oluşturulamadı" }
        }

        patient = newPatient
      }

      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: patient.id,
          doctor_id: params.appointmentData.doctor_id,
          appointment_date: params.appointmentData.appointment_date,
          appointment_time: params.appointmentData.appointment_time,
          status: "pending",
          notes: JSON.stringify({ appointment_type: params.appointmentData.appointment_type }),
        })
        .select()
        .single()

      if (appointmentError) {
        return { success: false, error: "Randevu oluşturulamadı: " + appointmentError.message }
      }

      return {
        success: true,
        data: {
          patient_id: patient.id,
          appointment_id: appointment.id,
          has_completed_intake_form: patient.has_completed_intake_form || false,
        },
      }
    }

    if (params.action === "save_intake_form") {
      const { error } = await supabase
        .from("patients")
        .update({
          intake_form_data: params.intakeData,
          has_completed_intake_form: true,
          intake_completed_at: new Date().toISOString(),
        })
        .eq("id", params.patientId)

      if (error) {
        return { success: false, error: "Form kaydedilemedi: " + error.message }
      }

      return { success: true }
    }

    if (params.action === "upload_documents") {
      // In production, you would upload files to Vercel Blob or Supabase Storage
      // For now, we'll just skip this step
      console.log("[v0] Documents would be uploaded here:", params.documents)
      return { success: true }
    }

    return { success: false, error: "Geçersiz işlem" }
  } catch (error: any) {
    console.error("[v0] Patient intake flow error:", error)
    return { success: false, error: error.message || "Beklenmeyen hata" }
  }
}
