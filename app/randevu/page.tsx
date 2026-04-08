import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { Stethoscope } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AppointmentTypeSelector from "@/components/appointment-type-selector"
import { AIAppointmentAssistant } from "@/components/ai-appointment-assistant"

export default async function AppointmentPage() {
  const supabase = await createClient()

  const { data: doctors } = await supabase.from("doctors").select("*").order("name").limit(1)

  const today = new Date().toISOString().split("T")[0]
  const oneYearLater = new Date()
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
  const endDate = oneYearLater.toISOString().split("T")[0]

  const { data: schedules } = await supabase
    .from("doctor_schedules")
    .select(
      `
      *,
      doctors (
        id,
        name,
        specialization
      )
    `,
    )
    .eq("is_available", true)
    .gte("schedule_date", today)
    .lte("schedule_date", endDate)
    .order("schedule_date")
    .order("start_time")

  let existingAppointments: any[] = []

  try {
    const serviceSupabase = await createServiceRoleClient()
    const { data, error } = await serviceSupabase
      .from("appointments")
      .select("doctor_id, appointment_date, appointment_time")
      .gte("appointment_date", today)
      .neq("status", "cancelled")
      .or("is_intermediate.is.null,is_intermediate.eq.false") // Ara slotları hastalara gösterme

    if (error) {
      console.error("[v0] Error fetching appointments with service role:", error)
    } else {
      existingAppointments = data || []
    }
  } catch (serviceError) {
    console.error("[v0] Service role client failed, trying regular client:", serviceError)

    // Fallback to regular client
    const { data, error } = await supabase
      .from("appointments")
      .select("doctor_id, appointment_date, appointment_time")
      .gte("appointment_date", today)
      .neq("status", "cancelled")
      .or("is_intermediate.is.null,is_intermediate.eq.false")

    if (error) {
      console.error("[v0] Error fetching appointments with regular client:", error)
    } else {
      existingAppointments = data || []
    }
  }

  console.log("[v0] Fetched appointments count:", existingAppointments.length)
  console.log("[v0] Fetched schedules count:", schedules?.length || 0)
  console.log("[v0] Schedule dates:", schedules?.map(s => s.schedule_date).slice(0, 20))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">Prof. Dr. Eray Çalışkan</span>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">Ana Sayfa</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Randevu Al</h1>
          <p className="text-muted-foreground">Müsait bir saat seçin ve bilgilerinizi girin</p>
        </div>

        <AppointmentTypeSelector
          doctor={doctors?.[0] || null}
          schedules={schedules || []}
          existingAppointments={existingAppointments || []}
        />
      </div>

      {/* AI Appointment Assistant */}
      <AIAppointmentAssistant />
    </div>
  )
}
