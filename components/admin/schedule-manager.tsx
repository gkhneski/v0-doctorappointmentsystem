"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Clock, Edit, Save, X, ChevronDown, ChevronUp, Plus, Trash2, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { resetSchedulesForMonth } from "@/app/actions/reset-schedules"

// Sadece 00/15/30/45 dakika seçenekleri - 08:00'dan 20:00'a kadar
const TIME_SLOTS: string[] = []
for (let h = 8; h <= 20; h++) {
  for (const m of [0, 15, 30, 45]) {
    if (h === 20 && m > 0) break
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
  }
}

type Doctor = {
  id: string
  name: string
  specialization: string
}

type Schedule = {
  id: string
  doctor_id: string
  schedule_date: string
  start_time: string
  end_time: string
  slot_duration: number
  is_available: boolean
  notes: string | null
  doctors: {
    name: string
    specialization: string
  } | null
}

type WeeklyPattern = {
  id: string
  doctor_id: string
  day_of_week: number
  is_working: boolean
  start_time: string
  end_time: string
  slot_duration: number
  notes: string | null
}

const MONTHS = [
  { value: 0, label: "Ocak" },
  { value: 1, label: "Şubat" },
  { value: 2, label: "Mart" },
  { value: 3, label: "Nisan" },
  { value: 4, label: "Mayıs" },
  { value: 5, label: "Haziran" },
  { value: 6, label: "Temmuz" },
  { value: 7, label: "Ağustos" },
  { value: 8, label: "Eylül" },
  { value: 9, label: "Ekim" },
  { value: 10, label: "Kasım" },
  { value: 11, label: "Aralık" },
]

const DAYS = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 7, label: "Pazar" },
]

const years = [2026, 2027, 2028, 2029, 2030] // Declare the years variable

