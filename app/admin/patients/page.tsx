import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { UserPlus } from "lucide-react"
import PatientsList from "@/components/admin/patients-list"

export default async function PatientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/admin/login")
  }

  // Layout'ta zaten kontrol edildi, sadece gerekli alanlar
  const [{ data: adminUser }, { data: patients }] = await Promise.all([
    supabase
      .from("admin_users")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("patients")
      .select("id, full_name, tc_no, phone, date_of_birth, kvkk_approved, created_at, profile_photo_url, is_blacklisted, blacklist_reason")
      .order("created_at", { ascending: false })
      .limit(200), // İlk 200 hasta
  ])

  if (!adminUser) {
    redirect("/auth/admin/login")
  }

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
          <h2 className="text-xl font-semibold text-gray-900">Hasta Listesi</h2>
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
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Tüm Hastalar</CardTitle>
                <CardDescription className="text-gray-600">
                  Hasta üzerine tıklayarak detaylı bilgi görüntüleyin
                </CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Yeni Hasta Ekle
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <PatientsList patients={patients || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
