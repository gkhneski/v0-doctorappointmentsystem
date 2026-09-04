"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarPlus } from "lucide-react"
import { useRouter } from "next/navigation"

const APPOINTMENT_TYPES = [
  { value: "ilk-muayene", label: "İlk Muayene" },
  { value: "kontrol-takip", label: "Kontrol / Takip" },
  { value: "gebelik-istemi-infertilite", label: "Gebelik İstemi / İnfertilite" },
  { value: "jinekolojik-muayene", label: "Jinekolojik Muayene" },
  { value: "ayrintili-fetal-ultrason", label: "Ayrıntılı Fetal Ultrason" },
  { value: "diger", label: "Diğer" },
]

export function QuickBlockAppointment() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [appointmentType, setAppointmentType] = useState("kontrol-takip")
  const [notes, setNotes] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName || !appointmentDate || !appointmentTime) {
      alert("Lütfen tüm alanları doldurun")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/quick-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          appointment_type: appointmentType,
          notes: notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Randevu bloke edilemedi")
      }

      alert("Randevu başarıyla bloke edildi!")
      setOpen(false)
      setFullName("")
      setAppointmentDate("")
      setAppointmentTime("")
      setAppointmentType("kontrol-takip")
      setNotes("")
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          Hızlı Ajanda Bloke
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Hızlı Ajanda Bloke</DialogTitle>
            <DialogDescription>
              Sadece isim ve randevu saatini girin. Diğer bilgiler hasta gelince tamamlanabilir.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Hasta Adı Soyadı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Örn: Ahmet Yılmaz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt-type">Randevu Tipi</Label>
              <Select value={appointmentType} onValueChange={setAppointmentType}>
                <SelectTrigger id="appt-type">
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  Tarih <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">
                  Saat <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  step="900"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Not (Opsiyonel)</Label>
              <Textarea
                id="notes"
                placeholder="Örn: Ameliyat sonrası kontrol, Dr. referansı ile..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Bloke Ediliyor..." : "Bloke Et"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
