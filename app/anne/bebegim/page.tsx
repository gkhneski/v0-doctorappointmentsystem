import Link from "next/link"
import { requireReadyUser } from "@/lib/anne/server"
import { WEEKS_SOURCE, weekContent } from "@/lib/anne/content/weeks"
import { sizeComparison } from "@/lib/anne/content/sizes"
import { SOURCES } from "@/lib/anne/content/sources"
import { babyImage } from "@/lib/anne/images"
import { MIN_GENERATION_WEEK } from "@/lib/anne/generation/limits"
import { Blob, Screen, Slot, Tabs, TopBar } from "@/components/anne/chrome"

export const dynamic = "force-dynamic"

const LAST_WEEK = 40

function pickWeek(raw: string | undefined, current: number): number {
  const asked = raw === undefined ? NaN : Number(raw)
  const week = Number.isInteger(asked) ? asked : current
  return Math.max(1, Math.min(LAST_WEEK, week))
}

// Bebeğim: seçilen haftada bebeğin boyu, ağırlığı ve neler olduğu.
export default async function AnneBebegimPage({ searchParams }: { searchParams: Promise<{ hafta?: string }> }) {
  const { age } = await requireReadyUser()
  const week = pickWeek((await searchParams).hafta, age.weeks)

  const content = weekContent(week)
  const size = sizeComparison(week)
  const source = SOURCES[WEEKS_SOURCE]
  const strip = [week - 2, week - 1, week, week + 1, week + 2].filter((w) => w >= 1 && w <= LAST_WEEK)

  return (
    <Screen>
      <Blob style={{ left: -60, top: 110, width: 500, height: 330 }} />
      <TopBar title="Bebeğim">
        <Link className="nb-chip" href="/anne/kart">
          Paylaş
        </Link>
      </TopBar>
      <main className="nb-main">
        <nav className="nb-weeks" aria-label="Hafta seç">
          {strip.map((w) => (
            <Link
              key={w}
              className="nb-chip"
              data-on={w === week ? "" : undefined}
              aria-current={w === week ? "page" : undefined}
              href={`/anne/bebegim?hafta=${w}`}
              scroll={false}
            >
              {w === week ? `${w}. hafta` : w}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <Slot image={babyImage(week)} width={220} height={220} round />
        </div>

        <h1 style={{ marginTop: 18, textAlign: "center" }}>
          {size ? (
            <>
              {week === age.weeks ? "Bu hafta" : `${week}. haftada`} <b>{size}</b> kadar
            </>
          ) : (
            <>
              <b>{week}. hafta</b>
            </>
          )}
        </h1>

        {(content?.length || content?.weight) && (
          <div className="nb-two" style={{ marginTop: 4 }}>
            {content.length && (
              <div className="nb-card" style={{ textAlign: "center", padding: 14 }}>
                <p style={{ fontSize: 26, lineHeight: 1.15, fontWeight: 800 }}>{content.length.replace("yaklaşık ", "")}</p>
                <p className="nb-note">yaklaşık boy</p>
              </div>
            )}
            {content.weight && (
              <div className="nb-card" style={{ textAlign: "center", padding: 14 }}>
                <p style={{ fontSize: 26, lineHeight: 1.15, fontWeight: 800 }}>{content.weight.replace("yaklaşık ", "")}</p>
                <p className="nb-note">yaklaşık ağırlık</p>
              </div>
            )}
          </div>
        )}

        <Link className="nb-card nb-row-card" data-tone="dark" href="/anne/yuz">
          <h3>Bebeğinin yüzünü gör</h3>
          <span className="nb-chip">{age.weeks >= MIN_GENERATION_WEEK ? "Üret" : `${MIN_GENERATION_WEEK}. haftada`}</span>
        </Link>

        {content && (
          <div className="nb-card" style={{ padding: "16px 18px" }}>
            <h3>{week === age.weeks ? "Bu hafta neler oluyor?" : `${week}. haftada neler oluyor?`}</h3>
            <p style={{ marginTop: 8, fontSize: 15 }}>{content.text}</p>
            <p className="nb-note" style={{ marginTop: 8, fontSize: 12 }}>
              Kaynak: {source.citation}.{size ? " Boy benzetmesi kaynakta yoktur, bize aittir." : ""}
            </p>
          </div>
        )}
        <div className="nb-grow" />
      </main>
      <Tabs current="bebegim" />
    </Screen>
  )
}
