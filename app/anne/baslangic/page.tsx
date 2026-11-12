import { redirect } from "next/navigation"
import { getAppUser } from "@/lib/anne/server"
import { todayInIstanbul } from "@/lib/anne/pregnancy"
import { StartForm } from "@/components/anne/start-form"

export const dynamic = "force-dynamic"

// İlk girişten sonra bir kez doldurulur. Bilgileri hasta kendisi girer; klinik kaydından alınmaz.
export default async function AnneBaslangicPage() {
  const user = await getAppUser()
  if (!user) redirect("/anne/giris")
  if (user.onboarded_at) redirect("/anne/ana")

  return (
    <main>
      <header className="anne-bar">
        <span className="anne-brand">NeoBreed</span>
      </header>

      <h1>Başlayalım</h1>
      <p className="anne-lead">
        Haftanızı hesaplayabilmemiz için bir tarih gerekiyor. Sonradan Hesap sayfasından düzeltebilirsiniz.
      </p>

      <StartForm today={todayInIstanbul()} submitLabel="Kaydet" />
    </main>
  )
}
