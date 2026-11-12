"use client"

import { useState } from "react"
import { gestationalAge, resolvePregnancyStart } from "@/lib/anne/pregnancy"
import { DateChoice, type DateKind } from "@/components/anne/date-choice"
import { WeekDisplay, dueLine, formatDateTr } from "@/components/anne/week-display"
import { WeekNote } from "@/components/anne/week-note"

/** Girişsiz hafta hesabı. Girilen tarih sunucuya gönderilmez; hesap tarayıcıda yapılır. */
export function WeekCalculator({ today }: { today: string }) {
  const [kind, setKind] = useState<DateKind>("lmp")
  const [value, setValue] = useState("")

  const start = value ? resolvePregnancyStart(kind === "lmp" ? { lmp: value } : { dueDate: value }, today) : null
  const age = start?.ok ? gestationalAge(start.lmp, today) : null

  return (
    <div>
      <DateChoice
        kind={kind}
        value={value}
        today={today}
        onKind={(next) => {
          setKind(next)
          setValue("")
        }}
        onValue={setValue}
      />

      <div aria-live="polite">
        {start && !start.ok && <p className="anne-error">{start.error}</p>}

        {start?.ok && age && (
          <>
            <WeekDisplay age={age} />
            <dl className="anne-facts" style={{ marginTop: 28 }}>
              <div>
                <dt>Tahmini doğum</dt>
                <dd>{formatDateTr(start.dueDate)}</dd>
              </div>
              <div>
                <dt>Doğuma</dt>
                <dd>{dueLine(age)}</dd>
              </div>
              <div>
                <dt>Dönem</dt>
                <dd>{age.trimester}. üç aylık dönem</dd>
              </div>
            </dl>
            <WeekNote week={age.weeks} />
          </>
        )}
      </div>
    </div>
  )
}
