import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { bookingState, istanbulNow } from "@/lib/anne/clinic-booking"
import { dailyWords } from "@/lib/anne/animation/moments"
import { latestFace } from "@/lib/anne/animation/service"
import { bookingTypeTitle, formatDayTr } from "@/lib/anne/booking-types"
import { mythsOfDay } from "@/lib/anne/content/myths"
import { personalSchedule } from "@/lib/anne/content/schedule"
import { sizeComparison } from "@/lib/anne/content/sizes"
import { MIN_GENERATION_WEEK } from "@/lib/anne/generation/limits"
import { Icon, Screen, Tabs, TopBar } from "@/components/anne/chrome"

export const dynamic = "force-dynamic"

// Kutuların resimleri public/anne/gorsel altındaki kutu-*.svg dosyalarıdır.
const STORIES: { href: string; image: string; label: string; quiet?: boolean }[] = [
  { href: "/anne/ses", image: "ses", label: "Sesim" },
  { href: "/anne/efsane", image: "efsane", label: "Efsane" },
  { href: "/anne/tat", image: "tat", label: "Tat" },
  { href: "/anne/tekme", image: "tekme", label: "Tekme" },
  { href: "/anne/isimler", image: "isimler", label: "İsimler" },
  { href: "/anne/randevu", image: "randevu", label: "Randevu", quiet: true },
  { href: "/anne/belgeler", image: "belgeler", label: "Belgeler", quiet: true },
  { href: "/anne/album", image: "album", label: "Albüm", quiet: true },
]

// Bugün: bebeğin yüzü ve sözü, oyunlar, günün efsanesi, randevu ve sıradaki durak.
export default async function AnneBugunPage() {
  const { user, age, today } = await requireReadyUser()

  const size = sizeComparison(age.weeks)
  // Destekler (vitamin, demir) durak değildir; yolculukta izlemler, taramalar ve aşılar gösterilir.
  const nextStop = personalSchedule(user.lmp_date, age.weeks).find((item) => item.kind !== "destek" && item.status !== "past")
  // Yaklaşan randevu (klinik takviminden) ve üretilmiş bebek yüzü aynı anda okunur; biri
  // okunamazsa ana ekran yine açılır. Yüz varsa büyük kartta o durur ve "Canlı bebeğim"e götürür.
  const [nextAppointment, face] = await Promise.all([
    bookingState(appDb(), user)
      .then((state) => state.appointments[0] ?? null)
      .catch(() => null),
    latestFace(appDb(), user.id).catch(() => null),
  ])
  const faceUrl = face ? `/api/anne/canli?yuz=${face.id}` : null
  const remaining = age.daysToDue >= 0 ? `${age.daysToDue} gün kaldı` : `${-age.daysToDue} gün geçti`
  const hour = Math.floor(istanbulNow().minutes / 60)
  const word = dailyWords({ today, hour, weeks: age.weeks, extraDays: age.extraDays, daysToDue: age.daysToDue })[0]
  const myth = mythsOfDay(today)[0]

  return (
    <Screen>
      <TopBar>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link className="nb-chip" data-on="" href="/anne/bebegim">
            {age.weeks}. hafta
          </Link>
          <Link className="nb-chip" href="/anne/hesap" aria-label="Hesap" style={{ padding: "4px 8px" }}>
            <Icon name="user" />
          </Link>
        </span>
      </TopBar>
      <main className="nb-main">
        <div className="nb-stories" data-scroll="">
          {faceUrl && (
            <Link className="nb-story" href="/anne/canli">
              <i>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={faceUrl} alt="" />
              </i>
              Canlı
            </Link>
          )}
          {STORIES.map((story) => (
            <Link key={story.href} className="nb-story" data-quiet={story.quiet ? "" : undefined} href={story.href}>
              <i>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/anne/gorsel/kutu-${story.image}.svg`} alt="" data-art="" />
              </i>
              {story.label}
            </Link>
          ))}
        </div>

        <div className="nb-hero">
          {faceUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={faceUrl} alt="Bebeğinin yüzü" />
          )}
          <span className="nb-hero-tag">{faceUrl ? "Canlı bebeğim" : `${age.weeks}. hafta`}</span>
          <div className="nb-hero-body">
            <h2>{faceUrl ? word : user.display_name ? `Merhaba ${user.display_name}` : "Merhaba"}</h2>
            <p>
              {age.weeks}. hafta{age.extraDays > 0 ? ` +${age.extraDays} gün` : ""} · {remaining}
              {size ? ` · ${size} kadar` : ""}
            </p>
            <div className="nb-bar">
              <i style={{ width: `${age.progressPercent}%` }} />
            </div>
            <div className="nb-hero-actions">
              {faceUrl ? (
                <Link href="/anne/canli">
                  <Icon name="play" />
                  Dokun, canlansın
                </Link>
              ) : (
                <Link href="/anne/yuz">{age.weeks >= MIN_GENERATION_WEEK ? "Bebeğinin yüzünü gör" : `Yüzü ${MIN_GENERATION_WEEK}. haftada görürsün`}</Link>
              )}
              <Link href="/anne/ses" data-kind="glass" aria-label="Sesini karnından dinle">
                <Icon name="mic" />
              </Link>
              <Link href="/anne/kart" data-kind="glass" aria-label="Hafta kartını paylaş">
                <Icon name="upload" />
              </Link>
            </div>
          </div>
        </div>

        <Link className="nb-card nb-row-card" href="/anne/efsane" style={{ padding: 14 }}>
          <span className="nb-thumb" data-tone="accent">
            <Icon name="question" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="nb-note" style={{ display: "block", fontSize: 12, fontWeight: 700 }}>
              Doğru mu, efsane mi?
            </span>
            <b style={{ display: "block", fontSize: 16, fontWeight: 800, lineHeight: 1.25 }}>{myth.text}</b>
          </span>
          <Icon name="next" />
        </Link>

        <Link className="nb-card nb-row-card" data-tone="dark" href="/anne/randevu">
          {nextAppointment ? (
            <span style={{ minWidth: 0 }}>
              <b>Randevun:</b> {formatDayTr(nextAppointment.date)} · {nextAppointment.time}
              <br />
              <span style={{ fontSize: 13, opacity: 0.8 }}>{bookingTypeTitle(nextAppointment.type)}</span>
            </span>
          ) : (
            <h3>Randevu al</h3>
          )}
          <span className="nb-chip">{nextAppointment ? "Gör" : "Canlı saatler"}</span>
        </Link>

        {faceUrl && (
          <Link className="nb-card nb-row-card" href="/anne/yuz" style={{ padding: 14 }}>
            <span className="nb-thumb">
              <Icon name="heart" />
            </span>
            <b style={{ flex: 1, fontSize: 16, fontWeight: 800 }}>Yeni bir yüz üret</b>
            <Icon name="next" />
          </Link>
        )}

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
