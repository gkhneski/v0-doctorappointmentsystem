import { createServiceRoleClient } from "@/lib/supabase/service-role"
import crypto from "crypto"

export async function generateAppointmentAccessToken(appointmentId: string) {
  const supabase = createServiceRoleClient()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Güvenli rastgele token oluştur
  const token = crypto.randomBytes(32).toString("hex")

  const { data, error } = await supabase
    .from("appointment_access_tokens")
    .insert({
      token,
      appointment_id: appointmentId,
      expires_at: expiresAt.toISOString(),
    })
    .select("token")
    .single()

  if (error) {
    console.error("[v0] Error creating access token:", error)
    throw new Error("Token oluşturulamadı")
  }

  return data.token
}

export async function validateAppointmentToken(token: string) {
  console.log("[v0] Validating token:", token)

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("appointment_access_tokens")
    .select(`
      *,
      appointments (
        id,
        appointment_date,
        appointment_time,
        appointment_type,
        patient_id,
        doctor_id,
        doctors (
          name,
          specialization
        )
      )
    `)
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single()

  console.log("[v0] Token query result:", { data, error })

  if (error || !data) {
    return null
  }

  return data
}

export async function markTokenAsUsed(token: string) {
  // Token süresi dolmadan istediği kadar kullanılabilir
  return
}
