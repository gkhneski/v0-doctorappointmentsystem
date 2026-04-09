import { redirect } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Calendar, Users, Clock } from "lucide-react"
import AppointmentsList from "@/components/admin/appointments-list"
import WeeklyCalendar from "@/components/weekly-calendar"
import { QuickBlockAppointment } from "@/components/admin/quick-block-appointment"
import { NotificationsDropdown } from "@/components/admin/notifications-dropdown"
import { Spinner } from "@/components/ui/spinner"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/admin/login")
  }

  // Sadece gerekli alanları çek - layout'ta zaten kontrol edildi
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  if (!adminUser) {
    redirect("/auth/admin/login")
  }

  // Turkiye saatine gore bugunu hesapla (UTC+3)
  const turkeyTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }))
  const today = turkeyTime.toISOString().split("T")[0]

  // Sadece 2 ay ilerisini çek (performans için)
  const twoMonthsLater = new Date()
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2)
  const endDate = twoMonthsLater.toISOString().split("T")[0]

  // OPTİMİZE EDİLMİŞ: Tüm randevuları tek sorguda çekiyoruz
  const [
    { count: totalAppointments },
    { count: totalPatients },
    { data: allAppointments },
    { data: calendarDoctors },
  ] = await Promise.all([
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("patients").select("*", { count: "exact", head: true }),
    // TÜM randevuları tek sorguda çek (gelecek + geçmiş + iptal)
    supabase
      .from("appointments")
      .select(
        `
        id,
        doctor_id,
        patient_id,
        appointment_date,
        appointment_time,
        notes,
        status,
        confirmation_status,
        confirmed_at,
        reminder_sent_at,
        link_clicked_at,
        appointment_type,
        print_type,
        payment_status,
        payment_amount,
        fetal_bebek_sayisi,
        is_intermediate,
        created_at,
        doctors:doctor_id (name, specialization),
        patients:patient_id (id, full_name, phone, tc_no, date_of_birth, kvkk_approved, kvkk_approved_at, kvkk_approved_via, medical_alerts)
      `,
      )
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false })
      .limit(500), // Son 500 randevu yeterli
    supabase.from("doctors").select("id, name, specialization, working_hours").limit(1),
  ])

  // Client-side filtreleme (çok daha hızlı)
  const appointments = allAppointments?.filter(
    (a) => a.appointment_date >= today && a.appointment_date <= endDate
  ).sort((a, b) => {
    if (a.appointment_date !== b.appointment_date) {
      return a.appointment_date.localeCompare(b.appointment_date)
    }
    return (a.appointment_time || "").localeCompare(b.appointment_time || "")
  }) || []
  
  const existingAppointments = appointments // Calendar için aynı data
  
  const pastAppointments = allAppointments?.filter(
    (a) => a.appointment_date < today && a.status !== "cancelled"
  ).slice(0, 200) || []
  
  const cancelledAppointments = allAppointments?.filter(
    (a) => a.status === "cancelled"
  ).slice(0, 200) || []

  // Bu haftanın başı (Pazartesi) ve sonu (Pazar)
  const weekStart = new Date()
  const dayOfWeek = weekStart.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  weekStart.setDate(weekStart.getDate() + diffToMonday)
  const weekStartStr = weekStart.toISOString().split("T")[0]
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toISOString().split("T")[0]

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  // Declare pendingAppointments variable
  const pendingAppointments = appointments?.filter((a) => a.status === "pending").length || 0

  // Bu haftaki randevular (iptal edilenler hariç)
  const weeklyAppointments = appointments?.filter(
    (a) => a.appointment_date >= weekStartStr && a.appointment_date <= weekEndStr && a.status !== "cancelled"
  ) || []

  // Randevu tipi istatistikleri
  const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    "ilk-muayene":               { label: "İlk Muayene",            color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
    "kontrol-takip":             { label: "Kontrol / Takip",         color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
    "gebelik-istemi-infertilite":{ label: "Gebelik İstemi",          color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
    "jinekolojik-muayene":       { label: "Jinekolojik",             color: "text-pink-700",   bg: "bg-pink-50",   border: "border-pink-200" },
    "ayrintili-fetal-ultrason":  { label: "Fetal Ultrason",          color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
    "gebelik-takibi":            { label: "Gebelik Takibi",          color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-200" },
    "asilik-tup-bebek":          { label: "Aşılama / Tüp Bebek",     color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200" },
    "diger":                     { label: "Diğer",                   color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-200" },
  }

  const weeklyTypeCounts = weeklyAppointments.reduce<Record<string, number>>((acc, a) => {
    const type = a.appointment_type || "diger"
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const weeklyTypesSorted = Object.entries(weeklyTypeCounts)
    .sort(([, a], [, b]) => b - a)

  const appointmentsWithEvaluations = appointments

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
            <QuickBlockAppointment />
          </div>
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <div className="h-6 w-px bg-gray-200" />
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

        {/* Bu haftanın randevu tipi istatistikleri */}
        {weeklyTypesSorted.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">
                Bu Hafta — {weeklyAppointments.length} Randevu
              </h3>
              <span className="text-xs text-gray-400">
                {weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} –{" "}
                {weekEnd.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {weeklyTypesSorted.map(([type, count], idx) => {
                const cfg = TYPE_CONFIG[type] || TYPE_CONFIG["diger"]
                const pct = Math.round((count / weeklyAppointments.length) * 100)
                const isTop = idx === 0
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${cfg.bg} ${cfg.border} ${isTop ? "ring-2 ring-offset-1 ring-current/20" : ""}`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-bold ${cfg.color}`}>{count}</span>
                        <span className={`text-xs ${cfg.color} opacity-70`}>%{pct}</span>
                      </div>
                    </div>
                    {isTop && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        En Cok
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <Tabs defaultValue="appointments" className="space-y-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <TabsList className="h-9">
              <TabsTrigger value="calendar" className="text-sm gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Takvim
              </TabsTrigger>
              <TabsTrigger value="appointments" className="text-sm">
                Liste
              </TabsTrigger>
              <TabsTrigger value="past" className="text-sm gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Geçmiş
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-sm gap-1.5">
                <Users className="h-3.5 w-3.5" />
                İptal Edilenler
              </TabsTrigger>
            </TabsList>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/schedules">Programları Yönet</Link>
            </Button>
          </div>

          {/* Takvim tab — WeeklyCalendar doğrudan burada */}
          <TabsContent value="calendar">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">Randevu Takvimi</CardTitle>
                <CardDescription className="text-gray-600">Hasta adına randevu oluşturun veya mevcut randevuları yönetin</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <Suspense fallback={<div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8" /></div>}>
                  <WeeklyCalendar
                    doctor={calendarDoctors?.[0] || null}
                    schedules={schedules || []}
                    existingAppointments={existingAppointments || []}
                    isAdmin={true}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-lg font-semibold text-gray-900">Randevu Listesi</CardTitle>
                <CardDescription className="text-gray-600">Hasta randevularını görüntüleyin ve yönetin</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Suspense fallback={<div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8" /></div>}>
                  <AppointmentsList appointments={appointments || []} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-lg font-semibold text-gray-900">Geçmiş Randevular</CardTitle>
                <CardDescription className="text-gray-600">Tamamlanmış randevular (Son 200 kayıt)</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!pastAppointments || pastAppointments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Henüz geçmiş randevu bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(
                      pastAppointments.reduce<Record<string, typeof pastAppointments>>((acc, app) => {
                        const date = app.appointment_date
                        if (!acc[date]) acc[date] = []
                        acc[date].push(app)
                        return acc
                      }, {})
                    )
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([date, apps]) => (
                        <div key={date} className="space-y-2">
                          <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                            {new Date(date + "T00:00:00").toLocaleDateString("tr-TR", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </h3>
                          <div className="space-y-2">
                            {apps
                              .sort((a, b) => (b.appointment_time || "").localeCompare(a.appointment_time || ""))
                              .map((app) => (
                                <div
                                  key={app.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900">
                                        {app.patients?.full_name || "Hasta"}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {app.patients?.phone}
                                      </span>
                                    </div>
                                    {app.appointment_type && (
                                      <span className="text-xs text-gray-600">
                                        {
                                          TYPE_CONFIG[app.appointment_type as keyof typeof TYPE_CONFIG]?.label ||
                                          app.appointment_type
                                        }
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-mono text-gray-700">{app.appointment_time}</span>
                                    {app.payment_status === "paid" && (
                                      <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                        ₺{app.payment_amount}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                <CardTitle className="text-lg font-semibold text-gray-900">İptal Edilen Randevular</CardTitle>
                <CardDescription className="text-gray-600">İptal edilmiş randevular (Son 200 kayıt)</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {!cancelledAppointments || cancelledAppointments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>İptal edilen randevu bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cancelledAppointments.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {app.patients?.full_name || "Hasta"}
                            </span>
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">
                              İPTAL
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {app.patients?.phone && (
                              <span className="text-xs text-gray-600">{app.patients.phone}</span>
                            )}
                            {app.appointment_type && (
                              <span className="text-xs text-gray-500">
                                •{" "}
                                {TYPE_CONFIG[app.appointment_type as keyof typeof TYPE_CONFIG]?.label ||
                                  app.appointment_type}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-700">
                              {new Date(app.appointment_date + "T00:00:00").toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">{app.appointment_time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
