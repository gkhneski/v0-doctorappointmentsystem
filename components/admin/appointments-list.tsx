"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Trash2, Edit, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// Hooks
import { useAppointmentActions } from "@/components/admin/appointments/hooks/use-appointment-actions"
import { usePatientVerification } from "@/components/admin/appointments/hooks/use-patient-verification"
import type { Appointment } from "@/components/admin/appointments/hooks/use-appointment-actions"

// Dialogs
import { DeleteDialog } from "@/components/admin/appointments/dialogs/delete-dialog"
import { SmsDialog } from "@/components/admin/appointments/dialogs/sms-dialog"
import { PatientDialog } from "@/components/admin/appointments/dialogs/patient-dialog"
import { EditDialog } from "@/components/admin/appointments/dialogs/edit-dialog"

// Components
const DetailPanel = lazy(() => import("./appointment-detail-panel").then(m => ({ default: m.AppointmentDetailPanel })))

const APPOINTMENT_TYPES: Record<string, { label: string; color: string }> = {
  "ilk-muayene": { label: "İlk Muayene", color: "bg-blue-100 text-blue-800" },
  "kontrol-takip": { label: "Kontrol / Takip", color: "bg-green-100 text-green-800" },
  "gebelik-istemi-infertilite": { label: "Gebelik İstemi", color: "bg-purple-100 text-purple-800" },
  "jinekolojik-muayene": { label: "Jinekolojik Muayene", color: "bg-pink-100 text-pink-800" },
  "ayrintili-fetal-ultrason": { label: "Ayrıntılı Fetal Ultrason", color: "bg-indigo-100 text-indigo-800" },
  "gebelik-takibi": { label: "Gebelik Takibi", color: "bg-teal-100 text-teal-800" },
  "asilik-tup-bebek": { label: "Aşılama / Tüp Bebek", color: "bg-rose-100 text-rose-800" },
  diger: { label: "Diğer", color: "bg-gray-100 text-gray-800" },
}

type Props = {
  appointments: Appointment[]
}

