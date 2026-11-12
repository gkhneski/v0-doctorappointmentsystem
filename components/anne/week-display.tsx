import type { GestationalAge } from "@/lib/anne/pregnancy"

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

/** "2027-05-27" -> "27 Mayıs 2027" */
export function formatDateTr(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** Büyük hafta sayısı ve 40 haftalık cetvel. Sunucuda da tarayıcıda da çizilebilir. */
export function WeekDisplay({ age }: { age: GestationalAge }) {
  const current = Math.min(age.weeks, 39)

  return (
    <>
      <div className="anne-week">
        <div className="anne-week-number">{age.weeks}</div>
        <div className="anne-week-unit">
          hafta
          <span>{age.extraDays === 0 ? "tam" : `${age.extraDays} gün`}</span>
        </div>
      </div>

      <div
        className="anne-ruler"
        role="img"
        aria-label={`40 haftalık gebeliğin ${age.weeks}. haftası, ${age.trimester}. üç aylık dönem`}
      >
        <div className="anne-ruler-ticks" aria-hidden="true">
          {Array.from({ length: 40 }, (_, week) => (
            <i
              key={week}
              data-past={week < current ? "" : undefined}
              data-now={week === current ? "" : undefined}
              data-major={week === 14 || week === 28 ? "" : undefined}
            />
          ))}
        </div>
        <div className="anne-ruler-scale" aria-hidden="true">
          <span style={{ gridColumn: "1" }}>0</span>
          <span style={{ gridColumn: "15" }}>14</span>
          <span style={{ gridColumn: "29" }}>28</span>
          <span style={{ gridColumn: "40", justifySelf: "end" }}>40</span>
        </div>
      </div>
    </>
  )
}

export function dueLine(age: GestationalAge): string {
  if (age.daysToDue > 0) return `${age.daysToDue} gün kaldı`
  if (age.daysToDue === 0) return "Bugün"
  return `${-age.daysToDue} gün geçti`
}
