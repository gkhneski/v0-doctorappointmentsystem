"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Edit, ClipboardCheck, Calendar, Phone, FileText, Printer, AlertCircle, CheckCircle2, XCircle, Ban, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string | null
  notes: string | null
  appointment_type: string | null
  print_type?: string | null
  confirmation_status: string | null
  confirmed_at: string | null
  reminder_sent_at: string | null
  link_clicked_at: string | null
  created_at?: string | null
  is_intermediate?: boolean
  payment_status?: string | null
  payment_amount?: number | null
  status?: string | null
  patients?: {
    id: string
    full_name: string
    phone: string | null
    tc_no: string | null
    date_of_birth: string | null
    kvkk_approved: boolean | null
    kvkk_approved_at: string | null
    kvkk_approved_via: string | null
    medical_alerts: string | null
  } | null
  doctors?: {
    name: string
    specialization: string
  } | null
}

interface Props {
  appointment: Appointment
  onSmsClick: (phone: string) => void
  onPatientClick: () => void
  onEditClick: () => void
  onUpdatePrintType: (id: string, type: string | null) => void
  onUpdatePaymentStatus: (id: string, status: string) => void
  onUpdatePaymentAmount: (id: string, amount: number) => void
  onCancelAppointment?: (id: string) => void
  onRescheduleAppointment?: (id: string, newDate: string, newTime: string) => void
}

const APPOINTMENT_TYPES: Record<string, { label: string; color: string }> = {
  "asilama-tup-bebek": { label: "Aşılama / Tüp Bebek", color: "bg-blue-100" },
  "ayrintili-fetal-ultrason": { label: "Ayrıntılı Fetal Ultrason", color: "bg-purple-100" },
  "gebelik-takibi": { label: "Gebelik Takibi", color: "bg-pink-100" },
  "gebelik-istemi-infertilite": { label: "Gebelik İstemi / İnfertilite", color: "bg-red-100" },
  "jinekolojik-muayene": { label: "Jinekolojik Muayene", color: "bg-green-100" },
  "kontrol-takip": { label: "Kontrol / Takip", color: "bg-yellow-100" },
  "diger": { label: "Diğer", color: "bg-gray-100" },
}

