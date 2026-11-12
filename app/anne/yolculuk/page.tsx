import Link from "next/link"
import { requireReadyUser } from "@/lib/anne/server"
import { personalSchedule } from "@/lib/anne/content/schedule"
import { SOURCES } from "@/lib/anne/content/sources"
import { DANGER_SIGNS } from "@/lib/anne/content/danger-signs"
import { Blob, Screen, Tabs, TopBar, formatDateTr } from "@/components/anne/chrome"

export const dynamic = "force-dynamic"

const STATUS_LABEL = { past: "Geçti", now: "Şimdi", next: "Sırada" } as const
// Durakların sağa sola kayarak bir yol gibi dizilmesi.
const OFFSETS = [0, 40, 76, 40]

// Yolculuk: Sağlık Bakanlığı izlem takvimi, hastanın haftasına göre durak durak.
export default async function AnneYolculukPage() {
  const { user, age } = await requireReadyUser()

  // Destekler (vitamin, demir) durak değildir; yolculukta izlemler, taramalar ve aşılar gösterilir.
  const stops = personalSchedule(user.lmp_date, age.weeks)
    .filter((item) => item.kind !== "destek")
    .sort((a, b) => a.fromWeek - b.fromWeek)
  const passed = stops.filter((s) => s.status === "past").length

  return (
    <Screen>
      <Blob tone="lilac" style={{ right: -110, top: 90, width: 330, height: 560 }} />
      <TopBar title="Yolculuk">
        <span className="nb-chip">{passed} durak geçildi</span>
      </TopBar>
      <main className="nb-main">
        <p className="nb-note nb-on-color" style={{ marginTop: 8 }}>
          Sağlık Bakanlığı her gebenin en az dört kez izlenmesini önerir. Kesin günü doktorun belirler.
        </p>

        <ol style={{ margin: "6px 0 0", padding: 0, listStyle: "none" }}>
          {stops.map((stop, index) => (
            <li
              key={stop.id}
              className="nb-stop"
              data-status={stop.status}
              style={{ marginLeft: OFFSETS[index % OFFSETS.length], marginTop: stop.status === "now" ? 16 : undefined }}
            >
              <i>{Math.max(stop.fromWeek, 1)}</i>
              <div>
                <b>{stop.title}</b>
                <br />
                {STATUS_LABEL[stop.status]} · {stop.when}
                {stop.status !== "past" && (
                  <>
                    <br />
                    {formatDateTr(stop.fromDate)}
                    {stop.toDate ? ` – ${formatDateTr(stop.toDate)}` : " sonrası"}
                  </>
                )}
              </div>
            </li>
          ))}
          <li className="nb-stop" style={{ marginLeft: OFFSETS[stops.length % OFFSETS.length] }}>
            <i style={{ background: "var(--pink)" }}>40</i>
            <div>
              <b>Kavuşma</b>
              <br />
              Tahmini {formatDateTr(user.due_date)}
            </div>
          </li>
        </ol>

        <Link className="nb-card nb-row-card" href="/anne/tehlike-isaretleri" style={{ marginTop: 18, padding: "14px 18px" }}>
          <b>Ne zaman doktora gitmeliyim?</b>
          <span className="nb-chip" data-on="">
            {DANGER_SIGNS.length} işaret
          </span>
        </Link>
        <p className="nb-note" style={{ marginTop: 10, fontSize: 12 }}>
          Kaynak: {SOURCES.dogumOncesi.citation}.
        </p>
        <div className="nb-grow" />
      </main>
      <Tabs current="yolculuk" />
    </Screen>
  )
}
