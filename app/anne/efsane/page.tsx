import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { latestFace } from "@/lib/anne/animation/service"
import { mythsOfDay } from "@/lib/anne/content/myths"
import { SOURCES } from "@/lib/anne/content/sources"
import { Icon, Screen } from "@/components/anne/chrome"
import { MythDeck } from "@/components/anne/myth-deck"

export const dynamic = "force-dynamic"

// Doğru mu, efsane mi?: günün beş kartı.
export default async function AnneEfsanePage() {
  const { user, today } = await requireReadyUser()
  const face = await latestFace(appDb(), user.id).catch(() => null)
  const myths = mythsOfDay(today)
  const sources = Object.fromEntries(Object.entries(SOURCES).map(([key, source]) => [key, source.citation]))

  return (
    <Screen>
      <div className="nb-reel">
        {face && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="nb-reel-media" data-dim="" src={`/api/anne/canli?yuz=${face.id}`} alt="" />
        )}
        <header className="nb-reel-top">
          <Link className="nb-glass" href="/anne/oyun" aria-label="Kapat">
            <Icon name="close" />
          </Link>
          <h2>Doğru mu, efsane mi?</h2>
        </header>
        <MythDeck myths={myths} sources={sources} />
      </div>
    </Screen>
  )
}
