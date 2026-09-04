"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, User, Phone, Check, X, ExternalLink, FileText, Trash2, Pencil, Printer } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import DocumentStatusBadge from "@/components/admin/document-status-badge"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

type MedicalAlert = {
  type: string
  severity: "low" | "moderate" | "high" | "critical"
  notes?: string
}

type Appointment = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  confirmation_status?: string | null
  notes: string | null
  appointment_type: string | null
  doctors: {
    name: string
    specialization: string
    email: string
  } | null
  patients: {
    id: string
    full_name: string
    phone: string
    tc_no: string
    date_of_birth: string | null
    kvkk_approved?: boolean
    kvkk_approved_at?: string | null
    kvkk_approved_via?: string | null
    medical_alerts?: MedicalAlert[]
  } | null
}

export default function AppointmentsList({ appointments }: { appointments: Appointment[] }) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editTcNo, setEditTcNo] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editBirthDate, setEditBirthDate] = useState("")
  const [editAppointmentType, setEditAppointmentType] = useState("")
  const [editFullName, setEditFullName] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Get unique appointment types for filter - memoized to avoid re-render loop
  const appointmentTypes = useMemo(
    () => Array.from(new Set(appointments.map((a) => a.appointment_type).filter(Boolean))),
    [appointments]
  )

  const getAppointmentTypeLabel = (type: string | null) => {
    if (!type) return "Belirtilmemiş"
    
    // Map slug to display label
    const typeMap: Record<string, string> = {
      "asilama-tup-bebek": "Aşılama / Tüp Bebek",
      "gebelik-takibi": "Gebelik Takibi",
      "gebelik-istemi-infertilite": "Gebelik İstemi / İnfertilite",
      "jinekolojik-muayene": "Jinekolojik Muayene",
      "kontrol-takip": "Kontrol / Takip",
      "ayrintili-fetal-ultrason": "Ayrıntılı Fetal Ultrason",
    }
    
    return typeMap[type] || type
  }

  const getAppointmentTypeColor = (type: string | null) => {
    if (!type) return "bg-gray-100 text-gray-800"
    
    // Color coding based on appointment type
    if (type.includes("Tüp Bebek") || type.includes("Aşılama")) return "bg-purple-100 text-purple-800"
    if (type.includes("Gebelik")) return "bg-pink-100 text-pink-800"
    if (type.includes("Ultrason") || type.includes("Fetal")) return "bg-blue-100 text-blue-800"
    if (type.includes("Muayene") || type.includes("Jinekolojik")) return "bg-teal-100 text-teal-800"
    if (type.includes("Kontrol") || type.includes("Takip")) return "bg-green-100 text-green-800"
    if (type.includes("Acil")) return "bg-red-100 text-red-800"
    return "bg-indigo-100 text-indigo-800"
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const typeMatch =
        appointmentTypeFilter === "all" || appointment.appointment_type === appointmentTypeFilter
      const dateMatch =
        !selectedDateFilter || appointment.appointment_date === selectedDateFilter
      return typeMatch && dateMatch
    })
  }, [appointments, appointmentTypeFilter, selectedDateFilter])

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    setIsUpdating(appointmentId)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", appointmentId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Randevu güncellenirken hata:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleEditClick = (appointment: Appointment) => {
  setAppointmentToEdit(appointment)
  setEditDate(appointment.appointment_date)
  setEditTime(appointment.appointment_time)
  setEditTcNo(appointment.patients?.tc_no?.startsWith("TEMP_") ? "" : appointment.patients?.tc_no || "")
  setEditPhone(appointment.patients?.phone === "0000000000" ? "" : appointment.patients?.phone || "")
  const dob = appointment.patients?.date_of_birth
  setEditBirthDate(dob && dob !== "1900-01-01" ? dob : "")
  setEditAppointmentType(appointment.appointment_type || "kontrol-takip")
  setEditFullName(appointment.patients?.full_name || "")
  setEditNotes(appointment.notes || "")
  setEditDialogOpen(true)
  }

  const handleEditConfirm = async () => {
    if (!appointmentToEdit) return

    setIsEditing(true)

    try {
      // Hasta bilgilerini güncelle (TC veya telefon değiştiyse)
      const nameChanged = editFullName && editFullName !== appointmentToEdit.patients?.full_name
      const patientNeedsUpdate = editTcNo || editPhone || editBirthDate || nameChanged
      if (patientNeedsUpdate && appointmentToEdit.patients) {
        const patientUpdate: any = {}
        if (editTcNo) patientUpdate.tc_no = editTcNo
        if (editPhone) patientUpdate.phone = editPhone
        if (editBirthDate) patientUpdate.date_of_birth = editBirthDate
        if (nameChanged) patientUpdate.full_name = editFullName

        await fetch(`/api/patients/${appointmentToEdit.patients?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patientUpdate),
        })
      }

      // Randevu tarih/saat güncelle
      const response = await fetch(`/api/appointments/${appointmentToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
  appointment_date: editDate,
  appointment_time: editTime,
  appointment_type: editAppointmentType,
  notes: editNotes,
  }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Sunucu hatasi")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Randevu guncellenemedi")
      }

      router.refresh()
      setEditDialogOpen(false)
      setAppointmentToEdit(null)
      const hadPatientUpdate = !!(editTcNo || editPhone || editBirthDate)
      toast({
        title: "Kaydedildi",
        description: hadPatientUpdate
          ? "Hasta bilgileri ve randevu guncellendi."
          : "Randevu guncellendi.",
      })
    } catch (error) {
      console.error("[v0] Randevu guncellenirken hata:", error)
      toast({ title: "Hata", description: "Randevu guncellenirken bir hata olustu.", variant: "destructive" })
    } finally {
      setIsEditing(false)
    }
  }

 const handleDeleteClick = (appointment: Appointment) => {
  setAppointmentToDelete(appointment)
  setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/appointments/${appointmentToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Randevu silinemedi")
      }

      router.refresh()
      setDeleteDialogOpen(false)
      setAppointmentToDelete(null)
    } catch (error) {
      console.error("[v0] Randevu silinirken hata:", error)
      alert("Randevu silinirken bir hata oluştu")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      confirmed: "Onaylandı",
      pending: "Beklemede",
      cancelled: "İptal Edildi",
      completed: "Tamamlandı",
    }
    return statusMap[status] || status
  }

  const handleDocumentClick = (appointmentId: string) => {
    router.push(`/admin/appointments/${appointmentId}`)
  }

  const handlePrint = () => {
    const filteredAppts = selectedDateFilter
      ? appointments.filter((a) => a.appointment_date === selectedDateFilter)
      : appointments

    const dateLabel = selectedDateFilter
      ? " - " + new Date(selectedDateFilter).toLocaleDateString("tr-TR")
      : ""

    const rows = filteredAppts
      .map((a) => {
        const time = a.appointment_time || "-"
        const name = a.patients?.full_name || "-"
        const type = (a.appointment_type || "-").replace(/-/g, " ")
        return "<tr><td>" + time + "</td><td>" + name + "</td><td>" + type + "</td></tr>"
      })
      .join("")

    const noteLines = Array.from({ length: 6 })
      .map(() => "<tr><td style='height:28px;border:1px solid #ccc;padding:4px 8px;'>&nbsp;</td></tr>")
      .join("")

    const printContent =
      "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Randevu Listesi</title>" +
      "<style>body{font-family:Arial,sans-serif;margin:20px}" +
      "h1{text-align:center;margin-bottom:4px;font-size:18px}" +
      "p.subtitle{text-align:center;color:#666;margin-bottom:16px;font-size:13px}" +
      "table{width:100%;border-collapse:collapse;margin-bottom:32px}" +
      "th,td{border:1px solid #ddd;padding:10px 12px;text-align:left;font-size:13px}" +
      "th{background-color:#f2f2f2;font-weight:bold}" +
      "tr:nth-child(even){background-color:#f9f9f9}" +
      "h2{font-size:14px;margin-bottom:8px;margin-top:0}" +
      ".notes-table td{height:28px}" +
      "@media print{button{display:none}}" +
      "</style></head><body>" +
      "<h1>Randevu Listesi" + dateLabel + "</h1>" +
      "<p class='subtitle'>Prof. Dr. Eray Calıskan - Kadin Hastaliklari ve Dogum</p>" +
      "<table><thead><tr><th>Saat</th><th>Isim Soyisim</th><th>Randevu Tipi</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table>" +
      "<h2>Notlar</h2>" +
      "<table class='notes-table'><tbody>" + noteLines + "</tbody></table>" +
      "</body></html>"

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="mb-4 h-12 w-12" />
        <p>Randevu bulunamadı</p>
      </div>
    )
  }

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Randevuyu Sil</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Bu randevuyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                {appointmentToDelete && (
                  <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="font-semibold text-sm">Randevu Detayları:</div>
                    <div className="text-sm">
                      <strong>Hasta:</strong> {appointmentToDelete.patients?.full_name}
                    </div>
                    <div className="text-sm">
                      <strong>Tarih:</strong>{" "}
                      {new Date(appointmentToDelete.appointment_date).toLocaleDateString("tr-TR")}
                    </div>
                    <div className="text-sm">
                      <strong>Saat:</strong> {appointmentToDelete.appointment_time}
                    </div>
                    <div className="text-sm">
                      <strong>Doktor:</strong> {appointmentToDelete.doctors?.name}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={appointmentTypeFilter} onValueChange={setAppointmentTypeFilter}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue placeholder="Tüm Randevular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Randevular</SelectItem>
            {appointmentTypes.map((type) => (
              <SelectItem key={type} value={type || ""}>
                {getAppointmentTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="w-40 h-9 text-sm"
          />
          {selectedDateFilter && (
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground shrink-0" onClick={() => setSelectedDateFilter("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button variant="outline" size="sm" className="h-9 gap-2 ml-auto" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Yazdır
        </Button>
      </div>

      <div className="rounded-lg border overflow-x-auto bg-card">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[130px] font-semibold text-xs uppercase tracking-wide">Tarih & Saat</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Hasta</TableHead>
              <TableHead className="w-[200px] font-semibold text-xs uppercase tracking-wide">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-muted/30 transition-colors">
                {/* Tarih & Saat sütunu */}
                <TableCell className="align-top py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(appointment.appointment_date).toLocaleDateString("tr-TR")}
                    </span>
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {appointment.appointment_time}
                    </span>
                    <Badge className={`mt-1 w-fit text-xs ${getAppointmentTypeColor(appointment.appointment_type)}`} variant="outline">
                      {getAppointmentTypeLabel(appointment.appointment_type)}
                    </Badge>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant={
                          appointment.confirmation_status === "confirmed"
                            ? "default"
                            : appointment.confirmation_status === "declined"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {appointment.confirmation_status === "confirmed"
                          ? "Gelecek"
                          : appointment.confirmation_status === "declined"
                            ? "Gelemeyecek"
                            : "Bekliyor"}
                      </Badge>
                      <DocumentStatusBadge appointmentId={appointment.id} />
                    </div>
                  </div>
                </TableCell>

                {/* Hasta sütunu */}
                <TableCell className="align-top py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{appointment.patients?.full_name}</span>
                      {appointment.patients?.tc_no?.startsWith("TEMP_") && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                          Bilgiler Eksik
                        </Badge>
                      )}
                    </div>
                    {appointment.patients?.phone && appointment.patients.phone !== "0000000000" && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {appointment.patients.phone}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      TC: {appointment.patients?.tc_no?.startsWith("TEMP_") ? "Girilmedi" : appointment.patients?.tc_no}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {appointment.patients?.date_of_birth && appointment.patients.date_of_birth !== "1900-01-01"
                        ? `D: ${new Date(appointment.patients.date_of_birth).toLocaleDateString("tr-TR")}`
                        : "D.Tarihi girilmedi"}
                    </div>
                    {appointment.patients?.medical_alerts && appointment.patients.medical_alerts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {appointment.patients.medical_alerts.map((alert: MedicalAlert, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={`text-xs ${
                              alert.severity === "critical"
                                ? "bg-red-100 text-red-800 border-red-300 animate-pulse"
                                : alert.severity === "high"
                                  ? "bg-orange-100 text-orange-800 border-orange-300"
                                  : alert.severity === "moderate"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                    : "bg-blue-100 text-blue-800 border-blue-300"
                            }`}
                          >
                            {alert.type}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* İşlemler sütunu */}
                <TableCell className="align-top py-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                        <Link href={`/admin/appointments/${appointment.id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEditClick(appointment)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleDocumentClick(appointment.id)}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(appointment)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {appointment.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => updateStatus(appointment.id, "confirmed")}
                          disabled={isUpdating === appointment.id}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Onayla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          onClick={() => updateStatus(appointment.id, "cancelled")}
                          disabled={isUpdating === appointment.id}
                        >
                          <X className="mr-1 h-3 w-3" />
                          İptal
                        </Button>
                      </div>
                    )}
                    {appointment.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => updateStatus(appointment.id, "completed")}
                        disabled={isUpdating === appointment.id}
                      >
                        Tamamlandı
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    {/* Edit Dialog */}
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Randevu Duzenle</DialogTitle>
          <DialogDescription>
            Randevunun tarih ve saatini degistirin.
          </DialogDescription>
        </DialogHeader>
        {appointmentToEdit && (
          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="space-y-1">
                <Label htmlFor="edit-name" className="text-xs text-muted-foreground">Hasta Adı Soyadı</Label>
                <Input
                  id="edit-name"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="font-medium"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Doktor: {appointmentToEdit.doctors?.name}
              </div>
              {appointmentToEdit.patients?.tc_no?.startsWith("TEMP_") && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                  Hasta bilgileri tamamlanmali
                </Badge>
              )}
            </div>
            
            {appointmentToEdit.patients?.tc_no?.startsWith("TEMP_") && (
              <div className="space-y-3 p-3 border rounded-lg bg-blue-50/50">
                <div className="text-sm font-medium text-blue-900">Hasta Bilgilerini Tamamla</div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tc">TC Kimlik No</Label>
                  <Input
                    id="edit-tc"
                    type="text"
                    placeholder="11 haneli TC"
                    value={editTcNo}
                    onChange={(e) => setEditTcNo(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    maxLength={11}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefon</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    placeholder="05xxxxxxxxx"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    maxLength={11}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dob">Dogum Tarihi</Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                  />
                </div>

                {/* KVKK Onay Kaniti - sadece onaylandiysa goster */}
                {appointmentToEdit.patients?.kvkk_approved && (
                  <div className="col-span-full rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">KVKK Onay Kaniti</p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-700">Onaylandi</p>
                      {appointmentToEdit.patients.kvkk_approved_at && (
                        <p className="text-xs text-green-600">
                          Tarih: {new Date(appointmentToEdit.patients.kvkk_approved_at).toLocaleString("tr-TR")}
                        </p>
                      )}
                      {appointmentToEdit.patients.kvkk_approved_via && (
                        <p className="text-xs font-mono bg-green-100 text-green-700 rounded px-2 py-0.5 inline-block">
                          {appointmentToEdit.patients.kvkk_approved_via}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="edit-appt-type">Randevu Tipi</Label>
              <Select value={editAppointmentType} onValueChange={setEditAppointmentType}>
                <SelectTrigger id="edit-appt-type">
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ilk-muayene">İlk Muayene</SelectItem>
                  <SelectItem value="kontrol-takip">Kontrol / Takip</SelectItem>
                  <SelectItem value="gebelik-istemi-infertilite">Gebelik İstemi / İnfertilite</SelectItem>
                  <SelectItem value="jinekolojik-muayene">Jinekolojik Muayene</SelectItem>
                  <SelectItem value="ayrintili-fetal-ultrason">Ayrıntılı Fetal Ultrason</SelectItem>
                  <SelectItem value="diger">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Tarih</Label>
              <Input
                id="edit-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-time">Saat</Label>
              <Input
                id="edit-time"
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                step="900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Not (Opsiyonel)</Label>
              <Textarea
                id="edit-notes"
                placeholder="Randevu hakkında not ekleyin..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing}>
            Vazgec
          </Button>
          <Button onClick={handleEditConfirm} disabled={isEditing}>
            {isEditing ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
