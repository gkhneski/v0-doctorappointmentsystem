import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { MIN_GENERATION_WEEK, readState } from "@/lib/anne/generation/service"
import { Blob, Screen, TopBar } from "@/components/anne/chrome"
import { FaceStudio } from "@/components/anne/face-studio"

export const dynamic = "force-dynamic"

// Bebeğimin yüzü: ultrason görüntüsünden bebek yüzü canlandırması üretir.
// Üretim hattı eski NeoBreed sistemiyle aynıdır (lib/anne/generation).
export default async function AnneYuzPage() {
  const { user, age } = await requireReadyUser()
  const state = await readState(appDb(), user.id)
  const early = age.weeks < MIN_GENERATION_WEEK
  const hasResults = state.items.some((item) => item.status === "generated")

  return (
    <Screen>
      <Blob tone="lilac" style={{ right: -150, top: -80, width: 360, height: 320 }} />
      <TopBar title="Bebeğimin yüzü">
        <Link className="nb-skip" href="/anne/bebegim">
          Kapat
        </Link>
      </TopBar>
      <main className="nb-main">
        {early && !hasResults ? (
          <>
            <h1 style={{ marginTop: 40 }}>
              Biraz daha
              <br />
              <b>sabır</b>
            </h1>
            <div className="nb-card" data-tone="pink" style={{ marginTop: 18 }}>
              <p className="nb-big">{MIN_GENERATION_WEEK - age.weeks} hafta sonra</p>
              <p style={{ marginTop: 6 }}>
                Bebeğinin yüzü {MIN_GENERATION_WEEK}. haftadan itibaren ultrasonda seçilebilecek kadar belirginleşir. O zaman burada
                yüzünün canlandırmasını üretebileceksin.
              </p>
            </div>
            <Link className="nb-btn" data-kind="light" href="/anne/bebegim">
              Bu hafta bebeğim nasıl?
            </Link>
          </>
        ) : (
          <FaceStudio initial={state} week={Math.min(age.weeks, 44)} />
        )}
      </main>
    </Screen>
  )
}
