"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

type Doctor = {
  id: string
  name: string
  specialization: string
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

const DAYS = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 7, label: "Pazar" },
]

const MONTHS = [
  { value: 1, label: "Ocak" },
  { value: 2, label: "Şubat" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Nisan" },
  { value: 5, label: "Mayıs" },
  { value: 6, label: "Haziran" },
  { value: 7, label: "Temmuz" },
  { value: 8, label: "Ağustos" },
  { value: 9, label: "Eylül" },
  { value: 10, label: "Ekim" },
  { value: 11, label: "Kasım" },
  { value: 12, label: "Aralık" },
]

export default function WeeklyPatternManager({ doctors }: { doctors: Doctor[] }) {
  const today = new Date()
  const [selectedDoctor, setSelectedDoctor] = useState<string>(doctors[0]?.id || "")
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [weeklyPatterns, setWeeklyPatterns] = useState<WeeklyPattern[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const router = useRouter()
  const years = [2026, 2027, 2028, 2029]

  // Doktor için pattern'i yükle
  useEffect(() => {
    if (!selectedDoctor) return

    const loadPatterns = async () => {
      setIsLoading(true)
      try {
        console.log("[v0] Loading patterns for doctor:", selectedDoctor)
        const res = await fetch(`/api/weekly-patterns?doctor_id=${selectedDoctor}`)
        const data = await res.json()
        console.log("[v0] API response data:", data)

        if (Array.isArray(data) && data.length > 0) {
          console.log("[v0] Setting patterns from API:", data)
          setWeeklyPatterns(data)
        } else {
          // Varsayılan pattern oluştur (Mon-Fri çalış, Sat-Sun kapalı)
          console.log("[v0] Creating default patterns")
          // Pzt=1,Çar=3,Cum=5 → 11:30-18:00 | Sal=2,Per=4 → 13:00-18:00
          const defaults = DAYS.map((day) => ({
            id: `default-${day.value}`,
            doctor_id: selectedDoctor,
            day_of_week: day.value,
            is_working: day.value <= 5,
            start_time: [2, 4].includes(day.value) ? "13:00" : "11:30",
            end_time: "18:00",
            slot_duration: 15,
            notes: null,
          }))
          console.log("[v0] Default patterns created:", defaults)
          setWeeklyPatterns(defaults)
        }
      } catch (err) {
        console.error("[v0] Load patterns error:", err)
        setMessage({ type: "error", text: "Pattern yüklenemedi" })
      } finally {
        setIsLoading(false)
      }
    }

    loadPatterns()
  }, [selectedDoctor])

  // Pattern güncelle
  const updatePattern = (dayOfWeek: number, field: string, value: any) => {
    setWeeklyPatterns((prev) =>
      prev.map((p) => (p.day_of_week === dayOfWeek ? { ...p, [field]: value } : p)),
    )
  }

  // Pattern'i kaydet
  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/weekly-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedDoctor,
          patterns: weeklyPatterns,
        }),
      })

      if (!res.ok) throw new Error("Kaydedilemedi")

      setMessage({ type: "success", text: "Haftalık desen başarıyla kaydedildi!" })
    } catch (err) {
      console.error("[v0] Save error:", err)
      setMessage({ type: "error", text: "Hata oluştu" })
    } finally {
      setIsSaving(false)
    }
  }

  // Ayı pattern'e göre doldur
  const handleApplyMonth = async () => {
    if (
      !confirm(
        `${MONTHS.find((m) => m.value === selectedMonth)?.label} ${selectedYear} ayındaki iş günlerine desen uygulanacak. Devam edilsin mi?`,
      )
    ) {
      return
    }

    setIsApplying(true)
    setMessage(null)

    try {
      const res = await fetch("/api/weekly-patterns/apply-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedDoctor,
          year: selectedYear,
          month: selectedMonth,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Uygulanamadı")

      setMessage({ type: "success", text: `${data.created} programa desen uygulandı!` })
      router.refresh()
    } catch (err) {
      console.error("[v0] Apply error:", err)
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Hata oluştu" })
    } finally {
      setIsApplying(false)
    }
  }

  if (!selectedDoctor || isLoading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Haftalık Çalışma Deseni</CardTitle>
          <CardDescription>
            Haftanın her günü için çalışma saatlerini belirleyin. Ardından ayları otomatik dolduracak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Doktor seçimi */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Doktor</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Deseni Kaydet"}
            </Button>
          </div>

          {/* Weekly Pattern tablosu */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-4 font-semibold">Çalışma Saatleri</div>
            <div className="divide-y">
              {weeklyPatterns.map((pattern) => {
                const day = DAYS.find((d) => d.value === pattern.day_of_week)
                return (
                  <div key={pattern.day_of_week} className="p-4 flex items-center gap-4">
                    <div className="w-28 font-medium">{day?.label}</div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={pattern.is_working}
                        onCheckedChange={(checked) => updatePattern(pattern.day_of_week, "is_working", checked)}
                      />
                      <span className="text-sm text-muted-foreground">{pattern.is_working ? "Çalış" : "Kapalı"}</span>
                    </div>

                    {pattern.is_working && (
                      <>
                        <Input
                          type="time"
                          value={pattern.start_time}
                          onChange={(e) => updatePattern(pattern.day_of_week, "start_time", e.target.value)}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={pattern.end_time}
                          onChange={(e) => updatePattern(pattern.day_of_week, "end_time", e.target.value)}
                          className="w-24"
                        />
                        <Select
                          value={pattern.slot_duration.toString()}
                          onValueChange={(val) => updatePattern(pattern.day_of_week, "slot_duration", Number.parseInt(val))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 dk</SelectItem>
                            <SelectItem value="30">30 dk</SelectItem>
                            <SelectItem value="45">45 dk</SelectItem>
                            <SelectItem value="60">60 dk</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ay seçimi ve uygula */}
          <div className="border-t pt-6 space-y-4">
            <div className="font-semibold">Deseni Aya Uygula</div>
            <div className="flex gap-4 items-end">
              <div className="w-40">
                <Label>Ay</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}>
                  <SelectTrigger>
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
              </div>

              <div className="w-28">
                <Label>Yıl</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
                  <SelectTrigger>
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

              <Button onClick={handleApplyMonth} disabled={isApplying} className="bg-blue-600 hover:bg-blue-700">
                {isApplying ? "Uygulanıyor..." : "Bu Ayı Doldur"}
              </Button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
