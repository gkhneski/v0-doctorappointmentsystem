import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import WeeklyCalendar from "@/components/weekly-calendar"
import { QuickBlockAppointment } from "@/components/admin/quick-block-appointment"

export default async function CreateAppointmentPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/admin/login")
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (adminError || !adminUser) {
    redirect("/auth/admin/login")
  }

  const { data: doctors } = await supabase.from("doctors").select("id, name, specialization, working_hours").order("name").limit(1)

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

  const { data: existingAppointments } = await supabase
    .from("appointments")
    .select(`
      id,
      doctor_id,
      patient_id,
      appointment_date,
      appointment_time,
      appointment_type,
      notes,
      patients (
        full_name,
        phone
      )
    `)
    .gte("appointment_date", today)
    .neq("status", "cancelled")

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Randevu Oluştur</h2>
            <QuickBlockAppointment />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{adminUser.full_name}</div>
              <div className="text-xs text-gray-600">{adminUser.role === "doktor" ? "Doktor" : "Sekreter"}</div>
            </div>
            <form action={handleSignOut}>
              <Button variant="outline" size="sm" type="submit">
                Çıkış Yap
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle>Yeni Randevu Oluştur</CardTitle>
            <CardDescription>Hasta adına randevu oluşturun</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyCalendar
              doctor={doctors?.[0] || null}
              schedules={schedules || []}
              existingAppointments={existingAppointments || []}
              isAdmin={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
