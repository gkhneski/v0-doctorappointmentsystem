import { headers } from "next/headers"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { getRequestEvidence, recordAppointmentAudit } from "@/lib/appointment-audit"
import { AppointmentConfirmation } from "@/components/appointment-confirmation"

export const dynamic = 'force-dynamic'

export default async function ConfirmAppointmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  
  const supabase = createServiceRoleClient()

  // Fetch appointment by token
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      patients (full_name, phone),
      doctors (name)
    `
    )
    .eq("confirmation_token", token)
    .single()

  if (error || !appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Gecersiz Link</h1>
          <p className="mt-2 text-gray-600">Bu onay linki gecersiz veya suresi dolmus.</p>
        </div>
      </div>
    )
  }

  // Link tiklandi - ilk açılışı hem randevuya hem değiştirilemez işlem geçmişine kaydet.
  if (!appointment.link_clicked_at) {
    const openedAt = new Date().toISOString()
    const requestHeaders = await headers()
    const evidence = getRequestEvidence(requestHeaders)

    await supabase.from("appointments").update({ link_clicked_at: openedAt }).eq("id", appointment.id)
    try {
      await recordAppointmentAudit({
        patientId: appointment.patient_id,
        appointmentId: appointment.id,
        eventType: "link_opened",
        occurredAt: openedAt,
        patientName: appointment.patients?.full_name || "Bilinmeyen Hasta",
        patientPhone: appointment.patients?.phone,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        ...evidence,
      })
    } catch (auditError) {
      console.error("[v0] Link audit error:", auditError)
    }
  }

  return <AppointmentConfirmation appointment={appointment} token={token} />
}
