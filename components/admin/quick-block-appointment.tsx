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
import { CalendarPlus, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const APPOINTMENT_TYPES = [
  { value: "ilk-muayene", label: "İlk Muayene" },
  { value: "kontrol-takip", label: "Kontrol / Takip" },
  { value: "gebelik-istemi-infertilite", label: "Gebelik İstemi / İnfertilite" },
  { value: "jinekolojik-muayene", label: "Jinekolojik Muayene" },
  { value: "ayrintili-fetal-ultrason", label: "Ayrıntılı Fetal Ultrason" },
  { value: "diger", label: "Diğer" },
]

const PRINT_TYPES = [
  { value: "none", label: "— Seç (opsiyonel) —" },
  { value: "IVF kontrol", label: "1. IVF kontrol" },
  { value: "IUI kontrol", label: "2. IUI kontrol" },
  { value: "det kontrol", label: "3. det kontrol" },
  { value: "op sonrasi kontrol", label: "4. op sonrası kontrol" },
  { value: "serklaj sonrasi kontrol", label: "5. serklaj sonrası kontrol" },
  { value: "G.M", label: "6. G.M" },
  { value: "DTY", label: "7. DTY" },
  { value: "gebelik istemi", label: "8. gebelik istemi" },
  { value: "mens", label: "9. mens" },
  { value: "gebe kontrol", label: "10. gebe kontrol" },
  { value: "gebe muayene", label: "11. gebe muayene" },
  { value: "OHSS kontrol", label: "12. OHSS kontrol" },
  { value: "Kese kontrol", label: "13. Kese kontrol" },
  { value: "C/S sonrasi kontrol", label: "14. C/S sonrası kontrol" },
  { value: "Kist kontrol", label: "15. Kist kontrol" },
  { value: "Akinti kontrol", label: "16. Akıntı kontrol" },
]

// Saat seçenekleri (08:00 - 19:00)
const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = (8 + i).toString().padStart(2, "0")
  return { value: h, label: h }
})

// Dakika seçenekleri — normal (00, 15, 30, 45) + ara (05, 10, 20, 25, 35, 40, 50, 55)
const MINUTES = [
  { value: "00", label: "00", isIntermediate: false },
  { value: "05", label: "05 (ara)", isIntermediate: true },
  { value: "10", label: "10 (ara)", isIntermediate: true },
  { value: "15", label: "15", isIntermediate: false },
  { value: "20", label: "20 (ara)", isIntermediate: true },
  { value: "25", label: "25 (ara)", isIntermediate: true },
  { value: "30", label: "30", isIntermediate: false },
  { value: "35", label: "35 (ara)", isIntermediate: true },
  { value: "40", label: "40 (ara)", isIntermediate: true },
  { value: "45", label: "45", isIntermediate: false },
  { value: "50", label: "50 (ara)", isIntermediate: true },
  { value: "55", label: "55 (ara)", isIntermediate: true },
]

export function QuickBlockAppointment() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [selectedHour, setSelectedHour] = useState("")
  const [selectedMinute, setSelectedMinute] = useState("")
  const [appointmentType, setAppointmentType] = useState("kontrol-takip")
  const [printType, setPrintType] = useState("")
  const [notes, setNotes] = useState("")
  const [isIntermediateSlot, setIsIntermediateSlot] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  // Dakika seçildiğinde ara slot mu kontrol et
  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute)
    const found = MINUTES.find((m) => m.value === minute)
    setIsIntermediateSlot(found?.isIntermediate || false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName || !appointmentDate || !selectedHour || !selectedMinute) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive",
      })
      return
    }

    const appointmentTime = `${selectedHour}:${selectedMinute}`
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
          print_type: (printType && printType !== "none") ? printType : null,
          notes: notes,
          is_intermediate: isIntermediateSlot,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Randevu bloke edilemedi")
      }

      // Başarılı - modalı kapat ve formu temizle
      setOpen(false)
      setFullName("")
      setAppointmentDate("")
      setSelectedHour("")
      setSelectedMinute("")
      setIsIntermediateSlot(false)
      setAppointmentType("kontrol-takip")
      setPrintType("")
      setNotes("")
      
      // Toast mesajı göster
      toast({
        title: "Randevu Eklendi",
        description: `${fullName} - ${appointmentDate} ${appointmentTime}`,
      })
      
      // Sayfayı yenile
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Bir hata oluştu",
        variant: "destructive",
      })
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
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="print-type">Yazdırma Tipi</Label>
                <Select value={printType} onValueChange={setPrintType}>
                  <SelectTrigger id="print-type">
                    <SelectValue placeholder="— Seç —" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRINT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Saat <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger>
                    <SelectValue placeholder="Saat" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Dakika <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedMinute} onValueChange={handleMinuteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dakika" />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem 
                        key={m.value} 
                        value={m.value}
                        className={m.isIntermediate ? "text-orange-600 font-medium" : ""}
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isIntermediateSlot && (
              <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
                <p className="text-xs text-orange-700">
                  <strong>Ara slot:</strong> Bu randevu hastalara görünmeyecek, sadece admin panelinde görünecektir.
                </p>
              </div>
            )}
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
