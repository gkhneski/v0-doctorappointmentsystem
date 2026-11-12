import { redirect } from "next/navigation"
import { AppAccounts } from "@/components/admin/app-accounts"
import { getAdminAuth } from "@/lib/admin-auth"
import { listAppAccounts } from "@/lib/app-accounts"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export const dynamic = "force-dynamic"

// Hasta uygulamasına giren hastalar ve bebek yüzü üretim hakları.
export default async function AdminUygulamaPage() {
  const { user, adminUser } = await getAdminAuth()
  if (!user || !adminUser) redirect("/auth/admin/login")

  const accounts = await listAppAccounts(createServiceRoleClient())
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date())
  const generated = accounts.reduce((sum, a) => sum + a.generated, 0)

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Hasta Uygulaması</h1>
        <p className="mt-1 text-sm text-gray-600">
          {accounts.length} hesap · {generated} bebek yüzü üretildi. Her hesabın ilk üretimi ücretsizdir; buradan ek hak verebilirsiniz. Hak
          yalnızca resim başarıyla üretilince düşer.
        </p>
      </div>
      <AppAccounts initial={accounts} today={today} />
    </div>
  )
}
