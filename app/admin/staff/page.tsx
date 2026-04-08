import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import StaffManagement from "@/components/admin/staff-management"

export default async function StaffPage() {
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

  // Only doctors can access staff management
  if (adminUser.role !== "doktor") {
    redirect("/admin")
  }

  const supabaseAdmin = createServiceRoleClient()
  const { data: staffMembers } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false })

  console.log("[v0] Staff members from DB:", staffMembers)

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
          <h2 className="text-xl font-semibold text-gray-900">Personel Yönetimi</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{adminUser.full_name}</div>
              <div className="text-xs text-gray-600">
                {adminUser.role === "doktor"
                  ? "Doktor"
                  : adminUser.role === "hemsire"
                    ? "Hemşire"
                    : "Sekreter"}
              </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Personel Listesi</CardTitle>
            <CardDescription>Sistem kullanıcılarını yönetin ve yeni personel ekleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <StaffManagement staffMembers={staffMembers || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
