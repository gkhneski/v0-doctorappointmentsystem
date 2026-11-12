import Link from "next/link"
import { redirect } from "next/navigation"
import { getAppUser } from "@/lib/anne/server"
import { todayInIstanbul } from "@/lib/anne/pregnancy"
import { WeekCalculator } from "@/components/anne/week-calculator"

export const dynamic = "force-dynamic"

// Girişsiz açılan sayfa: hafta hesabı herkes için çalışır; kayıtlar giriş ister.
export default async function AnnePage() {
  const user = await getAppUser()
  if (user) redirect(user.onboarded_at ? "/anne/ana" : "/anne/baslangic")

  return (
    <main>
      <header className="anne-bar">
        <span className="anne-brand">NeoBreed</span>
        <Link href="/anne/giris">Giriş yap</Link>
      </header>

      <h1>Gebeliğinizin kaçıncı haftasındasınız?</h1>
      <p className="anne-lead">
        Son adet tarihinizi ya da size söylenen tahmini doğum tarihini girin. Girdiğiniz tarih bu telefondan dışarı
        çıkmaz.
      </p>

      <WeekCalculator today={todayInIstanbul()} />

      <section className="anne-section">
        <h2>Haftanızı kaydedin</h2>
        <p>Giriş yaparsanız haftanız her açılışta hazır olur; tarihi yeniden girmeniz gerekmez.</p>
        <Link className="anne-button" data-kind="signal" href="/anne/giris">
          <span>Telefon numarasıyla giriş yap</span>
        </Link>
      </section>

      <section className="anne-section">
        <h2>Ne zaman beklemeden başvurmalı</h2>
        <p>Kanama, su gelmesi, bebek hareketlerinde azalma ve diğer işaretler tek sayfada.</p>
        <Link className="anne-button" data-kind="plain" href="/anne/tehlike-isaretleri">
          <span>Tehlike işaretleri</span>
        </Link>
      </section>

      <footer className="anne-foot">
        <p>
          Bu hesap yalnızca takvim hesabıdır. Gebelik haftanızı ve tahmini doğum tarihinizi muayenede doktorunuz
          belirler.
        </p>
        <p>Acil bir durumda 112 numarasını arayın.</p>
      </footer>
    </main>
  )
}
