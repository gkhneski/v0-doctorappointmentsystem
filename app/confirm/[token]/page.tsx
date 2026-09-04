import { createServiceRoleClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppointmentConfirmation } from "@/components/appointment-confirmation"

export const dynamic = 'force-dynamic'

export default async function ConfirmAppointmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  
  console.log("[v0] Confirm page - token:", token)
  
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

  console.log("[v0] Confirm page - appointment found:", !!appointment)
  console.log("[v0] Confirm page - error:", error)

  if (error || !appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Geçersiz Link</h1>
          <p className="mt-2 text-gray-600">Bu onay linki geçersiz veya süresi dolmuş.</p>
          {error && <p className="mt-2 text-xs text-gray-400">Hata: {error.message}</p>}
        </div>
      </div>
    )
  }

  return <AppointmentConfirmation appointment={appointment} token={token} />
}
