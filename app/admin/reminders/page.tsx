import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAdminAuth } from "@/lib/admin-auth"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { Button } from "@/components/ui/button"
import RemindersManagement from "@/components/admin/reminders-management"

export default async function RemindersPage() {
  const supabase = await createClient()

  // Cache'li helper: layout ile ayni istekte paylasilir (ekstra auth gidis-donusu yok)
  const { user, adminUser } = await getAdminAuth()

  if (!user || !adminUser) {
    redirect("/auth/admin/login")
  }

  const supabaseAdmin = createServiceRoleClient()
  const { data: recipients } = await supabaseAdmin
    .from("staff_recipients")
    .select("*")
    .order("created_at", { ascending: true })

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
          <h2 className="text-xl font-semibold text-gray-900">Hatırlatmalar</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{adminUser.full_name}</div>
              <div className="text-xs text-gray-600">
                {adminUser.role === "doktor" ? "Doktor" : adminUser.role === "hemsire" ? "Hemşire" : "Sekreter"}
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
        <RemindersManagement initialRecipients={recipients || []} />
      </div>
    </div>
  )
}
