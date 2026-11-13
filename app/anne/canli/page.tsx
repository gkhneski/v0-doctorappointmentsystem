import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { MIN_GENERATION_WEEK } from "@/lib/anne/generation/limits"
import { dailyWords } from "@/lib/anne/animation/moments"
import { readLiveState } from "@/lib/anne/animation/service"
import { readLook } from "@/lib/anne/look-service"
import { istanbulNow } from "@/lib/anne/clinic-booking"
import { Blob, Screen, TopBar } from "@/components/anne/chrome"
import { LiveBaby } from "@/components/anne/live-baby"

export const dynamic = "force-dynamic"

// Canlı bebeğim: üretilen bebek yüzü dokununca tepki verir, her gün yeni bir an açılır.
export default async function AnneCanliPage() {
  const { user, today, age } = await requireReadyUser()
  const state = await readLiveState(appDb(), user.id, today)
  const look = await readLook(appDb(), user, today)
  const hour = Math.floor(istanbulNow().minutes / 60)
  const words = dailyWords({ today, hour, weeks: age.weeks, extraDays: age.extraDays, daysToDue: age.daysToDue })

  return (
    <Screen>
      <Blob tone="lilac" style={{ left: -160, top: -90, width: 380, height: 340 }} />
      <TopBar title="Canlı bebeğim">
        <Link className="nb-skip" href="/anne/ana">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main">
        {state.face ? (
          <LiveBaby initial={state} words={words} look={look} />
        ) : (
          <>
            <h1 style={{ marginTop: 40 }}>
              Önce
              <br />
              <b>yüzünü görelim</b>
            </h1>
            <div className="nb-card" data-tone="pink" style={{ marginTop: 18 }}>
              <p>
                Bebeğinin yüzünü ultrason görüntüsünden ürettikten sonra burada canlanır: gülümser, esner, sana tepki verir. Ona toka, şapka takıp süsleyebilirsin.
                {age.weeks < MIN_GENERATION_WEEK ? ` Yüz ${MIN_GENERATION_WEEK}. haftadan itibaren üretilebilir.` : ""}
              </p>
            </div>
            <Link className="nb-btn" href="/anne/yuz">
              Bebeğimin yüzü
            </Link>
          </>
        )}
      </main>
    </Screen>
  )
}
