import { createServiceRoleClient } from "@/lib/supabase/service-role"
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

  // Link tiklandi - link_clicked_at kaydet (ilk tiklamada)
  if (!appointment.link_clicked_at) {
    await supabase
      .from("appointments")
      .update({ link_clicked_at: new Date().toISOString() })
      .eq("id", appointment.id)
  }

  return <AppointmentConfirmation appointment={appointment} token={token} />
}
