import Link from "next/link"
import { requireReadyUser } from "@/lib/anne/server"
import { personalSchedule } from "@/lib/anne/content/schedule"
import { sizeComparison } from "@/lib/anne/content/sizes"
import { babyImage } from "@/lib/anne/images"
import { MIN_GENERATION_WEEK } from "@/lib/anne/generation/limits"
import { Screen, Slot, Tabs, TopBar } from "@/components/anne/chrome"

export const dynamic = "force-dynamic"

function greeting(name: string | null): string {
  return name ? `Merhaba ${name}` : "Merhaba"
}

// Bugün: hafta, bebeğin boyu, günün sorusu, tekme ve sıradaki durak.
export default async function AnneBugunPage() {
  const { user, age } = await requireReadyUser()

  const size = sizeComparison(age.weeks)
  // Destekler (vitamin, demir) durak değildir; yolculukta izlemler, taramalar ve aşılar gösterilir.
  const nextStop = personalSchedule(user.lmp_date, age.weeks).find((item) => item.kind !== "destek" && item.status !== "past")
  const remaining = age.daysToDue >= 0 ? `${age.daysToDue} gün kaldı` : `${-age.daysToDue} gün geçti`

  return (
    <Screen>
      <TopBar title={greeting(user.display_name)}>
        <Link className="nb-chip" href="/anne/hesap">
          Hesap
        </Link>
      </TopBar>
      <main className="nb-main">
        <div className="nb-stories">
          <Link className="nb-story" href="/anne/bebegim">
            <i style={{ background: "var(--pink)" }}>{age.weeks}</i>Bu hafta
          </Link>
          <Link className="nb-story" href="/anne/oyun">
            <i style={{ background: "var(--lilac)" }}>?</i>Soru
          </Link>
          <Link className="nb-story" href="/anne/tekme">
            <i style={{ background: "var(--peach)" }}>+1</i>Tekme
          </Link>
          <Link className="nb-story" href="/anne/isimler">
            <i>Aa</i>İsimler
          </Link>
          <Link className="nb-story" href="/anne/album">
            <i style={{ borderStyle: "dashed" }}>+</i>Albüm
          </Link>
        </div>

        <Link className="nb-card nb-row-card" data-tone="pink" href="/anne/bebegim" style={{ marginTop: 18, padding: 16 }}>
          <Slot image={babyImage(age.weeks)} width={128} height={128} round style={{ flex: "none" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="nb-big">{age.weeks}. hafta</p>
            <p style={{ marginTop: 4 }}>
              {age.extraDays > 0 ? `+${age.extraDays} gün · ` : ""}
              {remaining}
            </p>
            <div className="nb-bar" style={{ marginTop: 12 }}>
              <i style={{ width: `${age.progressPercent}%` }} />
            </div>
          </div>
        </Link>

        <Link className="nb-card nb-row-card" data-tone="peach" href="/anne/yuz">
          <h3>Bebeğinin yüzünü gör</h3>
          <span className="nb-chip" data-on="">
            {age.weeks >= MIN_GENERATION_WEEK ? "Üret" : `${MIN_GENERATION_WEEK}. haftada`}
          </span>
        </Link>

        <div className="nb-two">
          <Link className="nb-card" href="/anne/bebegim">
            <p className="nb-note">Bu hafta boyu</p>
            <h3 style={{ marginTop: 6 }}>{size ? `${size} kadar` : "Henüz çok küçük"}</h3>
          </Link>
          <Link className="nb-card" data-tone="lilac" href="/anne/oyun">
            <p style={{ fontSize: 54, lineHeight: 1.2, fontWeight: 800 }}>?</p>
            <h3 style={{ marginTop: 8 }}>Günün sorusu</h3>
          </Link>
        </div>

        <Link className="nb-card nb-row-card" data-tone="dark" href="/anne/tekme">
          <h3>Tekme geldi mi?</h3>
          <span className="nb-chip">Say</span>
        </Link>

        {nextStop && (
          <Link className="nb-card nb-row-card" href="/anne/yolculuk" style={{ padding: "14px 18px" }}>
            <span style={{ minWidth: 0 }}>
              <b>{nextStop.status === "now" ? "Şimdi:" : "Sıradaki durak:"}</b> {nextStop.title}
            </span>
            <span className="nb-chip" data-on="">
              {nextStop.toWeek === null ? `${nextStop.fromWeek}. haftadan sonra` : `${nextStop.fromWeek}–${nextStop.toWeek}. hafta`}
            </span>
          </Link>
        )}
        <div className="nb-grow" />
      </main>
      <Tabs current="bugun" />
    </Screen>
  )
}
