import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SmsTemplatesManager } from "@/components/admin/sms-templates-manager"

export default async function SmsTemplatesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
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

  const { data: templates, error: templatesError } = await supabase
    .from("message_templates")
    .select("*")
    .eq("type", "sms")
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-900">{adminUser.full_name}</div>
            <div className="text-xs text-gray-600">
              {adminUser.role === "doktor" ? "Doktor" : adminUser.role === "hemsire" ? "Hemşire" : "Sekreter"}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <SmsTemplatesManager templates={templates || []} />
      </main>
    </div>
  )
}
