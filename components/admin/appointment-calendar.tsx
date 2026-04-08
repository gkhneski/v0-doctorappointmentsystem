"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, GripVertical, Loader2, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Appointment = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  confirmation_status?: string | null
  notes: string | null
  appointment_type: string | null
  doctors: { name: string; specialization: string; email: string } | null
  patients: {
    id: string
    full_name: string
    phone: string
    tc_no: string
    date_of_birth: string | null
  } | null
}

// ── helpers ───────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  "asilama-tup-bebek":          "bg-purple-100 text-purple-800 border-purple-300",
  "gebelik-takibi":             "bg-pink-100   text-pink-800   border-pink-300",
  "gebelik-istemi-infertilite": "bg-rose-100   text-rose-800   border-rose-300",
  "jinekolojik-muayene":        "bg-teal-100   text-teal-800   border-teal-300",
  "kontrol-takip":              "bg-green-100  text-green-800  border-green-300",
  "ayrintili-fetal-ultrason":   "bg-blue-100   text-blue-800   border-blue-300",
}
const TYPE_LABELS: Record<string, string> = {
  "asilama-tup-bebek":          "Aşılama / Tüp Bebek",
  "gebelik-takibi":             "Gebelik Takibi",
  "gebelik-istemi-infertilite": "Gebelik İstemi",
  "jinekolojik-muayene":        "Jinekolojik Muayene",
  "kontrol-takip":              "Kontrol / Takip",
  "ayrintili-fetal-ultrason":   "Fetal Ultrason",
}

function typeColor(t: string | null) {
  return t && TYPE_COLORS[t] ? TYPE_COLORS[t] : "bg-indigo-100 text-indigo-800 border-indigo-300"
}
function typeLabel(t: string | null) {
  return t && TYPE_LABELS[t] ? TYPE_LABELS[t] : (t ?? "Belirtilmemiş")
}
function getWeekStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}
function toDateStr(d: Date) {
  return d.toISOString().split("T")[0]
}
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

// ── AppointmentCard ───────────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  compact,
  isDragging,
  isMoving,
  onDragStart,
}: {
  appointment: Appointment
  compact: boolean
  isDragging: boolean
  isMoving: boolean
  onDragStart: (id: string) => void
}) {
  const card = (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", appointment.id)
        onDragStart(appointment.id)
      }}
      className={[
        "relative group rounded-lg border px-2 py-1.5 text-xs shadow-sm",
        "transition-all duration-150 select-none cursor-grab active:cursor-grabbing",
        "hover:shadow-md hover:scale-[1.02]",
        typeColor(appointment.appointment_type),
        compact ? "mb-0.5" : "mb-1",
        isDragging ? "opacity-40 scale-95" : "opacity-100",
      ].join(" ")}
    >
      {isMoving && (
        <div className="absolute inset-0 rounded-lg bg-white/70 z-10 flex items-center justify-center">
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      )}
      <div className="flex items-start gap-1">
        <GripVertical className="h-3 w-3 mt-0.5 shrink-0 opacity-40 group-hover:opacity-70" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold tabular-nums">{appointment.appointment_time}</span>
            <span className="truncate font-medium">{appointment.patients?.full_name}</span>
          </div>
          {!compact && (
            <div className="mt-0.5 truncate opacity-70 text-[10px]">
              {typeLabel(appointment.appointment_type)}
            </div>
          )}
        </div>
        {appointment.notes && (
          <StickyNote className="h-3 w-3 shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
        )}
      </div>
    </div>
  )

  if (appointment.notes) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{card}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[260px] text-xs whitespace-pre-wrap leading-relaxed z-[200]"
          >
            <p className="font-semibold mb-1">Not:</p>
            <p>{appointment.notes}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return card
}

// ── DropCell ──────────────────────────────────────────────────────────────────