export default function AppointmentsList({ appointments: initialAppointments }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Appointment actions hook
  const { isUpdating, deleteId, setDeleteId, handleDelete } = useAppointmentActions(setAppointments, setSelectedAppointment)

  // Patient verification hook
  const {
    verificationStep,
    setVerificationStep,
    verificationCode,
    setVerificationCode,
    verifyingCode,
    completingInfo,
    sendVerificationCode: sendVerificationCodeFn,
    verifyCode: verifyCodeFn,
  } = usePatientVerification(setAppointments, setSelectedAppointment)

  // SMS dialog state
  const [smsDialogOpen, setSmsDialogOpen] = useState(false)
  const [smsPhone, setSmsPhone] = useState("")
  const [smsMessage, setSmsMessage] = useState("")
  const [smsSending, setSmsSending] = useState(false)

  // Patient dialog state
  const [patientDialogOpen, setPatientDialogOpen] = useState(false)
  const [completeFormData, setCompleteFormData] = useState({ tc_no: "", phone: "", date_of_birth: "" })

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Filters
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("")
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState<string>("all")

  // Supabase realtime subscription — appointments tablosu degisince listeyi ve secili randevuyu guncelle
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        async (payload) => {
          if (payload.eventType === "UPDATE") {
            // Degisen randevuyu Supabase'den tam veriyle tekrar cek (patient bilgisi dahil)
            const { data: fresh } = await supabase
              .from("appointments")
              .select(`
                *,
                patients (id, full_name, phone, tc_no, date_of_birth, email),
                doctors (id, full_name)
              `)
              .eq("id", payload.new.id)
              .single()

            if (fresh) {
              setAppointments(prev =>
                prev.map(a => a.id === fresh.id ? { ...a, ...fresh } : a)
              )
              // Eger bu secili randevuysa onu da guncelle
              setSelectedAppointment(prev =>
                prev?.id === fresh.id ? { ...prev, ...fresh } : prev
              )
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Sync selectedAppointment with appointments list
  useEffect(() => {
    if (selectedAppointment) {
      const updated = appointments.find(a => a.id === selectedAppointment.id)
      if (updated) {
        setSelectedAppointment(prev =>
          prev && JSON.stringify(prev) !== JSON.stringify(updated) ? updated : prev
        )
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments])

  // Filtered appointments - tarih, tur ve arama filtresi
  const filteredAppointments = appointments.filter((a) => {
    const matchesDate = !selectedDateFilter || a.appointment_date === selectedDateFilter
    const matchesType = appointmentTypeFilter === "all" || a.appointment_type === appointmentTypeFilter
    
    // Search filter - hasta adi, telefon, TC ile arama
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query || 
      a.patients?.full_name?.toLowerCase().includes(query) ||
      a.patients?.phone?.includes(query) ||
      a.patients?.tc_no?.toLowerCase().includes(query) ||
      a.notes?.toLowerCase().includes(query)
    
    return matchesDate && matchesType && matchesSearch
  })

  // SMS gönder
  const sendSms = async () => {
    if (!smsPhone || !smsMessage) return
    setSmsSending(true)
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: smsPhone, message: smsMessage }),
      })
      if (response.ok) {
        setSmsDialogOpen(false)
        setSmsMessage("")
        toast({ title: "SMS Gönderildi", description: "Mesaj başarıyla gönderildi" })
      } else {
        toast({ title: "Hata", description: "SMS gönderilemedi", variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "SMS gönderilemedi", variant: "destructive" })
    } finally {
      setSmsSending(false)
    }
  }

  // Send verification code wrapper
  const sendVerificationCode = async () => {
    if (!selectedAppointment) return
    await sendVerificationCodeFn(selectedAppointment, completeFormData)
  }

  // Verify code wrapper
  const verifyCode = async () => {
    if (!selectedAppointment) return
    await verifyCodeFn(selectedAppointment, verificationCode, completeFormData, appointments)
  }

  const handlePrint = () => {
    // Sadece liste tablosunu yazdır
    const shortTypeNames: Record<string, string> = {
      "asilama-tup-bebek": "IVF kontrol",
      "ayrintili-fetal-ultrason": "det kontrol",
      "gebelik-takibi": "gebe kontrol",
      "gebelik-istemi-infertilite": "gebelik istemi",
      "jinekolojik-muayene": "G.M",
      "kontrol-takip": "kontrol",
      "acil-durum": "acil",
      "iui-kontrol": "IUI kontrol",
      "op-sonrasi-kontrol": "op sonrasi kontrol",
      "serklaj-sonrasi-kontrol": "serklaj sonrasi kontrol",
      "dty": "DTY",
      "mens": "mens",
      "gebe-muayene": "gebe muayene",
    }

    const getShortTypeName = (appointment: Appointment): string => {
      if (appointment.print_type) return appointment.print_type
      if (!appointment.appointment_type) return "-"
      return shortTypeNames[appointment.appointment_type] || appointment.appointment_type.replace(/-/g, " ")
    }

    const dateLabel = selectedDateFilter
      ? " - " + new Date(selectedDateFilter).toLocaleDateString("tr-TR")
      : ""

    const rows = filteredAppointments
      .map((a, index) => {
        const no = index + 1
        const time = a.appointment_time || "-"
        const name = a.patients?.full_name || "-"
        // Yazdırma tipi seçildiyse onu göster, seçilmediyse direkt appointment_type göster (kısaltma yok)
        const type = (a.print_type && a.print_type !== "") ? a.print_type : (a.appointment_type || "-")
        const paymentDisplay = a.payment_status === "paid" && a.payment_amount 
          ? a.payment_amount + " TL" 
          : "Kontrol"
        // Admin tarafından oluşturulan randevularda (TEMP_ ile başlayan TC) notları göster
        // Hastanın kendisi aldıysa not kısmı boş kalır (elle yazılacak)
        const isAdminCreated = a.patients?.tc_no?.startsWith("TEMP_")
        const notes = isAdminCreated && a.notes ? a.notes : ""
        return `<tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; width: 30px;">${no}</td>
          <td style="border: 1px solid #ddd; padding: 8px; width: 70px;">${time}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${name}</td>
          <td style="border: 1px solid #ddd; padding: 8px; width: 100px;">${type}</td>
          <td style="border: 1px solid #ddd; padding: 8px; width: 70px;">${paymentDisplay}</td>
          <td style="border: 1px solid #ddd; padding: 8px; min-width: 200px;">${notes}</td>
        </tr>`
      })
      .join("")

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Randevu Listesi</title>
        <style>
          * { margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
            font-weight: 600;
          }
          .header p {
            font-size: 12px;
            color: #666;
            margin: 3px 0;
          }
          .count {
            font-size: 12px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            color: #333;
          }
          td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          @media print {
            body { padding: 10px; }
            .header { margin-bottom: 15px; }
            table { font-size: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Randevu Listesi${dateLabel}</h1>
          <p>Prof. Dr. Eray Çalışkan - Kadın Hastalıkları ve Doğum</p>
          <div class="count">Toplam: ${filteredAppointments.length} hasta</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 70px;">Saat</th>
              <th>Hasta</th>
              <th style="width: 100px;">Tür</th>
              <th style="width: 70px;">Ödeme</th>
              <th style="min-width: 200px;">Not</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `

    const printWindow = window.open("", "", "width=1200,height=800")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtreler */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Hasta ara (isim, telefon, TC, not)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Diger Filtreler */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tarih Filtrele</label>
              <Input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                placeholder="Tarih seçin"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tur Filtrele</label>
              <select className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value={appointmentTypeFilter} onChange={(e) => setAppointmentTypeFilter(e.target.value)}>
                <option value="all">Tumu</option>
                {Object.entries(APPOINTMENT_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <Button variant="outline" size="sm" onClick={handlePrint}>Yazdir</Button>
              <Button variant="outline" size="sm" onClick={() => {
                setSelectedDateFilter("")
                setAppointmentTypeFilter("all")
                setSearchQuery("")
              }}>Temizle</Button>
            </div>
          </div>
          
          {/* Sonuc sayisi */}
          <div className="text-sm text-muted-foreground">
            {searchQuery || selectedDateFilter || appointmentTypeFilter !== "all" 
              ? `${filteredAppointments.length} sonuc bulundu` 
              : `Toplam ${appointments.length} randevu`}
          </div>
        </div>
      </Card>

      {/* Randevular Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Taraf - Tablo */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Saat</TableHead>
                    <TableHead>Hasta</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow
                      key={appointment.id}
                      className={`transition-colors cursor-pointer ${
                        appointment.status === "cancelled"
                          ? "bg-red-50 opacity-60 line-through-cells"
                          : selectedAppointment?.id === appointment.id
                          ? "bg-primary/10 hover:bg-primary/15"
                          : appointment.is_intermediate
                          ? "bg-orange-100 hover:bg-orange-200 border-l-4 border-l-orange-500"
                          : "hover:bg-muted/30"
                      }`}
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <TableCell className="text-sm">
                        {new Date(appointment.appointment_date).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{appointment.appointment_time}</TableCell>
                      <TableCell className="text-sm">
                        {appointment.patients?.full_name || "-"}
                        {appointment.status === "cancelled" && (
                          <Badge className="ml-2 bg-red-500 text-white text-[10px] px-1">IPTAL</Badge>
                        )}
                        {appointment.is_intermediate && appointment.status !== "cancelled" && (
                          <Badge className="ml-2 bg-orange-500 text-white text-[10px] px-1">ARA</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col gap-0.5">
                          <Badge className={APPOINTMENT_TYPES[appointment.appointment_type || "diger"]?.color || "bg-gray-100"}>
                            {APPOINTMENT_TYPES[appointment.appointment_type || "diger"]?.label || "Diğer"}
                          </Badge>
                          {appointment.appointment_type === "ayrintili-fetal-ultrason" && appointment.fetal_bebek_sayisi && (
                            <span className="text-[11px] font-semibold text-orange-600">
                              {appointment.fetal_bebek_sayisi === "tek"
                                ? "Tek Bebek"
                                : appointment.fetal_bebek_sayisi === "ikiz"
                                ? "Ikiz Bebek"
                                : "Ucuz Bebek"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteId(appointment.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Sağ Taraf - Detail Panel */}
        <div className="lg:col-span-1">
          {selectedAppointment ? (
            <Suspense fallback={<div className="rounded-lg border border-gray-200 p-4 flex items-center justify-center h-96"><Spinner className="h-8 w-8" /></div>}>
              <DetailPanel
                appointment={selectedAppointment}
                onSmsClick={(phone) => {
                  setSmsPhone(phone)
                  setSmsDialogOpen(true)
                }}
                onPatientClick={() => setPatientDialogOpen(true)}
                onEditClick={() => setEditDialogOpen(true)}
                onUpdatePrintType={(id, type) => {
                  setAppointments(prev => prev.map(a => a.id === id ? { ...a, print_type: type } : a))
                  if (selectedAppointment?.id === id) {
                    setSelectedAppointment({ ...selectedAppointment, print_type: type })
                  }
                }}
                onUpdatePaymentStatus={(id, status) => {
                  setAppointments(prev => prev.map(a => a.id === id ? { ...a, payment_status: status } : a))
                  if (selectedAppointment?.id === id) {
                    setSelectedAppointment({ ...selectedAppointment, payment_status: status })
                  }
                }}
                onUpdatePaymentAmount={(id, amount) => {
                  setAppointments(prev => prev.map(a => a.id === id ? { ...a, payment_amount: amount } : a))
                  if (selectedAppointment?.id === id) {
                    setSelectedAppointment({ ...selectedAppointment, payment_amount: amount })
                  }
                }}
                onCancelAppointment={(id) => {
                  // Randevuyu listede "cancelled" olarak işaretle
                  setAppointments(prev => prev.map(a =>
                    a.id === id ? { ...a, status: "cancelled" } : a
                  ))
                  if (selectedAppointment?.id === id) {
                    setSelectedAppointment({ ...selectedAppointment, status: "cancelled" })
                  }
                }}
                onRescheduleAppointment={(id, newDate, newTime) => {
                  // Listede tarihi ve saati güncelle
                  setAppointments(prev => prev.map(a =>
                    a.id === id
                      ? { ...a, appointment_date: newDate, appointment_time: newTime }
                      : a
                  ))
                  if (selectedAppointment?.id === id) {
                    setSelectedAppointment({
                      ...selectedAppointment,
                      appointment_date: newDate,
                      appointment_time: newTime,
                    })
                  }
                }}
              />
            </Suspense>
          ) : (
            <div className="rounded-lg border border-dashed border-muted p-4 flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Detaylar görmek için sol taraftan randevu seçin</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deleteId={deleteId}
        isDeleting={isUpdating === deleteId}
        onConfirm={() => {
          if (deleteId) {
            handleDelete(deleteId, appointments)
            setDeleteDialogOpen(false)
          }
        }}
      />

      <SmsDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        phone={smsPhone}
        patientName={selectedAppointment?.patients?.full_name}
        message={smsMessage}
        onMessageChange={setSmsMessage}
        onSend={sendSms}
        isSending={smsSending}
        appointmentDate={selectedAppointment?.appointment_date}
        appointmentTime={selectedAppointment?.appointment_time}
      />

      <PatientDialog
        open={patientDialogOpen}
        onOpenChange={setPatientDialogOpen}
        selectedAppointment={selectedAppointment}
        verificationStep={verificationStep}
        onVerificationStepChange={setVerificationStep}
        completeFormData={completeFormData}
        onFormDataChange={setCompleteFormData}
        verificationCode={verificationCode}
        onVerificationCodeChange={setVerificationCode}
        completingInfo={completingInfo}
        verifyingCode={verifyingCode}
        onSendVerificationCode={sendVerificationCode}
        onVerifyCode={verifyCode}
      />

      <EditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        selectedAppointment={selectedAppointment}
        onAppointmentChange={setSelectedAppointment}
        onAppointmentsChange={setAppointments}
        allAppointments={appointments}
      />
    </div>
  )
}
