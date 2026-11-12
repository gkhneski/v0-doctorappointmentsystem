import Link from "next/link"
import { redirect } from "next/navigation"
import { appDb, getAppUser } from "@/lib/anne/server"
import { hasRequired, latestConsents } from "@/lib/anne/consents"
import { Blob, Screen, TopBar } from "@/components/anne/chrome"
import { ConsentForm } from "@/components/anne/consent-form"

export const dynamic = "force-dynamic"

// Onaylar. İlk girişte başlangıç formundan sonra gelir; sonradan Hesap ekranından da açılır.
export default async function AnneOnayPage() {
  const user = await getAppUser()
  if (!user) redirect("/anne/giris")
  if (!user.onboarded_at) redirect("/anne/baslangic")

  const state = await latestConsents(appDb(), user.id)
  const returning = hasRequired(state)

  return (
    <Screen>
      <Blob style={{ right: -110, top: -60, width: 340, height: 300 }} />
      <TopBar>
        {returning && (
          <Link className="nb-skip" href="/anne/hesap">
            Geri
          </Link>
        )}
      </TopBar>
      <main className="nb-main">
        <h1 style={{ marginTop: 50 }}>
          Verilerin
          <br />
          <b>senin</b>
        </h1>
        <p className="nb-note nb-on-color" style={{ marginTop: 10, fontSize: 15 }}>
          Neyi kabul ettiğini tek tek seç. Hepsini sonradan geri alabilirsin; zorunlu olanları geri alırsan kayıt
          ekranları kapanır.
        </p>
        <ConsentForm
          initial={state}
          submitLabel={returning ? "Kaydet" : "Kabul et ve başla"}
          next={returning ? "/anne/hesap" : "/anne/ana"}
        />
      </main>
    </Screen>
  )
}