function DropCell({
  ds,
  isToday,
  isOver,
  isDragActive,
  children,
  onOver,
  onLeave,
  onDrop,
}: {
  ds: string
  isToday: boolean
  isOver: boolean
  isDragActive: boolean
  children: React.ReactNode
  onOver: (ds: string) => void
  onLeave: () => void
  onDrop: (ds: string) => void
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onOver(ds) }}
      onDragLeave={onLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(ds) }}
      className={[
        "min-h-[80px] rounded-xl border-2 p-1.5 transition-all duration-150",
        isOver
          ? "border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.01]"
          : isDragActive
            ? "border-dashed border-primary/30 bg-primary/5"
            : isToday
              ? "border-transparent bg-blue-50/60"
              : "border-transparent bg-white",
      ].join(" ")}
    >
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AppointmentCalendar({
  appointments: initial,
}: {
  appointments: Appointment[]
}) {
  const [appointments, setAppointments] = useState(initial)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overDate, setOverDate] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const todayStr = toDateStr(new Date())
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const byDate = useCallback(
    (ds: string) =>
      appointments
        .filter((a) => a.appointment_date === ds)
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)),
    [appointments]
  )

  const handleDrop = async (targetDate: string) => {
    setOverDate(null)
    const id = draggingId
    setDraggingId(null)
    if (!id) return

    const appt = appointments.find((a) => a.id === id)
    if (!appt || appt.appointment_date === targetDate) return

    const origDate = appt.appointment_date
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, appointment_date: targetDate } : a))
    )
    setMovingId(id)

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_date: targetDate,
          appointment_time: appt.appointment_time,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız")

      toast({
        title: "Randevu taşındı",
        description: `${appt.patients?.full_name} → ${new Date(targetDate + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}`,
      })
      router.refresh()
    } catch (err: any) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, appointment_date: origDate } : a))
      )
      toast({ title: "Hata", description: err.message, variant: "destructive" })
    } finally {
      setMovingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => setWeekStart((w) => addDays(w, -7))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold min-w-[210px] text-center">
          {weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
          {" – "}
          {addDays(weekStart, 6).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8"
          onClick={() => setWeekStart((w) => addDays(w, 7))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground ml-1"
          onClick={() => setWeekStart(getWeekStart(new Date()))}>
          Bu hafta
        </Button>
      </div>

      {/* Drag hint */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <GripVertical className="h-3.5 w-3.5" />
        Kartı tutup farklı güne sürükleyerek taşıyabilirsiniz. SMS otomatik gönderilir.
      </p>

      {/* 7-col grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Headers */}
        {weekDays.map((day, i) => {
          const ds = toDateStr(day)
          const isToday = ds === todayStr
          const count = byDate(ds).length
          return (
            <div key={ds} className={`text-center pb-1 border-b ${isToday ? "border-primary" : "border-transparent"}`}>
              <div className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {DAYS_TR[i]}
              </div>
              <div className={`text-sm font-bold leading-tight ${isToday ? "text-primary" : "text-foreground"}`}>
                {day.getDate()}
              </div>
              {count > 0 && (
                <Badge variant="secondary"
                  className={`text-[10px] h-4 px-1 mt-0.5 ${isToday ? "bg-primary/15 text-primary" : ""}`}>
                  {count}
                </Badge>
              )}
            </div>
          )
        })}

        {/* Cells */}
        {weekDays.map((day) => {
          const ds = toDateStr(day)
          const isToday = ds === todayStr
          const dayAppts = byDate(ds)
          const compact = dayAppts.length > 5

          return (
            <DropCell
              key={ds}
              ds={ds}
              isToday={isToday}
              isOver={overDate === ds}
              isDragActive={draggingId !== null}
              onOver={setOverDate}
              onLeave={() => setOverDate(null)}
              onDrop={handleDrop}
            >
              {dayAppts.length === 0 ? (
                <div className={`flex items-center justify-center h-12 text-[10px] transition-all
                  ${draggingId ? "text-primary/60 animate-pulse" : "text-muted-foreground/30"}`}>
                  {draggingId ? "Bırak" : "—"}
                </div>
              ) : (
                dayAppts.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    compact={compact}
                    isDragging={draggingId === appt.id}
                    isMoving={movingId === appt.id}
                    onDragStart={setDraggingId}
                  />
                ))
              )}
            </DropCell>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <span key={key}
            className={`text-[10px] rounded px-1.5 py-0.5 border ${TYPE_COLORS[key]}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
