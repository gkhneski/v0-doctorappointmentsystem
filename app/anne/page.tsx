import Link from "next/link"
import { redirect } from "next/navigation"
import { getAppUser } from "@/lib/anne/server"
import { IMAGES } from "@/lib/anne/images"
import { Blob, Screen, Slot, TopBar } from "@/components/anne/chrome"

export const dynamic = "force-dynamic"

// Karşılama. Giriş yapmış hasta doğrudan uygulamaya geçer.
export default async function AnneKarsilamaPage() {
  const user = await getAppUser()
  if (user) redirect(user.onboarded_at ? "/anne/ana" : "/anne/baslangic")

  return (
    <Screen>
      <Blob tone="lilac" style={{ left: 150, top: -40, width: 330, height: 380 }} />
      <Blob style={{ left: -70, top: 150, width: 520, height: 440 }} />
      <TopBar>
        <Link className="nb-skip" href="/anne/giris">
          Geç
        </Link>
      </TopBar>
      <main className="nb-main">
        <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
          <Slot image={IMAGES.welcomeMother} width={250} height={325} />
        </div>
        <div className="nb-grow" />
        <h1>
          Bebeğin bu hafta
          <br />
          <b>ne kadar</b>
          <br />
          büyüdü?
        </h1>
        <Link className="nb-btn" href="/anne/tanitim" style={{ marginTop: 22 }}>
          Başla
        </Link>
      </main>
    </Screen>
  )
}
