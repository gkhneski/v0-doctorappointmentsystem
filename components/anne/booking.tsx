"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { send } from "@/components/anne/api"
import {
  BOOKING_TYPES,
  FETAL_COUNTS,
  bookingTypeTitle,
  dateParts,
  formatDayTr,
  type BookingTypeId,
  type FetalCount,
} from "@/lib/anne/booking-types"

export type MyAppointment = { id: string; date: string; time: string; type: string | null }
type OpenDay = { date: string; times: string[] }
type BookingData = { needsName: boolean; appointments: MyAppointment[]; days: OpenDay[] | null }

/** Açık ekranda boş saatler bu aralıkla yenilenir. */
const REFRESH_MS = 20_000

function daysUntil(date: string, today: string): string {
  const diff = Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000)
  if (diff <= 0) return "Bugün"
  if (diff === 1) return "Yarın"
  return `${diff} gün kaldı`
}

/** Telefonun takvimine eklenebilen dosya (.ics). Saatler İstanbul saatidir (UTC+3). */
function calendarFile(appointment: MyAppointment): string {
  const [y, m, d] = appointment.date.split("-").map(Number)
  const [hh, mm] = appointment.time.split(":").map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, hh - 3, mm))
  const end = new Date(start.getTime() + 30 * 60_000)
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NeoBreed//Randevu//TR",
    "BEGIN:VEVENT",
    `UID:${appointment.id}@neobreed`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:Prof. Dr. Eray Çalışkan - ${bookingTypeTitle(appointment.type)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Randevu",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

function Ticket({
  appointment,
  today,
  fresh,
  onCancelled,
}: {
  appointment: MyAppointment
  today: string
  fresh: boolean
  onCancelled: (id: string) => void
}) {
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const parts = dateParts(appointment.date)

  async function cancel() {
    setBusy(true)
    setError("")
    const result = await send("/api/anne/randevu", "DELETE", { randevu: appointment.id }, "Randevu iptal edilemedi.")
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onCancelled(appointment.id)
  }

  function addToCalendar() {
    const url = URL.createObjectURL(new Blob([calendarFile(appointment)], { type: "text/calendar" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "randevu.ics"
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  return (
    <>
      <div className="nb-ticket" data-new={fresh ? "" : undefined}>
        <div className="nb-ticket-date">
          <b>{parts.day}</b>
          <span>{parts.month}</span>
          <span>{parts.weekday}</span>
        </div>
        <div className="nb-ticket-body">
          <p className="nb-big">{appointment.time}</p>
          <p style={{ marginTop: 4, fontWeight: 700 }}>{bookingTypeTitle(appointment.type)}</p>
          <p style={{ opacity: 0.8 }}>{daysUntil(appointment.date, today)}</p>
          {asking ? (
            <span style={{ display: "flex", gap: 14, marginTop: 8 }}>
              <button className="nb-link" type="button" disabled={busy} onClick={() => void cancel()} style={{ marginTop: 0 }}>
                {busy ? "İptal ediliyor" : "Evet, iptal et"}
              </button>
              <button className="nb-link" type="button" disabled={busy} onClick={() => setAsking(false)} style={{ marginTop: 0 }}>
                Vazgeç
              </button>
            </span>
          ) : (
            <span style={{ display: "flex", gap: 14, marginTop: 8 }}>
              <button className="nb-link" type="button" onClick={addToCalendar} style={{ marginTop: 0 }}>
                Takvime ekle
              </button>
              <button className="nb-link" type="button" onClick={() => setAsking(true)} style={{ marginTop: 0 }}>
                İptal et
              </button>
            </span>
          )}
        </div>
      </div>
      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}

/** Canlı boş saatlerden randevu alma ve hastanın yaklaşan randevuları. */
export function Booking({ initial, today, defaultName }: { initial: { needsName: boolean; appointments: MyAppointment[] }; today: string; defaultName: string }) {
  const [appointments, setAppointments] = useState(initial.appointments)
  const [needsName, setNeedsName] = useState(initial.needsName)
  const [fullName, setFullName] = useState(defaultName)
  const [type, setType] = useState<BookingTypeId | null>(null)
  const [fetalCount, setFetalCount] = useState<FetalCount | null>(null)
  const [days, setDays] = useState<OpenDay[] | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [freshId, setFreshId] = useState<string | null>(null)
  const top = useRef<HTMLDivElement>(null)
  // Yenileme yanıtı geldiğinde seçimin hâlâ geçerli olup olmadığına bakılır.
  const picked = useRef<{ date: string | null; time: string | null }>({ date: null, time: null })
  picked.current = { date, time }
  // Her yükleme bir sıra numarası alır; tür değiştikten, randevu alındıktan ya da iptalden
  // sonra gelen eski yanıt yok sayılır (yoksa yeni bileti silebilir, yanlış saatleri gösterebilirdi).
  const sequence = useRef(0)

  const load = useCallback(async (forType: BookingTypeId, quiet: boolean) => {
    const mine = ++sequence.current
    const result = await send<BookingData>(`/api/anne/randevu?tur=${forType}`, "GET", undefined, "Saatler yüklenemedi.")
    if (mine !== sequence.current) return
    if (!result.ok) {
      if (!quiet) setError(result.error)
      return
    }
    const fresh = result.data.days ?? []
    setDays(fresh)
    setNeedsName(result.data.needsName)
    setAppointments(result.data.appointments)

    const current = picked.current
    const day = fresh.find((d) => d.date === current.date)
    if (current.date && current.time && !day?.times.includes(current.time)) {
      setTime(null)
      setNotice("Seçtiğin saat az önce doldu. Başka bir saat seç.")
    }
    if (!day) setDate(fresh[0]?.date ?? null)
  }, [])

  useEffect(() => {
    sequence.current++
    if (!type) return
    setDays(null)
    setDate(null)
    setTime(null)
    setError("")
    setNotice("")
    void load(type, false)

    const tick = () => {
      if (document.visibilityState === "visible") void load(type, true)
    }
    const timer = setInterval(tick, REFRESH_MS)
    document.addEventListener("visibilitychange", tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [type, load])

  async function book() {
    if (!type || !date || !time) return
    setBusy(true)
    setError("")
    setNotice("")
    const result = await send<{ appointment: MyAppointment; needsName?: boolean; refresh?: boolean }>(
      "/api/anne/randevu",
      "POST",
      { tur: type, tarih: date, saat: time, bebekSayisi: fetalCount, adSoyad: needsName ? fullName : undefined },
      "Randevu oluşturulamadı.",
    )
    setBusy(false)
    sequence.current++
    if (!result.ok) {
      setError(result.error)
      if (result.status === 409 || result.status === 400) void load(type, true)
      return
    }
    const created = result.data.appointment
    setAppointments((prev) => [...prev.filter((a) => a.id !== created.id), created].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)))
    setFreshId(created.id)
    setNeedsName(false)
    setType(null)
    setDays(null)
    setDate(null)
    setTime(null)
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const day = days?.find((d) => d.date === date) ?? null
  const fetalMissing = type === "ayrintili-fetal-ultrason" && !fetalCount
  const nameMissing = needsName && fullName.trim().length < 5
  const ready = Boolean(type && date && time && !fetalMissing && !nameMissing)

  return (
    <>
      <div ref={top} />
      {appointments.length > 0 && (
        <section>
          <h3 style={{ marginTop: 8 }}>{appointments.length === 1 ? "Randevun" : "Randevuların"}</h3>
          {appointments.map((appointment) => (
            <Ticket
              key={appointment.id}
              appointment={appointment}
              today={today}
              fresh={appointment.id === freshId}
              onCancelled={(id) => {
                sequence.current++
                setAppointments((prev) => prev.filter((a) => a.id !== id))
                if (type) void load(type, true)
              }}
            />
          ))}
          {freshId && (
            <Link className="nb-card nb-row-card" data-tone="peach" href="/anne/belgeler">
              <span style={{ minWidth: 0 }}>
                <b>Randevun hazır.</b> Tahlillerini şimdiden gönder, doktorun görsün.
              </span>
              <span className="nb-chip" data-on="">
                Yükle
              </span>
            </Link>
          )}
        </section>
      )}

      <section>
        <h3 style={{ marginTop: appointments.length > 0 ? 28 : 8 }}>{appointments.length > 0 ? "Yeni randevu" : "Ne için geliyorsun?"}</h3>
        <div className="nb-types">
          {BOOKING_TYPES.map((item) => (
            <button
              key={item.id}
              className="nb-type"
              data-tone={item.tone === "plain" ? undefined : item.tone}
              type="button"
              aria-pressed={type === item.id}
              onClick={() => setType(item.id)}
            >
              <b>{item.title}</b>
              <span>{item.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {type === "ayrintili-fetal-ultrason" && (
        <section>
          <h3 style={{ marginTop: 24 }}>Kaç bebek?</h3>
          <div className="nb-cats">
            {FETAL_COUNTS.map((item) => (
              <button key={item.id} className="nb-cat" type="button" aria-pressed={fetalCount === item.id} onClick={() => setFetalCount(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {type && (
        <section aria-live="polite">
          <div className="nb-head">
            <h3>Gün seç</h3>
            <span className="nb-live">
              <i />
              Canlı
            </span>
          </div>

          {days === null ? (
            <div className="nb-empty">Boş saatler getiriliyor…</div>
          ) : days.length === 0 ? (
            <div className="nb-empty">Önümüzdeki günlerde boş saat görünmüyor. Sekreteri arayabilirsin: 0531 080 47 20</div>
          ) : (
            <>
              <div className="nb-days">
                {days.map((item) => {
                  const parts = dateParts(item.date)
                  return (
                    <button
                      key={item.date}
                      className="nb-day"
                      type="button"
                      aria-pressed={date === item.date}
                      aria-label={`${formatDayTr(item.date)}, ${item.times.length} boş saat`}
                      onClick={() => {
                        setDate(item.date)
                        setTime(null)
                        setNotice("")
                      }}
                    >
                      <small>{parts.short}</small>
                      <b>{parts.day}</b>
                      <small>{parts.month.slice(0, 3)}</small>
                      <em>{item.times.length} saat</em>
                    </button>
                  )
                })}
              </div>

              {day && (
                <>
                  <div className="nb-head" style={{ marginTop: 18 }}>
                    <h3>{formatDayTr(day.date)}</h3>
                    <span className="nb-note">{day.times.length} boş saat</span>
                  </div>
                  <div className="nb-times">
                    {day.times.map((slot) => (
                      <button
                        key={slot}
                        className="nb-time"
                        type="button"
                        aria-pressed={time === slot}
                        onClick={() => {
                          setTime(slot)
                          setNotice("")
                          setError("")
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      )}

      {type && needsName && time && (
        <section>
          <label className="nb-label" htmlFor="anne-randevu-ad">
            Adın ve soyadın
          </label>
          <input
            id="anne-randevu-ad"
            className="nb-field"
            type="text"
            autoComplete="name"
            maxLength={80}
            placeholder="Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <p className="nb-note" style={{ marginTop: 8 }}>
            Klinik kaydın bu adla açılır; bir kez sorulur.
          </p>
        </section>
      )}

      {(notice || error) && (
        <p className="nb-error" role="alert">
          {error || notice}
        </p>
      )}

      {type && date && time && (
        <div className="nb-sticky">
          <button className="nb-btn" type="button" disabled={!ready || busy} onClick={() => void book()}>
            {busy ? "Randevun alınıyor" : fetalMissing ? "Önce bebek sayısını seç" : nameMissing ? "Önce adını yaz" : `${dateParts(date).day} ${dateParts(date).month} · ${time} · Randevuyu al`}
          </button>
        </div>
      )}

      {!type && (
        <p className="nb-note" style={{ marginTop: 18, textAlign: "center", fontSize: 13 }}>
          Saatler kliniğin takviminden canlı gelir. Başka bir randevu türü için{" "}
          <a href="/randevu" style={{ textDecoration: "underline" }}>
            randevu sayfasını
          </a>{" "}
          kullanabilirsin.
        </p>
      )}
    </>
  )
}
