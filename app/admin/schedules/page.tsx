import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAdminAuth } from "@/lib/admin-auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Calendar, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import WeeklyPatternManager from "@/components/admin/weekly-pattern-manager" // Import WeeklyPatternManager
import ScheduleManager from "@/components/admin/schedule-manager" // Import ScheduleManager

export default async function SchedulesPage() {
  const supabase = await createClient()

  // Cache'li helper: layout ile ayni istekte paylasilir (ekstra auth gidis-donusu yok)
  const { user, adminUser } = await getAdminAuth()

  if (!user || !adminUser) {
    redirect("/auth/admin/login")
  }

  // Get all doctors
  const { data: doctors } = await supabase.from("doctors").select("*").order("name")

  // Get all schedules
  const { data: schedules } = await supabase
    .from("doctor_schedules")
    .select(
      `
      *,
      doctors:doctor_id (
        name,
        specialization
      )
    `,
    )
    .order("schedule_date")
    .order("start_time")

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-semibold">SağlıkSistemi Yönetici</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Program Yönetimi - {adminUser.role === "doktor" ? "Doktor" : "Sekreter"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Panele Dön
              </Link>
            </Button>
            <form action={handleSignOut}>
              <Button variant="outline" type="submit">
                Çıkış Yap
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Günlük Program Yönetimi</CardTitle>
            <CardDescription>
              2026 senesinin tüm iş günleri (Pazartesi-Cuma) önceden ayarlanmıştır. Gerekirse günlük düzenlemeler yapabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleManager doctors={doctors || []} schedules={schedules || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
