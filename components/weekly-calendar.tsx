"use client"

import AppointmentWizardModal from "@/components/appointment-wizard-modal"
import { formatDateForDB } from "@/lib/date-utils"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { ChevronLeft, ChevronRight, Lock, Check, StickyNote, GripVertical, Loader2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type WorkingHours = {
  enabled: boolean
  start: string
  end: string
}

type DoctorWorkingHours = {
  monday: WorkingHours
  tuesday: WorkingHours
  wednesday: WorkingHours
  thursday: WorkingHours
  friday: WorkingHours
  saturday: WorkingHours
  sunday: WorkingHours
}

type Doctor = {
  id: string
  name: string
  specialization: string
  working_hours?: DoctorWorkingHours
}

type Schedule = {
  id: string
  doctor_id: string
  schedule_date: string
  start_time: string
  end_time: string
  is_available: boolean
  doctors: Doctor
}

type ExistingAppointment = {
  id: string
  doctor_id: string
  patient_id?: string
  appointment_date: string
  appointment_time: string
  appointment_type?: string
  notes?: string | null
  status?: string
  patients?: {
    full_name: string
    phone: string
  }
}

type PrefilledPatient = {
  id?: string
  full_name: string
  phone: string
  tc_no: string
  date_of_birth?: string | null
}

type Props = {
  doctor: Doctor | null
  schedules: Schedule[]
  existingAppointments: ExistingAppointment[]
  preselectedType?: string
  preselectedDate?: string | null
  preselectedTime?: string | null
  isAdmin?: boolean
  fetalBebekSayisi?: string | null
  prefilledPatient?: PrefilledPatient | null
  embedded?: boolean
}

export default function WeeklyCalendar({ doctor, schedules, existingAppointments, preselectedType, preselectedDate, preselectedTime, isAdmin = false, fetalBebekSayisi = null, prefilledPatient = null, embedded = false }: Props) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // If AI preselected a date, show that week
    if (preselectedDate) {
      const date = new Date(preselectedDate)
      const dayOfWeek = date.getDay()
      const monday = new Date(date)
      if (dayOfWeek === 0) monday.setDate(date.getDate() + 1)
      else if (dayOfWeek === 6) monday.setDate(date.getDate() + 2)
      else monday.setDate(date.getDate() - (dayOfWeek - 1))
      monday.setHours(0, 0, 0, 0)
      return monday
    }

    const today = new Date()
    const dayOfWeek = today.getDay()

    let monday = new Date(today)

    // If today is Saturday (6) or Sunday (0), show next week
    if (dayOfWeek === 0) {
      // Sunday -> next day (Monday)
      monday.setDate(today.getDate() + 1)
    } else if (dayOfWeek === 6) {
      // Saturday -> 2 days later (Monday)
      monday.setDate(today.getDate() + 2)
    } else {
      // Monday-Friday -> go to Monday of current week
      monday.setDate(today.getDate() - (dayOfWeek - 1))
    }

    monday.setHours(0, 0, 0, 0)
    return monday
  })

  const [selectedSlot, setSelectedSlot] = useState<{
    date: string
    time: string
    doctorId: string
  } | null>(() => {
    // If AI preselected a slot, auto-open wizard
    if (preselectedDate && preselectedTime && doctor) {
      return { date: preselectedDate, time: preselectedTime, doctorId: doctor.id }
    }
    return null
  })

  const [isWizardOpen, setIsWizardOpen] = useState(() => !!(preselectedDate && preselectedTime && doctor))
  const [selectedDay, setSelectedDay] = useState(0) // 0-4 arası index (Pazartesi-Cuma)
  const router = useRouter()
  const { toast } = useToast()

  // Drag & drop state
  const [draggingAppt, setDraggingAppt] = useState<ExistingAppointment | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<{ date: string; time: string } | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [localAppointments, setLocalAppointments] = useState(existingAppointments)

  // Props değişince local state'i güncelle
  useEffect(() => {
    setLocalAppointments(existingAppointments)
  }, [existingAppointments])

  const daysOfWeek = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"]

  const getWeekDays = () => {
    const days = []
    for (let i = 0; i < 5; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      days.push(date)
    }
    return days
  }

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)

    const minMonday = new Date("2026-01-05")
    if (newStart < minMonday) {
      return // Don't go to previous week if it would be before Jan 5, 2026
    }

    setCurrentWeekStart(newStart)
  }

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setCurrentWeekStart(newStart)
  }

  const getWorkingHoursForDay = (date: Date): { start: string; end: string } | null => {
    if (!doctor?.working_hours) {
      return { start: "09:00", end: "17:00" } // Default fallback
    }

    const dayOfWeek = date.getDay()
    const dayNames: (keyof DoctorWorkingHours)[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ]

    const dayName = dayNames[dayOfWeek]
    const dayHours = doctor.working_hours[dayName]

    if (!dayHours || !dayHours.enabled) {
      return null // Day is not working
    }

    return { start: dayHours.start, end: dayHours.end }
  }

  const generateTimeSlots = (startTime: string, endTime: string, appointmentType?: string) => {
    const slots = []
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)

    // Başlangıcı en yakın 15 dakikaya yukarı yuvarla (00/15/30/45)
    const startMins = start.getMinutes()
    const startRemainder = startMins % 15
    if (startRemainder !== 0) {
      start.setMinutes(startMins + (15 - startRemainder))
      start.setSeconds(0)
    }

    // Bitişi en yakın 15 dakikaya aşağı yuvarla
    const endMins = end.getMinutes()
    const endRemainder = endMins % 15
    if (endRemainder !== 0) {
      end.setMinutes(endMins - endRemainder)
      end.setSeconds(0)
    }

    // Admin: tüm slotları göster (15 dakikalık)
    // Hasta + Ayrintili Fetal USG: sadece :00 ve :30
    // Hasta + diğer tipler: tüm 15 dakikalık slotlar
    const onlyHalfHour = !isAdmin && appointmentType === "ayrintili-fetal-ultrason"

    while (start <= end) {
      const timeStr = start.toTimeString().slice(0, 5)
      const mins = start.getMinutes()

      if (isAdmin || !onlyHalfHour || mins === 0 || mins === 30) {
        slots.push(timeStr)
      }

      start.setMinutes(start.getMinutes() + 15)
    }

    return slots
  }

  const isSlotBooked = (doctorId: string, date: Date, time: string) => {
    const dateStr = formatDateForDB(date)
    return localAppointments.some((apt) => {
      const aptTime = apt.appointment_time.slice(0, 5)
      return apt.doctor_id === doctorId && apt.appointment_date === dateStr && aptTime === time
    })
  }

  const getBookedAppointment = (doctorId: string, date: Date, time: string) => {
    const dateStr = formatDateForDB(date)
    return localAppointments.find((apt) => {
      const aptTime = apt.appointment_time.slice(0, 5)
      return apt.doctor_id === doctorId && apt.appointment_date === dateStr && aptTime === time
    })
  }

  // Drag handlers
  const handleDragStart = (appt: ExistingAppointment) => {
    setDraggingAppt(appt)
  }

  const handleDragEnd = () => {
    setDraggingAppt(null)
    setDragOverSlot(null)
  }

  const handleDrop = async (targetDate: string, targetTime: string) => {
    if (!draggingAppt) return
    const appt = draggingAppt
    setDraggingAppt(null)
    setDragOverSlot(null)

    // Aynı slot'a bırakıldıysa bir şey yapma
    if (appt.appointment_date === targetDate && appt.appointment_time.slice(0, 5) === targetTime) return

    // Hedef slot dolu mu kontrol et
    const targetBooked = localAppointments.some(
      (a) => a.id !== appt.id && a.appointment_date === targetDate && a.appointment_time.slice(0, 5) === targetTime
    )
    if (targetBooked) {
      toast({ title: "Hata", description: "Bu slot zaten dolu", variant: "destructive" })
      return
    }

    // Optimistic update
    const origDate = appt.appointment_date
    const origTime = appt.appointment_time
    setLocalAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, appointment_date: targetDate, appointment_time: targetTime } : a))
    )
    setMovingId(appt.id)

    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_date: targetDate, appointment_time: targetTime }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız")

      toast({
        title: "Randevu taşındı",
        description: `${appt.patients?.full_name} → ${new Date(targetDate + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} ${targetTime}`,
      })
      router.refresh()
    } catch (err: any) {
      // Rollback
      setLocalAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, appointment_date: origDate, appointment_time: origTime } : a))
      )
      toast({ title: "Hata", description: err.message, variant: "destructive" })
    } finally {
      setMovingId(null)
    }
  }

  const getAppointmentTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      "gebelik-takibi": "Gebelik Takibi",
      "jinekolojik-muayene": "Jinekolojik Muayene",
      "asilama-tup-bebek": "Aşılama / Tüp Bebek",
      "gebelik-istemi-infertilite": "Gebelik İstemi / İnfertilite",
      "ayrintili-fetal-ultrason": "Ayrıntılı Fetal Ultrason",
      "kontrol-takip": "Kontrol / Takip",
    }
    return type ? labels[type] || type : "Randevu"
  }

  const isSlotPast = (date: Date, time: string) => {
    const now = new Date()
    const dateStr = formatDateForDB(date)
    const slotDate = new Date(`${dateStr}T${time}`)
    return slotDate < now
  }

  // Ayrıntılı fetal ultrason: sadece :00 ve :30 slotlar
  const isFetalRestrictedSlot = (time: string) => {
    if (preselectedType !== "ayrintili-fetal-ultrason") return false
    const minutes = time.split(":")[1]
    return minutes !== "00" && minutes !== "30"
  }

  // En yakın boş tam/bucukluk saati bul
  const findNearestFetalSlot = (date: Date, time: string, doctorId: string): string | null => {
    const dateStr = formatDateForDB(date)
    const [h, m] = time.split(":").map(Number)
    const timeInMin = h * 60 + m
    const candidates = [
      Math.floor(timeInMin / 30) * 30,
      Math.ceil(timeInMin / 30) * 30,
    ]
    for (const t of candidates) {
      const hh = Math.floor(t / 60).toString().padStart(2, "0")
      const mm = (t % 60).toString().padStart(2, "0")
      const candidate = `${hh}:${mm}`
      const isBooked = localAppointments.some(
        (a) => a.doctor_id === doctorId && a.appointment_date === dateStr && a.appointment_time.slice(0, 5) === candidate
      )
      if (!isBooked) return candidate
    }
    return null
  }

  const handleSlotClick = (date: Date, time: string, doctorId: string) => {
    if (isFetalRestrictedSlot(time)) {
      const suggested = findNearestFetalSlot(date, time, doctorId)
      if (suggested) {
        toast({
          title: "Ayrintili Fetal Ultrason",
          description: `Bu randevu tipi sadece tam ve bucuklu saatlerde verilebilir. En yakin musait saat: ${suggested}`,
          variant: "default",
        })
      } else {
        toast({
          title: "Musait Slot Yok",
          description: "Bu saate yakin musait tam/bucuk saatli slot bulunamadi. Lutfen baska bir zaman deneyin.",
          variant: "destructive",
        })
      }
      return
    }
    const dateStr = formatDateForDB(date)
    setSelectedSlot({ date: dateStr, time, doctorId })
    setIsWizardOpen(true)
  }

  const handleWizardSuccess = () => {
    setIsWizardOpen(false)
    setSelectedSlot(null)
    router.refresh()
  }

  const weekDays = getWeekDays()

  if (!doctor) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Henüz kayıtlı doktor bulunmamaktadır.</p>
        </CardContent>
      </Card>
    )
  }

  const selectedDate = weekDays[selectedDay]
  const selectedDateStr = formatDateForDB(selectedDate)
  const selectedDayWorkingHours = getWorkingHoursForDay(selectedDate)
  const selectedDaySchedules = schedules.filter((s) => s.schedule_date === selectedDateStr && s.doctor_id === doctor.id)

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {!embedded && (
        <Card>
          <CardHeader>
            <CardTitle>Doktor Bilgileri</CardTitle>
            <CardDescription>
              {doctor.name} - {doctor.specialization}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Tarih ve Saat Seçin</CardTitle>
              <CardDescription>Müsait bir saat seçin</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium whitespace-nowrap">
                {weekDays[0].toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} -{" "}
                {weekDays[4].toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {weekDays.map((date, index) => {
                const isSelected = index === selectedDay
                const dateStr = formatDateForDB(date)
                const hasSlotsAvailable = schedules.some(
                  (s) => s.schedule_date === dateStr && s.doctor_id === doctor.id,
                )

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    className={`flex-shrink-0 rounded-xl border-2 px-4 py-3 transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                        : hasSlotsAvailable
                          ? "border-border bg-background hover:border-primary/50"
                          : "border-border bg-muted opacity-60"
                    }`}
                  >
                    <div className="text-xs font-medium">{daysOfWeek[index]}</div>
                    <div className="text-sm font-semibold">{date.toLocaleDateString("tr-TR", { day: "numeric" })}</div>
                    <div className="text-xs opacity-80">{date.toLocaleDateString("tr-TR", { month: "short" })}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Haftalık uyarı — bu haftada hiç program yoksa */}
          {(() => {
            const hasAnySchedule = weekDays.some((date) => {
              const dateStr = formatDateForDB(date)
              return schedules.some((s) => s.schedule_date === dateStr && s.doctor_id === doctor.id)
            })
            if (!hasAnySchedule) {
              return (
                <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Bu hafta için randevu programı henüz girilmemiş. Ok tuşlarıyla başka bir haftaya geçebilirsiniz.
                </div>
              )
            }
            return null
          })()}

          <div className="hidden md:block overflow-x-auto">
            <div className="grid min-w-[800px] grid-cols-5 gap-2">
              {weekDays.map((date, index) => {
                const dateStr = formatDateForDB(date)
                const workingHours = getWorkingHoursForDay(date)
                const daySchedules = schedules.filter((s) => s.schedule_date === dateStr && s.doctor_id === doctor.id)

                return (
                  <div key={index} className="space-y-2">
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <div className="text-xs font-medium">{daysOfWeek[index]}</div>
                      <div className="text-sm">
                        {date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </div>
                      {daySchedules.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {daySchedules[0].start_time.slice(0,5)}-{daySchedules[0].end_time.slice(0,5)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {!workingHours ? (
                        <div className="rounded border border-dashed p-2 text-center text-xs text-muted-foreground">
                          Kapalı
                        </div>
                      ) : daySchedules.length === 0 ? (
                        <div className="rounded border border-dashed p-2 text-center text-xs text-muted-foreground">
                          Kapalı
                        </div>
                      ) : (
                        daySchedules.map((schedule) => {
                          const timeSlots = generateTimeSlots(
                            schedule.start_time,
                            schedule.end_time,
                            preselectedType,
                          )
                          return (
                            <div key={schedule.id} className="space-y-1">
                              {timeSlots.map((time) => {
                                const isBooked = isSlotBooked(schedule.doctor_id, date, time)
                                const isPast = isSlotPast(date, time)
                                const appointment = isBooked ? getBookedAppointment(schedule.doctor_id, date, time) : null

                                if (isBooked && appointment) {
                                  const phone = appointment.patients?.phone
                                  const showPhone = phone && phone !== "0000000000"
                                  const isDragging = draggingAppt?.id === appointment.id
                                  const isMoving = movingId === appointment.id

                                  const isCancelled = appointment.status === "cancelled"
                                  const card = (
                                    <div
                                      key={time}
                                      draggable={!isCancelled}
                                      onDragStart={() => !isCancelled && handleDragStart(appointment)}
                                      onDragEnd={handleDragEnd}
                                      onClick={(e) => {
                                        if (isAdmin && appointment.patient_id && !isCancelled) {
                                          e.stopPropagation()
                                          router.push(`/admin/patients/${appointment.patient_id}`)
                                        }
                                      }}
                                      className={`group relative w-full rounded-md px-2 py-1.5 text-xs transition-all ${
                                        isCancelled 
                                          ? "bg-gray-400 text-white opacity-60 cursor-not-allowed" 
                                          : isDragging 
                                            ? "bg-red-600 text-white opacity-40 scale-95 cursor-grabbing" 
                                            : isAdmin 
                                              ? "bg-red-600 text-white opacity-100 hover:shadow-lg hover:scale-[1.02] cursor-pointer" 
                                              : "bg-red-600 text-white opacity-100 cursor-grab active:cursor-grabbing"
                                      }`}
                                    >
                                      {isMoving && (
                                        <div className="absolute inset-0 rounded-md bg-white/50 flex items-center justify-center z-10">
                                          <Loader2 className="h-3 w-3 animate-spin text-red-600" />
                                        </div>
                                      )}
                                      <div className="flex items-start gap-1">
                                        <GripVertical className="h-3 w-3 mt-0.5 shrink-0 opacity-50 group-hover:opacity-100" />
                                        <div className="min-w-0 flex-1">
                                          <div className="font-bold text-[11px] opacity-80 mb-0.5">{time}</div>
                                          {isAdmin ? (
                                            <>
                                              <div className="font-semibold truncate hover:underline">
                                                {appointment.patients?.full_name || "Hasta"}
                                                {isCancelled && <span className="ml-1 text-[9px] bg-white/30 px-1 rounded">İPTAL</span>}
                                              </div>
                                              {showPhone && <div className="opacity-80 truncate text-[10px]">{phone}</div>}
                                              {appointment.appointment_type === "ayrintili-fetal-ultrason" && appointment.fetal_bebek_sayisi && (
                                                <div className="text-[9px] opacity-90 font-medium bg-white/20 rounded px-1 mt-0.5 inline-block">
                                                  {appointment.fetal_bebek_sayisi === "tek" ? "Tek Bebek" : appointment.fetal_bebek_sayisi === "ikiz" ? "Ikiz Bebek" : "Ucuz Bebek"}
                                                </div>
                                              )}
                                            </>
                                          ) : (
                                            <div className="font-semibold">Dolu</div>
                                          )}
                                        </div>
                                        {appointment.notes && (
                                          <StickyNote className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                                        )}
                                      </div>
                                    </div>
                                  )

                                  if (appointment.notes) {
                                    return (
                                      <TooltipProvider key={time} delayDuration={200}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            {card}
                                          </TooltipTrigger>
                                          <TooltipContent side="right" className="max-w-[220px] text-xs whitespace-pre-wrap z-[100]">
                                            <p className="font-semibold mb-1">Not:</p>
                                            <p>{appointment.notes}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )
                                  }

                                  return card
                                }

                                const slotDateStr = formatDateForDB(date)
                                const isDropTarget = dragOverSlot?.date === slotDateStr && dragOverSlot?.time === time
                                const isFetalBlocked = isFetalRestrictedSlot(time)

                                return (
                                  <div
                                    key={time}
                                    onDragOver={(e) => {
                                      e.preventDefault()
                                      e.dataTransfer.dropEffect = "move"
                                      if (!isPast && !isFetalBlocked) setDragOverSlot({ date: slotDateStr, time })
                                    }}
                                    onDragLeave={() => setDragOverSlot(null)}
                                    onDrop={(e) => {
                                      e.preventDefault()
                                      if (!isPast && !isFetalBlocked) handleDrop(slotDateStr, time)
                                    }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      title={isFetalBlocked ? "Fetal ultrason sadece tam ve bucuklu saatlerde" : undefined}
                                      className={`w-full text-xs transition-all ${
                                        isPast ? "opacity-50 cursor-not-allowed" :
                                        isFetalBlocked ? "opacity-30 cursor-not-allowed bg-gray-50 border-dashed" :
                                        isDropTarget ? "border-primary bg-primary/10 ring-2 ring-primary/30 scale-105" :
                                        draggingAppt ? "border-dashed border-primary/40" : ""
                                      }`}
                                      disabled={isPast}
                                      onClick={() => handleSlotClick(date, time, schedule.doctor_id)}
                                    >
                                      {isDropTarget && draggingAppt ? "Birak" : time}
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {!selectedDayWorkingHours ? (
              <div className="rounded-xl border-2 border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">Bu gün kapalı</p>
              </div>
            ) : selectedDaySchedules.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">Bu gün için müsait randevu bulunmamaktadır</p>
              </div>
            ) : (
              selectedDaySchedules.map((schedule) => {
                const timeSlots = generateTimeSlots(
                  schedule.start_time,
                  schedule.end_time,
                  preselectedType,
                )
                return (
                  <div key={schedule.id} className="space-y-2">
                    {timeSlots.map((time) => {
                      const isBooked = isSlotBooked(schedule.doctor_id, selectedDate, time)
                      const isPast = isSlotPast(selectedDate, time)
                      const isSelectedSlot = selectedSlot?.date === selectedDateStr && selectedSlot?.time === time
                      const appointment = isBooked ? getBookedAppointment(schedule.doctor_id, selectedDate, time) : null

                      const button = (
                        <button
                          key={time}
                          disabled={isPast && !isBooked}
                          onClick={() => !isBooked && handleSlotClick(selectedDate, time, schedule.doctor_id)}
                          className={`w-full min-h-[52px] rounded-xl border-2 px-6 py-3 font-medium transition-all duration-200 ${
                            isBooked
                              ? "border-red-200 bg-red-50 text-red-700 cursor-pointer"
                              : isPast
                                ? "border-muted bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                                : isSelectedSlot
                                  ? "border-primary bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                                  : "border-border bg-background hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
                          }`}
                        >
                          {isBooked ? (
                            <div className="flex flex-col items-start gap-0.5 w-full">
                              <div className="text-xs font-bold opacity-70">{time}</div>
                              {isAdmin ? (
                                <>
                                  <div className="font-semibold text-sm">{appointment?.patients?.full_name || "Hasta"}</div>
                                  {appointment?.patients?.phone && appointment.patients.phone !== "0000000000" && (
                                    <div className="text-xs opacity-80">{appointment.patients.phone}</div>
                                  )}
                                </>
                              ) : (
                                <div className="font-semibold text-sm">Dolu</div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-base">{time}</span>
                              {isSelectedSlot && <Check className="h-5 w-5" />}
                            </div>
                          )}
                        </button>
                      )

                      return button
                    })}
                  </div>
                )
              })
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded border bg-background" />
              <span>Müsait</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded border bg-red-600" />
              <span>Dolu</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded border bg-muted opacity-50" />
              <span>Geçmiş</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSlot && !embedded && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-lg animate-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Seçilen Tarih</span>
              <span className="font-medium">
                {new Date(selectedSlot.date).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Seçilen Saat</span>
              <span className="font-medium text-lg">{selectedSlot.time}</span>
            </div>
            <Button className="w-full h-12 text-base font-semibold" onClick={() => setIsWizardOpen(true)}>
              Devam Et
            </Button>
          </div>
        </div>
      )}

      <AppointmentWizardModal
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false)
          setSelectedSlot(null)
        }}
        selectedSlot={selectedSlot}
        doctorName={doctor?.name || ""}
        onSuccess={handleWizardSuccess}
        preselectedType={preselectedType}
        fetalBebekSayisi={fetalBebekSayisi}
        isAdmin={isAdmin}
        prefilledPatient={prefilledPatient}
      />
    </div>
  )
}