export function AppointmentDetailPanel({
  appointment,
  onSmsClick,
  onPatientClick,
  onEditClick,
  onUpdatePrintType,
  onUpdatePaymentStatus,
  onUpdatePaymentAmount,
  onCancelAppointment,
  onRescheduleAppointment,
}: Props) {
  const { toast } = useToast()
  const supabase = createClient()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [newDate, setNewDate] = useState(appointment.appointment_date)
  const [newTime, setNewTime] = useState(appointment.appointment_time || "")
  const [isLoading, setIsLoading] = useState(false)
  const [liveData, setLiveData] = useState(appointment)
  const [paymentAmountInput, setPaymentAmountInput] = useState(appointment.payment_amount?.toString() || "")

  // Randevu secildiginde Supabase'den guncel veriyi cek ve payment input'u senkronize et
  useEffect(() => {
    setLiveData(appointment)
    setPaymentAmountInput(appointment.payment_amount?.toString() || "")

    const fetchFresh = async () => {
      const { data } = await supabase
        .from("appointments")
        .select(`*, patients (id, full_name, phone, tc_no, date_of_birth, email), doctors (id, full_name)`)
        .eq("id", appointment.id)
        .single()
      if (data) {
        setLiveData({ ...appointment, ...data })
        setPaymentAmountInput(data.payment_amount?.toString() || "")
      }
    }

    fetchFresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment.id])

  const handleCancelAppointment = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (!res.ok) throw new Error("Iptal edilemedi")
      toast({ title: "Randevu iptal edildi", description: "Randevu basariyla iptal edildi." })
      setCancelDialogOpen(false)
      onCancelAppointment?.(appointment.id)
    } catch {
      toast({ title: "Hata", description: "Randevu iptal edilemedi.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRescheduleAppointment = async () => {
    if (!newDate || !newTime) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_date: newDate, appointment_time: newTime }),
      })
      if (!res.ok) throw new Error("Degistirilemedi")
      toast({ title: "Randevu degistirildi", description: `Yeni tarih: ${new Date(newDate).toLocaleDateString("tr-TR")} - ${newTime}` })
      setRescheduleDialogOpen(false)
      onRescheduleAppointment?.(appointment.id, newDate, newTime)
    } catch {
      toast({ title: "Hata", description: "Randevu degistirilemedi.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePrintType = async (printType: string | null) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.from("appointments").update({ print_type: printType }).eq("id", appointment.id)
      if (error) throw error
      onUpdatePrintType(appointment.id, printType)
      toast({ title: "Başarılı", description: "Yazdırma tipi güncellendi" })
    } catch {
      toast({ title: "Hata", description: "Yazdırma tipi güncellenemedi", variant: "destructive" })
    }
  }

  const updatePaymentStatus = async (status: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.from("appointments").update({ payment_status: status }).eq("id", appointment.id)
      if (error) throw error
      onUpdatePaymentStatus(appointment.id, status)
      toast({ title: "Başarılı", description: "Ödeme durumu güncellendi" })
    } catch {
      toast({ title: "Hata", description: "Ödeme durumu güncellenemedi", variant: "destructive" })
    }
  }

  const setPaymentAmount = async (amount: number) => {
    const supabase = createClient()
    
    // Validasyon: Decimal(10,2) için maksimum değer 99,999,999.99
    if (isNaN(amount) || amount < 0 || amount >= 100000000) {
      toast({
        title: "Geçersiz Tutar",
        description: "Ödeme tutarı 0 ile 99,999,999.99 TL arasında olmalıdır.",
        variant: "destructive",
      })
      return
    }
    
    try {
      const { error } = await supabase.from("appointments").update({ payment_amount: amount }).eq("id", appointment.id)
      if (error) throw error
      onUpdatePaymentAmount(appointment.id, amount)
      toast({
        title: "Başarılı",
        description: `Ödeme tutarı ${amount.toFixed(2)} TL olarak güncellendi.`,
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödeme tutarı güncellenemedi.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4 sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground">Randevu Detayları</h3>
          {appointment.is_intermediate && <Badge className="bg-orange-500 text-white">Ara Randevu</Badge>}
        </div>

        {/* Hızlı Aksiyonlar */}
        <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            disabled={!appointment.patients?.phone}
            onClick={() => {
              const phone = appointment.patients?.phone
              if (phone) onSmsClick(phone)
            }}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            SMS
          </Button>

          <Button variant="outline" size="sm" className="text-xs h-8" onClick={onPatientClick}>
            <User className="h-3 w-3 mr-1" />
            Hasta
          </Button>

          <Button variant="outline" size="sm" className="text-xs h-8" onClick={onEditClick}>
            <Edit className="h-3 w-3 mr-1" />
            Düzenle
          </Button>

          {(appointment.patients?.tc_no?.startsWith("TEMP_") || appointment.is_intermediate) && (
            <Button variant="default" size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700" onClick={onPatientClick}>
              <ClipboardCheck className="h-3 w-3 mr-1" />
              Bilgileri Tamamla
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => {
              setNewDate(appointment.appointment_date)
              setNewTime(appointment.appointment_time || "")
              setRescheduleDialogOpen(true)
            }}
            disabled={appointment.status === "cancelled"}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Degistir
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => setCancelDialogOpen(true)}
            disabled={appointment.status === "cancelled"}
          >
            <Ban className="h-3 w-3 mr-1" />
            {appointment.status === "cancelled" ? "Iptal Edildi" : "Iptal Et"}
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          {/* Hasta adı */}
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Hasta</p>
              <p className="font-medium">{appointment.patients?.full_name || "—"}</p>
            </div>
          </div>

          {/* Tarih ve Saat */}
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tarih & Saat</p>
              <p className="font-medium">
                {new Date(appointment.appointment_date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} — {appointment.appointment_time}
              </p>
            </div>
          </div>

          {/* Telefon */}
          {appointment.patients?.phone && (
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="font-medium">{appointment.patients.phone}</p>
              </div>
            </div>
          )}

          {/* TC No */}
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">TC Kimlik No</p>
              <p className="font-medium">{appointment.patients?.tc_no || "Girilmedi"}</p>
            </div>
          </div>

          {/* Randevu Tipi */}
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Randevu Tipi</p>
              <Badge className={APPOINTMENT_TYPES[appointment.appointment_type || "diger"]?.color || "bg-gray-100"} variant="outline">
                {APPOINTMENT_TYPES[appointment.appointment_type || "diger"]?.label || "Diğer"}
              </Badge>
            </div>
          </div>

          {/* Yazdırma Tipi Dropdown */}
          <div className="flex items-start gap-2">
            <Printer className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Yazdırma Tipi</label>
              <select
                value={appointment.print_type || ""}
                onChange={(e) => handleUpdatePrintType(e.target.value || null)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Seç —</option>
                <option value="IVF kontrol">1. IVF kontrol</option>
                <option value="IUI kontrol">2. IUI kontrol</option>
                <option value="det kontrol">3. det kontrol</option>
                <option value="op sonrasi kontrol">4. op sonrası kontrol</option>
                <option value="serklaj sonrasi kontrol">5. serklaj sonrası kontrol</option>
                <option value="G.M">6. G.M</option>
                <option value="DTY">7. DTY</option>
                <option value="gebelik istemi">8. gebelik istemi</option>
                <option value="mens">9. mens</option>
                <option value="gebe kontrol">10. gebe kontrol</option>
                <option value="gebe muayene">11. gebe muayene</option>
              </select>
            </div>
          </div>

          {/* Ödeme Durumu */}
          <div className="flex items-start gap-2 pt-3 border-t">
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Ödeme Durumu</p>
              <div className="flex gap-2">
                <Button
                  variant={appointment.payment_status === "paid" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 flex-1"
                  onClick={() => updatePaymentStatus("paid")}
                >
                  Ödeme Var
                </Button>
                <Button
                  variant={appointment.payment_status !== "paid" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 flex-1"
                  onClick={() => {
                    updatePaymentStatus("unpaid")
                    setPaymentAmount(0)
                    setPaymentAmountInput("0")
                  }}
                >
                  Kontrol
                </Button>
              </div>

              {/* Ödeme Tutarı - Sadece ödeme varsa göster */}
              {appointment.payment_status === "paid" && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Ödeme Tutarı (TL)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Miktar girin"
                      value={paymentAmountInput}
                      onChange={(e) => setPaymentAmountInput(e.target.value)}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value) && value >= 0) {
                          setPaymentAmount(value)
                        } else {
                          // Geçersiz değer girildiyse eski değere döndür
                          setPaymentAmountInput(appointment.payment_amount?.toString() || "0")
                        }
                      }}
                      className="h-8 text-xs"
                      min="0"
                      max="99999999.99"
                      step="0.01"
                    />
                    <span className="text-xs font-medium flex items-center text-gray-600">TL</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Randevu Geçmişi Timeline — liveData ile gercek zamanli */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Randevu Geçmişi</p>
              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Canli</span>
            </div>
            
            <div className="space-y-3">
              {/* Randevu Alındı */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                  <div className="w-0.5 h-12 bg-gray-200 mt-1" />
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-xs font-semibold text-blue-600">Randevu Alındı</p>
                  <p className="text-xs text-muted-foreground">
                    {liveData.created_at 
                      ? new Date(liveData.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "—"
                    }
                  </p>
                </div>
              </div>

              {/* Hatırlatma SMS */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${liveData.reminder_sent_at ? "bg-green-500" : "bg-gray-300"}`} />
                  <div className="w-0.5 h-12 bg-gray-200 mt-1" />
                </div>
                <div className="flex-1 pb-2">
                  <p className={`text-xs font-semibold ${liveData.reminder_sent_at ? "text-green-600" : "text-gray-500"}`}>
                    Hatırlatma SMS
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {liveData.reminder_sent_at 
                      ? `Gönderildi: ${new Date(liveData.reminder_sent_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : "Gönderilmedi"
                    }
                  </p>
                </div>
              </div>

              {/* Onay Linki */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${liveData.link_clicked_at ? "bg-blue-500" : "bg-orange-400"}`} />
                  <div className="w-0.5 h-12 bg-gray-200 mt-1" />
                </div>
                <div className="flex-1 pb-2">
                  <p className={`text-xs font-semibold ${liveData.link_clicked_at ? "text-blue-600" : "text-orange-600"}`}>
                    Onay Linki
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {liveData.link_clicked_at 
                      ? `Hasta tıkladı: ${new Date(liveData.link_clicked_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : "Tıklanmadı"
                    }
                  </p>
                </div>
              </div>

              {/* Hasta Cevabı - Gelecek/Gelmeyecek */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    liveData.status === "attended" ? "bg-green-500" : 
                    liveData.status === "no_show" ? "bg-red-500" : 
                    liveData.status === "cancelled" ? "bg-red-400" :
                    "bg-gray-300"
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-semibold ${
                    liveData.status === "attended" ? "text-green-600" : 
                    liveData.status === "no_show" ? "text-red-600" :
                    liveData.status === "cancelled" ? "text-red-500" :
                    "text-gray-500"
                  }`}>
                    Hasta Cevabı
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {liveData.status === "attended" && "GELECEK"}
                    {liveData.status === "no_show" && "GELMEYECEK"}
                    {liveData.status === "confirmed" && "Cevap Bekleniyor"}
                    {liveData.status === "cancelled" && "Randevu İptal Edildi"}
                    {!["attended", "no_show", "confirmed", "cancelled"].includes(liveData.status || "") && "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Iptal Onay Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Randevuyu Iptal Et</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{appointment.patients?.full_name}</strong> adli hastanin{" "}
              <strong>
                {new Date(appointment.appointment_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} - {appointment.appointment_time}
              </strong>{" "}
              tarihli randevusu iptal edilecek. Bu islemi geri alamazsiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Vazgec</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointment}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Iptal ediliyor..." : "Evet, Iptal Et"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tarih Degistirme Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Randevu Tarihini Degistir</DialogTitle>
            <DialogDescription>
              {appointment.patients?.full_name} adli hastanin randevusunu yeni bir tarih ve saate tasiyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Yeni Tarih</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Yeni Saat</label>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)} disabled={isLoading}>
              Vazgec
            </Button>
            <Button onClick={handleRescheduleAppointment} disabled={isLoading || !newDate || !newTime}>
              {isLoading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
