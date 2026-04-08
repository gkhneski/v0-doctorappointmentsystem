import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/admin/login")
  }

  // admin_users tablosunda kayıtlı mı kontrol et ve role al
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (!adminUser) {
    await supabase.auth.signOut()
    redirect("/auth/admin/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar userRole={adminUser.role ?? null} />
      <main className="flex-1 w-full min-w-0">
        <div className="p-4 pt-16 lg:pt-4 lg:p-6 max-w-full overflow-x-hidden">{children}</div>
      </main>
    </div>
  )
}
