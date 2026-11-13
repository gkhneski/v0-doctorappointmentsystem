import Link from "next/link"
import { appDb, requireReadyUser } from "@/lib/anne/server"
import { bookingState } from "@/lib/anne/clinic-booking"
import { bookingTypeTitle, formatDayTr } from "@/lib/anne/booking-types"
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
  // Yaklaşan randevu (klinik takviminden); okunamazsa ana ekran yine açılır.
  const nextAppointment = await bookingState(appDb(), user)
    .then((state) => state.appointments[0] ?? null)
    .catch(() => null)
  const remaining = age.daysToDue >= 0 ? `${age.daysToDue} gün kaldı` : `${-age.daysToDue} gün geçti`

  return (
    <Screen>
      <TopBar title={greeting(user.display_name)}>
        <Link className="nb-chip" href="/anne/hesap">
          Hesap
        </Link>
      </TopBar>
      <main className="nb-main">
        <div className="nb-stories" data-scroll="">
          <Link className="nb-story" href="/anne/bebegim">
            <i style={{ background: "var(--pink)" }}>{age.weeks}</i>Bu hafta
          </Link>
          <Link className="nb-story" href="/anne/randevu">
            <i style={{ background: "var(--ink)", color: "#fff" }}>{nextAppointment ? nextAppointment.date.slice(8) : "+"}</i>Randevu
          </Link>
          <Link className="nb-story" href="/anne/belgeler">
            <i style={{ background: "var(--peach)" }}>↑</i>Belgeler
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

        <div className="nb-two">
          <Link className="nb-card" data-tone="dark" href="/anne/tekme">
            <p className="nb-note" style={{ color: "#fff", opacity: 0.8 }}>Tekme geldi mi?</p>
            <h3 style={{ marginTop: 6 }}>Say</h3>
          </Link>
          <Link className="nb-card" data-tone="pink" href="/anne/belgeler">
            <p className="nb-note">Tahlil, rapor</p>
            <h3 style={{ marginTop: 6 }}>Belgelerini yükle</h3>
          </Link>
        </div>

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
