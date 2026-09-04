import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { Calendar, Users, Clock } from "lucide-react"
import AppointmentsList from "@/components/admin/appointments-list"
import PatientsList from "@/components/admin/patients-list"
import { QuickBlockAppointment } from "@/components/admin/quick-block-appointment"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/admin/login")
  }

  // Verify admin access
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (adminError || !adminUser) {
    redirect("/auth/admin/login")
  }

  const today = new Date().toISOString().split("T")[0]

  // Get statistics and data in parallel - all queries at once
  const [
    { count: totalAppointments },
    { count: totalPatients },
    { count: totalDoctors },
    { data: appointments },
    { data: patients },
    { data: doctors },
  ] = await Promise.all([
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase.from("doctors").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_date,
        appointment_time,
        notes,
        status,
        confirmation_status,
        appointment_type,
        doctors:doctor_id (name, specialization),
        patients:patient_id (id, full_name, phone, tc_no, date_of_birth, kvkk_approved, kvkk_approved_at, kvkk_approved_via, medical_alerts)
      `,
      )
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true }),
    supabase
      .from("patients")
      .select("id, full_name, tc_no, phone, date_of_birth, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase.from("doctors").select("id, name, specialization").limit(1),
  ])

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const endDate = nextWeek.toISOString().split("T")[0]

  // Get available schedules for next week only
  const { data: schedules } = await supabase
    .from("doctor_schedules")
    .select(
      `
      schedule_date,
      start_time,
      end_time,
      doctors (id, name, specialization)
    `,
    )
    .eq("is_available", true)
    .gte("schedule_date", today)
    .lte("schedule_date", endDate)
    .order("schedule_date")
    .limit(20)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  // Declare pendingAppointments variable
  const pendingAppointments = appointments?.filter((a) => a.status === "pending").length || 0;

  // Declare appointmentsWithEvaluations variable
  const appointmentsWithEvaluations = appointments;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
            <QuickBlockAppointment />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{adminUser.full_name}</div>
              <div className="text-xs text-gray-600">{adminUser.role === "doktor" ? "Doktor" : "Sekreter"}</div>
            </div>
            <form action={handleSignOut}>
              <Button variant="outline" size="sm" type="submit" className="border-gray-300 bg-transparent">
                Çıkış Yap
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">Bugün</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Bekleyen Onaylar</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{pendingAppointments || 0}</div>
                <p className="mt-1 text-xs text-gray-600">Onay bekleyen randevular</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Bugünkü Randevular</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {appointments?.filter((a) => a.appointment_date === today).length || 0}
                </div>
                <p className="mt-1 text-xs text-gray-600">Bugün gerçekleşecek</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-3 text-sm font-medium text-gray-600">Toplam İstatistikler</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Toplam Randevu</CardTitle>
                <Calendar className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{totalAppointments || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Kayıtlı Hasta</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{totalPatients || 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="appointments" className="space-y-4">
          <div className="flex items-center justify-end mb-4">
            <Button asChild>
              <Link href="/admin/schedules">Programları Yönet</Link>
            </Button>
          </div>

          <TabsContent value="appointments" className="space-y-4">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-lg font-semibold text-gray-900">Randevu Listesi</CardTitle>
                <CardDescription className="text-gray-600">Hasta randevularını görüntüleyin ve yönetin</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <AppointmentsList appointments={appointments || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-lg font-semibold text-gray-900">Hasta Kayıtları</CardTitle>
                <CardDescription className="text-gray-600">Tüm hasta bilgilerini görüntüleyin</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <PatientsList patients={patients || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
