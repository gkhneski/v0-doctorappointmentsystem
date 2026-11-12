import {
  KIND_LABEL,
  SCHEDULE_INTRO,
  SEASONAL_NOTE,
  personalSchedule,
  type DatedScheduleItem,
} from "@/lib/anne/content/schedule"
import { SourceLine } from "@/components/anne/week-note"

const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]}`
}

function dateRange(item: DatedScheduleItem): string {
  if (item.toDate === null) return `${shortDate(item.fromDate)} sonrası`
  if (item.fromWeek === 0) return `${shortDate(item.toDate)} öncesi`
  return `${shortDate(item.fromDate)} – ${shortDate(item.toDate)}`
}

const STATUS_LABEL = { now: "Şimdi", next: "Sırada", past: "Geçti" } as const

/** Bakanlık takviminin hastanın tarihine göre sıralanmış hali. */
export function ScheduleList({ lmp, week }: { lmp: string; week: number }) {
  const items = personalSchedule(lmp, week)

  return (
    <section className="anne-section">
      <h2>Bakanlık izlem takvimi</h2>
      <p>{SCHEDULE_INTRO}</p>

      <ol className="anne-schedule">
        {items.map((item) => (
          <li key={item.id} data-status={item.status}>
            <div className="anne-schedule-when">
              <span className="anne-schedule-status">{STATUS_LABEL[item.status]}</span>
              <span>{dateRange(item)}</span>
            </div>
            <div>
              <h3>
                {item.title} <span className="anne-schedule-kind">{KIND_LABEL[item.kind]}</span>
              </h3>
              <p className="anne-schedule-week">{item.when}</p>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <p style={{ marginTop: 16 }}>
        <strong>{SEASONAL_NOTE.title}.</strong> {SEASONAL_NOTE.text}
      </p>
      <p className="anne-note" style={{ marginTop: 12 }}>
        Tarihler girdiğiniz tarihten yaklaşık olarak hesaplanır. Bu liste genel bilgidir; hangi testin ve desteğin size
        uygun olduğuna doktorunuz karar verir.
      </p>
      <SourceLine sources={["dogumOncesi"]} />
    </section>
  )
}
