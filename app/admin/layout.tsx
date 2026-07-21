import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getAdminAuth } from "@/lib/admin-auth"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Cache'li helper: bu cagri page.tsx ile ayni istekte paylasilir (tek Supabase gidis-donusu)
  const { user, adminUser } = await getAdminAuth()

  if (!user || !adminUser) {
    redirect("/auth/admin/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar userRole={adminUser.role ?? null} />
      <main className="flex-1 w-full min-w-0">
        <div className="p-4 pt-16 lg:pt-4 lg:p-6 max-w-full overflow-x-clip">{children}</div>
      </main>
    </div>
  )
}
