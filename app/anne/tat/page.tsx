import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { readLiveState } from "@/lib/anne/animation/service"
import { daysBetween } from "@/lib/anne/pregnancy"
import { SOURCES } from "@/lib/anne/content/sources"
import { Icon, Screen } from "@/components/anne/chrome"
import { TasteGame } from "@/components/anne/taste-game"

export const dynamic = "force-dynamic"

// Havuç mu, lahana mı?: anne yediğini seçer, bebeğin üretilmiş yüzü tepki verir.
export default async function AnneTatPage() {
  const { user, today } = await requireReadyUser()
  const state = await readLiveState(appDb(), user.id, today).catch(() => null)
  const ready = (kind: string) => state?.moments.find((m) => m.kind === kind && m.status === "ready")?.id ?? null

  return (
    <Screen>
      <div className="nb-reel">
        <header className="nb-reel-top" data-over="">
          <Link className="nb-glass" href="/anne/oyun" aria-label="Geri">
            <Icon name="back" />
          </Link>
          <h2>Havuç mu, lahana mı?</h2>
        </header>
        <TasteGame
          faceUrl={state?.face ? `/api/anne/canli?yuz=${state.face.id}` : null}
          day={daysBetween("2026-01-01", today)}
          clips={{ tatli: ready("kikirde") ?? ready("gulumse"), aci: ready("somurt"), sade: ready("agu") ?? ready("emme") }}
          sources={Object.fromEntries(Object.entries(SOURCES).map(([key, source]) => [key, source.citation]))}
        />
      </div>
    </Screen>
  )
}
