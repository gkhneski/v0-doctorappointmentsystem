"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, X, ChevronRight, CalendarClock } from "lucide-react"

type PatientResult = {
  id: string
  full_name: string
  phone: string | null
  tc_no: string | null
  date_of_birth: string | null
}

type PatientAppointment = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string | null
  appointment_type: string | null
  print_type: string | null
  notes: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  "no-show": "Gelmedi",
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-")
  if (!y || !m || !day) return d
  return `${day}.${m}.${y}`
}

// Randevu geçmişte mi gelecekte mi?
function isPastAppointment(date: string, time: string) {
  const t = (time || "00:00").slice(0, 5)
  const dt = new Date(`${date}T${t}:00`)
  if (isNaN(dt.getTime())) return false
  return dt.getTime() < Date.now()
}

export function PatientQuickSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PatientResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [apptLoading, setApptLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Dışarı tıklayınca kapat
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Debounced arama
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      setExpandedId(null)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/patients/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(data.patients || [])
        setOpen(true)
        setActiveIndex(-1)
        setExpandedId(null)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const togglePatient = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    setAppointments([])
    setApptLoading(true)
    try {
      const res = await fetch(`/api/admin/patients/${id}/appointments`)
      const data = await res.json()
      setAppointments(data.appointments || [])
    } catch {
      setAppointments([])
    } finally {
      setApptLoading(false)
    }
  }

  // Randevuya tıklayınca takvimi o randevunun gününe getir
  const goToAppointmentDay = (date: string) => {
    setOpen(false)
    setQuery("")
    setResults([])
    setExpandedId(null)

    // Randevular sekmesi aktif değilse ona geç (takvim orada render ediliyor)
    const tabs = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'))
    const randevularTab = tabs.find((t) => t.textContent?.includes("Randevular"))
    const needsTabSwitch = randevularTab?.getAttribute("data-state") === "inactive"
    if (needsTabSwitch) randevularTab?.click()

    // Sekme geçişi varsa takvimin mount olmasını bekle
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("admin:calendar-jump", { detail: { date } }))
    }, needsTabSwitch ? 120 : 0)
  }

  const goToPatient = (id: string) => {
    setOpen(false)
    setQuery("")
    setResults([])
    setExpandedId(null)
    router.push(`/admin/patients/${id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (!open || results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const target = activeIndex >= 0 ? results[activeIndex] : results[0]
      if (target) togglePatient(target.id)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 h-7 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Hasta ara (isim, TC, telefon)"
          className="w-44 bg-transparent text-xs outline-none placeholder:text-gray-400 sm:w-56"
          aria-label="Hasta ara"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-400" />}
        {!loading && query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); setExpandedId(null) }}
            className="shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Temizle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-9 z-[60] w-96 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-gray-500">
              {query.trim().length < 2 ? "En az 2 karakter yazın" : "Hasta bulunamadı"}
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {results.map((p, idx) => (
                <li key={p.id} className="border-b border-gray-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => togglePatient(p.id)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
                      idx === activeIndex || expandedId === p.id ? "bg-primary/10" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-medium text-gray-900">{p.full_name}</span>
                      <span className="flex flex-wrap gap-x-3 text-[11px] text-gray-500">
                        {p.phone && p.phone !== "0000000000" && <span>{p.phone}</span>}
                        {p.tc_no && <span>TC: {p.tc_no}</span>}
                      </span>
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expandedId === p.id ? "rotate-90" : ""}`}
                    />
                  </button>

                  {expandedId === p.id && (
                    <div className="bg-gray-50 px-3 py-2">
                      {apptLoading ? (
                        <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Randevular yükleniyor...
                        </div>
                      ) : appointments.length === 0 ? (
                        <div className="py-2 text-xs text-gray-500">Kayıtlı randevu yok.</div>
                      ) : (
                        <ul className="space-y-1">
                          {appointments.map((a) => {
                            const type = a.print_type || a.appointment_type || ""
                            const isCancelled = a.status === "cancelled"
                            const past = isPastAppointment(a.appointment_date, a.appointment_time)
                            return (
                              <li key={a.id}>
                                <button
                                  type="button"
                                  onClick={() => goToAppointmentDay(a.appointment_date)}
                                  title="Takvimde bu güne git"
                                  className="flex w-full items-center justify-between gap-2 rounded border border-gray-200 bg-white px-2 py-1.5 text-left text-[11px] transition-colors hover:border-primary hover:bg-primary/5"
                                >
                                <span className="flex items-center gap-1.5 text-gray-700">
                                  <CalendarClock className="h-3 w-3 shrink-0 text-gray-400" />
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                      past ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {past ? "Geçmiş" : "Yeni"}
                                  </span>
                                  <span className="font-medium">{formatDate(a.appointment_date)}</span>
                                  <span className="text-gray-500">{a.appointment_time?.slice(0, 5)}</span>
                                  {type && <span className="text-gray-500">· {type}</span>}
                                </span>
                                {a.status && (
                                  <span
                                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                      isCancelled
                                        ? "bg-gray-200 text-gray-600"
                                        : a.status === "confirmed" || a.status === "completed"
                                          ? "bg-green-100 text-green-700"
                                          : a.status === "no-show"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {STATUS_LABELS[a.status] || a.status}
                                  </span>
                                )}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      <button
                        type="button"
                        onClick={() => goToPatient(p.id)}
                        className="mt-2 w-full rounded bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Hasta Detayı & Randevu Ver
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
