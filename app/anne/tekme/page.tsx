import Link from "next/link"
import { requireReadyUser } from "@/lib/anne/server"
import { babyImage } from "@/lib/anne/images"
import { Screen, Slot, TopBar } from "@/components/anne/chrome"
import { KickGame } from "@/components/anne/kick-game"

export const dynamic = "force-dynamic"

export default async function AnneTekmePage() {
  const { age } = await requireReadyUser()

  return (
    <Screen>
      <TopBar>
        <Link className="nb-skip" href="/anne/ana">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main" style={{ alignItems: "center", textAlign: "center" }}>
        <h1 style={{ marginTop: 22 }}>
          <b>Tekme</b> geldi mi?
        </h1>
        <p className="nb-note" style={{ marginTop: 6, fontSize: 15 }}>
          Her hissettiğinde bebeğe dokun.
        </p>
        <KickGame baby={<Slot image={babyImage(age.weeks)} width={230} height={230} round />} />
      </main>
    </Screen>
  )
}