export default function ScheduleManager({ doctors, schedules }: { doctors: Doctor[]; schedules: Schedule[] }) {
  const today = new Date()

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedDoctor] = useState<string>(doctors[0]?.id || "")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("18:00")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)

  // Alert Dialog state
  const [alertType, setAlertType] = useState<"generate" | "reset" | "delete" | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  
  // Weekly Pattern states
  const [showPatternTab, setShowPatternTab] = useState(false)
  const [weeklyPatterns, setWeeklyPatterns] = useState<WeeklyPattern[]>([])
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false)
  const [isSavingPatterns, setIsSavingPatterns] = useState(false)
  const [patternError, setPatternError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Weekly patterns yükle
  useEffect(() => {
    const loadPatterns = async () => {
      if (!selectedDoctor) return
      setIsLoadingPatterns(true)
      try {
        const res = await fetch(`/api/weekly-patterns?doctor_id=${selectedDoctor}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setWeeklyPatterns(data)
        }
      } catch (err) {
        console.error("[v0] Pattern load error:", err)
      } finally {
        setIsLoadingPatterns(false)
      }
    }

    loadPatterns()
  }, [selectedDoctor])

  const getMonthWeekdays = () => {
    const weekdays = []
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate()

    for (let day = 1; day <= lastDay; day++) {
      // Use numeric constructor to avoid timezone shifts
      const date = new Date(selectedYear, selectedMonth, day)

      // Skip dates before January 1, 2026
      if (selectedYear < 2026 || (selectedYear === 2026 && selectedMonth === 0 && day < 1)) {
        continue
      }

      const dayOfWeek = date.getDay()
      // Monday = 1, Friday = 5
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Format as YYYY-MM-DD for database storage
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const dayStr = String(date.getDate()).padStart(2, "0")
        weekdays.push(`${year}-${month}-${dayStr}`)
      }
    }
    return weekdays
  }

  const monthWeekdays = getMonthWeekdays()

  const schedulesByDate = monthWeekdays.map((date) => {
    const schedule = schedules.find((s) => s.schedule_date === date && s.doctor_id === selectedDoctor)
    return { date, schedule }
  })

  const existingSchedule = selectedDate
    ? schedules.find((s) => s.schedule_date === selectedDate && s.doctor_id === selectedDoctor)
    : null

  const handleGenerateMonth = async () => {
    setAlertType("generate")
    setShowAlert(true)
  }

  const confirmGenerateMonth = async () => {
    setShowAlert(false)
    setIsGenerating(true)
    setError(null)
    const supabase = createClient()

    try {
      const getPatternForDate = (dateStr: string) => {
        const jsDay = new Date(dateStr).getDay()
        const dayOfWeek = jsDay === 0 ? 7 : jsDay
        return weeklyPatterns.find((p) => p.day_of_week === dayOfWeek)
      }

      const weekdaysToGenerate = monthWeekdays.map((date) => {
        const pattern = getPatternForDate(date)
        return {
          doctor_id: selectedDoctor,
          schedule_date: date,
          start_time: pattern?.start_time || "09:00",
          end_time: pattern?.end_time || "18:00",
          is_available: false,
        }
      })

      const { error: insertError } = await supabase.from("doctor_schedules").upsert(weekdaysToGenerate, {
        onConflict: "doctor_id,schedule_date",
        ignoreDuplicates: false,
      })

      if (insertError) throw insertError

      alert(`${weekdaysToGenerate.length} iş günü için program başarıyla oluşturuldu!`)
      router.refresh()
    } catch (err: unknown) {
      console.error("[v0] Generate error:", err)
      setError(err instanceof Error ? err.message : "Programlar oluşturulamadı")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRowClick = (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null)
      setEditMode(false)
    } else {
      setSelectedDate(date)
      setEditMode(false)
      setError(null)

      const dateSchedule = schedules.find((s) => s.schedule_date === date && s.doctor_id === selectedDoctor)

      if (dateSchedule) {
        setStartTime(dateSchedule.start_time.slice(0, 5))
        setEndTime(dateSchedule.end_time.slice(0, 5))
        setNotes(dateSchedule.notes || "")
      } else {
        // Sal(2) ve Per(4): 13:00 | Pzt(1),Çar(3),Cum(5): 11:30
        const jsDay = new Date(date).getDay()
        const isTueThu = jsDay === 2 || jsDay === 4
        setStartTime(isTueThu ? "13:00" : "11:30")
        setEndTime("18:00")
        setNotes("")
      }
    }
  }

  const handleEditClick = () => {
    if (existingSchedule) {
      setStartTime(existingSchedule.start_time.slice(0, 5))
      setEndTime(existingSchedule.end_time.slice(0, 5))
      setNotes(existingSchedule.notes || "")
      setEditMode(true)
    }
  }

  const formatDisplayDate = (dateStr: string) => {
    // Parse YYYY-MM-DD manually to avoid timezone shifts
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)

    const weekdayName = date.toLocaleDateString("tr-TR", { weekday: "long" })
    const dayNum = date.getDate()
    const monthNum = date.getMonth() + 1
    return `${weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1)}, ${dayNum}/${monthNum}`
  }

  const handleAddSchedule = async () => {
    if (!selectedDoctor || !selectedDate) {
      setError("Lütfen bir tarih seçin")
      return
    }

    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { error: insertError } = await supabase.from("doctor_schedules").insert({
        doctor_id: selectedDoctor,
        schedule_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        slot_duration: 15,
        is_available: true,
        notes: notes || null,
      })

      if (insertError) throw insertError

      router.refresh()
      setStartTime("11:30")
      setEndTime("18:00")
      setNotes("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Program eklenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSchedule = async () => {
    if (!existingSchedule) return

    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from("doctor_schedules")
        .update({
          start_time: startTime,
          end_time: endTime,
          notes: notes || null,
        })
        .eq("id", existingSchedule.id)

      if (updateError) throw updateError

      router.refresh()
      setEditMode(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Program güncellenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAvailability = async () => {
    if (!existingSchedule) return

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from("doctor_schedules")
        .update({ is_available: !existingSchedule.is_available })
        .eq("id", existingSchedule.id)

      if (updateError) throw updateError

      router.refresh()
    } catch (err) {
      console.error("Error updating schedule:", err)
    }
  }

  const handleDeleteMonth = async () => {
    setAlertType("delete")
    setShowAlert(true)
  }

  const confirmDeleteMonth = async () => {
    setShowAlert(false)
    setIsDeletingAll(true)
    setError(null)
    const supabase = createClient()

    try {
      const schedulesToDelete = schedules
        .filter((s) => {
          const scheduleDate = new Date(s.schedule_date)
          return (
            scheduleDate.getMonth() === selectedMonth &&
            scheduleDate.getFullYear() === selectedYear &&
            s.doctor_id === selectedDoctor
          )
        })
        .map((s) => s.id)

      if (schedulesToDelete.length === 0) {
        alert("Silinecek program bulunamadı.")
        return
      }

      const { error: deleteError } = await supabase.from("doctor_schedules").delete().in("id", schedulesToDelete)

      if (deleteError) throw deleteError

      alert(`${schedulesToDelete.length} program başarıyla silindi!`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Programlar silinemedi")
    } finally {
      setIsDeletingAll(false)
    }
  }

  const handleResetMonth = async () => {
    setAlertType("reset")
    setShowAlert(true)
  }

  const confirmResetMonth = async () => {
    setShowAlert(false)
    setIsGenerating(true)
    setError(null)

    try {
      const result = await resetSchedulesForMonth(selectedYear, selectedMonth + 1)

      if (!result.success) {
        throw new Error(result.error || "İşlem başarısız")
      }

      alert(`${result.created} iş günü için program başarıyla oluşturuldu! Tüm hafta sonu kayıtları temizlendi.`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Programlar sıfırlanamadı")
    } finally {
      setIsGenerating(false)
    }
  }

  // Haftalık pattern'i kaydet
  const handleSavePatterns = async () => {
    setIsSavingPatterns(true)
    setPatternError(null)

    try {
      const res = await fetch("/api/weekly-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedDoctor,
          patterns: weeklyPatterns,
        }),
      })

      if (!res.ok) throw new Error("Patterns kaydedilemedi")

      alert("Haftalık desen başarıyla kaydedildi!")
    } catch (err) {
      console.error("[v0] Save patterns error:", err)
      setPatternError(err instanceof Error ? err.message : "Hata oluştu")
    } finally {
      setIsSavingPatterns(false)
    }
  }

  // Ayı pattern'e göre doldur
  const handleApplyPatternToMonth = async () => {
    if (
      !confirm(
        `${MONTHS[selectedMonth].label} ${selectedYear} ayındaki tüm iş günlerine haftalık desen uygulanacak. Mevcut programlar değiştirilmeyecek. Devam edilsin mi?`,
      )
    ) {
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/weekly-patterns/apply-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedDoctor,
          year: selectedYear,
          month: selectedMonth + 1,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Desen uygulanamadı")

      alert(`${data.created} programa desen başarıyla uygulandı!`)
      router.refresh()
    } catch (err) {
      console.error("[v0] Apply pattern error:", err)
      setError(err instanceof Error ? err.message : "Desen uygulanamadı")
    } finally {
      setIsGenerating(false)
    }
  }

  // Haftalık pattern güncelle
  const updatePattern = (dayOfWeek: number, field: string, value: any) => {
    setWeeklyPatterns((prev) => {
      const existing = prev.find((p) => p.day_of_week === dayOfWeek)
      if (existing) {
        return prev.map((p) => (p.day_of_week === dayOfWeek ? { ...p, [field]: value } : p))
      } else {
        return [
          ...prev,
          {
            id: `temp-${dayOfWeek}`,
            doctor_id: selectedDoctor,
            day_of_week: dayOfWeek,
            is_working: field === "is_working" ? value : true,
            start_time: field === "start_time" ? value : "09:00",
            end_time: field === "end_time" ? value : "18:00",
            slot_duration: field === "slot_duration" ? value : 15,
            notes: field === "notes" ? value : null,
          },
        ]
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerateMonth} disabled={isGenerating} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            {isGenerating ? "Oluşturuluyor..." : "Program Oluştur"}
          </Button>

          <Button onClick={handleResetMonth} disabled={isGenerating} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            {isGenerating ? "Sıfırlanıyor..." : "Sıfırla (Hafta Sonu Temizle)"}
          </Button>

          <Button onClick={handleDeleteMonth} disabled={isDeletingAll} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeletingAll ? "Siliniyor..." : "Tümünü Sil"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {MONTHS[selectedMonth].label} {selectedYear} - İş Günleri ({monthWeekdays.length} gün)
          </CardTitle>
          <CardDescription>Bir tarihe tıklayarak program detaylarını görüntüleyin ve düzenleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Saat Aralığı</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedulesByDate.map(({ date, schedule }) => (
                <React.Fragment key={date}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(date)}
                  >
                    <TableCell className="font-medium">{formatDisplayDate(date)}</TableCell>
                    <TableCell>
                      {schedule ? (
                        <Badge variant={schedule.is_available ? "default" : "secondary"}>
                          {schedule.is_available ? "Aktif" : "Kapalı"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Program Yok</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {schedule ? (
                        <span className="text-sm">
                          {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {selectedDate === date ? (
                        <ChevronUp className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      )}
                    </TableCell>
                  </TableRow>

                  {selectedDate === date && (
                    <TableRow>
                      <TableCell colSpan={4} className="bg-muted/30 p-0">
                        <div className="p-4">
                          {existingSchedule ? (
                            <div className="space-y-4">
                              {!editMode ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <Clock className="h-5 w-5 text-muted-foreground" />
                                      <span className="text-lg font-medium">
                                        {existingSchedule.start_time.slice(0, 5)} -{" "}
                                        {existingSchedule.end_time.slice(0, 5)}
                                      </span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleEditClick}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Düzenle
                                    </Button>
                                  </div>

                                  {existingSchedule.notes && (
                                    <div className="rounded-lg bg-background p-3">
                                      <p className="text-sm">{existingSchedule.notes}</p>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 border-t pt-4">
                                    <Switch
                                      checked={existingSchedule.is_available}
                                      onCheckedChange={handleToggleAvailability}
                                    />
                                    <Label>Program Aktif</Label>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>Başlangıç Saati</Label>
                                      <Select value={startTime} onValueChange={setStartTime}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Saat seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {TIME_SLOTS.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Bitiş Saati</Label>
                                      <Select value={endTime} onValueChange={setEndTime}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Saat seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {TIME_SLOTS.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Not (Opsiyonel)</Label>
                                    <Textarea
                                      placeholder="Örn: Ameliyat listesi var, Öğle arası 12:00-13:00"
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      rows={2}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button onClick={handleUpdateSchedule} disabled={isLoading} className="flex-1">
                                      <Save className="mr-2 h-4 w-4" />
                                      {isLoading ? "Kaydediliyor..." : "Kaydet"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditMode(false)
                                        setError(null)
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-center py-4">
                                <Plus className="mx-auto mb-2 h-12 w-12 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground mb-4">Bu tarih için program belirlenmemiş</p>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Başlangıç Saati</Label>
                                  <Select value={startTime} onValueChange={setStartTime}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Saat seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIME_SLOTS.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Bitiş Saati</Label>
                                  <Select value={endTime} onValueChange={setEndTime}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Saat seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIME_SLOTS.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Not (Opsiyonel)</Label>
                                <Textarea
                                  placeholder="Örn: Ameliyat listesi var, Öğle arası 12:00-13:00"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  rows={2}
                                />
                              </div>

                              <Button onClick={handleAddSchedule} disabled={isLoading} className="w-full">
                                {isLoading ? "Ekleniyor..." : "Program Oluştur"}
                              </Button>
                            </div>
                          )}

                          {error && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation AlertDialog */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          {alertType === "generate" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg">Program Oluştur?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{MONTHS[selectedMonth].label} {selectedYear}</strong> icin tum is gunlerine ({monthWeekdays.length} gun) program olusturulacak. Bu islem mevcut programlari uzerine yazacaktir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={confirmGenerateMonth} className="bg-blue-600 hover:bg-blue-700">
                  Oluştur
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}

          {alertType === "reset" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg text-orange-600">Programlari Sifirla?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{MONTHS[selectedMonth].label} {selectedYear}</strong> ayindaki TUM programlar ve buna bagli randevular silinip, sadece hafta sonu haric is gunleri icin yeniden olusturulacak. Bu islem geri alinamaz!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={confirmResetMonth} className="bg-orange-600 hover:bg-orange-700">
                  Sıfırla
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}

          {alertType === "delete" && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg text-red-600">TUM Programlari Sil?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{MONTHS[selectedMonth].label} {selectedYear}</strong> ayindaki TUM programlar ve bagli randevular silinecek. <strong className="text-red-700">Bu islem geri alinamaz!</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal Et</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteMonth} className="bg-red-600 hover:bg-red-700">
                  Tümünü Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
