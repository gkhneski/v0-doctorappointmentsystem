"use client"

import AppointmentWizardModal from "@/components/appointment-wizard-modal"
import { formatDateForDB } from "@/lib/date-utils"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { ChevronLeft, ChevronRight, Lock, Check } from "lucide-react"
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
  doctor_id: string
  appointment_date: string
  appointment_time: string
  appointment_type?: string
  patients?: {
    full_name: string
    phone: string
  }
}

type Props = {
  doctor: Doctor | null
  schedules: Schedule[]
  existingAppointments: ExistingAppointment[]
  preselectedType?: string
}

export default function WeeklyCalendar({ doctor, schedules, existingAppointments, preselectedType }: Props) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
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

    console.log("[v0] Initial Monday (current/next week):", monday.toLocaleDateString("tr-TR"))
    return monday
  })

  const [selectedSlot, setSelectedSlot] = useState<{
    date: string
    time: string
    doctorId: string
  } | null>(null)

  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0) // 0-4 arası index (Pazartesi-Cuma)
  const router = useRouter()

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

  const generateTimeSlots = (startTime: string, endTime: string) => {
    const slots = []
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)

    while (start <= end) {
      slots.push(start.toTimeString().slice(0, 5))
      start.setMinutes(start.getMinutes() + 15)
    }

    return slots
  }

  const isSlotBooked = (doctorId: string, date: Date, time: string) => {
    const dateStr = formatDateForDB(date)
    return existingAppointments.some((apt) => {
      const aptTime = apt.appointment_time.slice(0, 5)
      return apt.doctor_id === doctorId && apt.appointment_date === dateStr && aptTime === time
    })
  }

  const getBookedAppointment = (doctorId: string, date: Date, time: string) => {
    const dateStr = formatDateForDB(date)
    return existingAppointments.find((apt) => {
      const aptTime = apt.appointment_time.slice(0, 5)
      return apt.doctor_id === doctorId && apt.appointment_date === dateStr && aptTime === time
    })
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

  const handleSlotClick = (date: Date, time: string, doctorId: string) => {
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doktor Bilgileri</CardTitle>
          <CardDescription>
            {doctor.name} - {doctor.specialization}
          </CardDescription>
        </CardHeader>
      </Card>

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
                      {workingHours && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {workingHours.start}-{workingHours.end}
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
                            workingHours?.start || schedule.start_time,
                            workingHours?.end || schedule.end_time,
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
                                  return (
                                    <div
                                      key={time}
                                      className="w-full rounded-md bg-red-600 text-white px-2 py-1.5 text-xs cursor-default"
                                    >
                                      <div className="font-bold text-[11px] opacity-80 mb-0.5">{time}</div>
                                      <div className="font-semibold truncate">{appointment.patients?.full_name || "Hasta"}</div>
                                      {showPhone && <div className="opacity-80 truncate">{phone}</div>}
                                    </div>
                                  )
                                }

                                return (
                                  <Button
                                    key={time}
                                    variant="outline"
                                    size="sm"
                                    className={`w-full text-xs ${isPast ? "opacity-50 cursor-not-allowed" : ""}`}
                                    disabled={isPast}
                                    onClick={() => handleSlotClick(date, time, schedule.doctor_id)}
                                  >
                                    {time}
                                  </Button>
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
                  selectedDayWorkingHours?.start || schedule.start_time,
                  selectedDayWorkingHours?.end || schedule.end_time,
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
                              <div className="font-semibold text-sm">{appointment?.patients?.full_name || "Hasta"}</div>
                              {appointment?.patients?.phone && appointment.patients.phone !== "0000000000" && (
                                <div className="text-xs opacity-80">{appointment.patients.phone}</div>
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

      {selectedSlot && (
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
      />
    </div>
  )
}
