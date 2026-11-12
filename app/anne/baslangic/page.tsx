import { redirect } from "next/navigation"
import { getAppUser } from "@/lib/anne/server"
import { todayInIstanbul } from "@/lib/anne/pregnancy"
import { Blob, Screen, TopBar } from "@/components/anne/chrome"
import { StartForm } from "@/components/anne/start-form"

export const dynamic = "force-dynamic"

// İlk girişten sonra bir kez doldurulur. Bilgileri hasta kendisi girer; klinik kaydından alınmaz.
export default async function AnneBaslangicPage() {
  const user = await getAppUser()
  if (!user) redirect("/anne/giris")
  if (user.onboarded_at) redirect("/anne/ana")

  return (
    <Screen>
      <Blob tone="lilac" style={{ right: -130, top: -70, width: 320, height: 290 }} />
      <TopBar />
      <main className="nb-main">
        <h1 style={{ marginTop: 50 }}>
          Seni
          <br />
          <b>tanıyalım</b>
        </h1>
        <p className="nb-note nb-on-color" style={{ marginTop: 10, fontSize: 15 }}>
          Haftanı hesaplamak için bir tarih yeter. İkisini de sonradan Hesap ekranından değiştirebilirsin.
        </p>
        <StartForm today={todayInIstanbul()} submitLabel="Devam" next="/anne/onay" />
        <p className="nb-note" style={{ marginTop: 14, fontSize: 13 }}>
          Doktorun ultrasonla farklı bir tarih verdiyse &quot;Tahmini doğum&quot;u seç.
        </p>
      </main>
    </Screen>
  )
}
