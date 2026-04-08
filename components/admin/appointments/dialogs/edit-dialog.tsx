import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

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

type EditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedAppointment: any
  onAppointmentChange: (appointment: any) => void
  onAppointmentsChange: (appointments: any[]) => void
  allAppointments: any[]
}

export function EditDialog({
  open,
  onOpenChange,
  selectedAppointment,
  onAppointmentChange,
  onAppointmentsChange,
  allAppointments,
}: EditDialogProps) {
  const { toast } = useToast()

  const handleFieldUpdate = async (field: string, value: any) => {
    const supabase = createClient()
    await supabase.from("appointments").update({ [field]: value }).eq("id", selectedAppointment.id)
    onAppointmentChange({ ...selectedAppointment, [field]: value })
    onAppointmentsChange(
      allAppointments.map(a => a.id === selectedAppointment.id ? { ...a, [field]: value } : a)
    )
    toast({ title: field === "appointment_date" ? "Tarih Güncellendi" : field === "appointment_time" ? "Saat Güncellendi" : field === "appointment_type" ? "Randevu Tipi Güncellendi" : "Notlar Güncellendi" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Randevu Düzenle</DialogTitle>
          <DialogDescription>
            {selectedAppointment?.patients?.full_name} - {selectedAppointment?.appointment_date && new Date(selectedAppointment.appointment_date).toLocaleDateString("tr-TR")} {selectedAppointment?.appointment_time}
          </DialogDescription>
        </DialogHeader>
        {selectedAppointment && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={selectedAppointment.appointment_date}
                  onChange={(e) => handleFieldUpdate("appointment_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Saat</Label>
                <Input
                  type="time"
                  step="300"
                  value={selectedAppointment.appointment_time?.slice(0, 5) || ""}
                  onChange={(e) => handleFieldUpdate("appointment_time", e.target.value + ":00")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Randevu Tipi</Label>
              <Select
                value={selectedAppointment.appointment_type || "diger"}
                onValueChange={(value) => handleFieldUpdate("appointment_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <textarea
                className="w-full min-h-[100px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedAppointment.notes || ""}
                placeholder="Randevu ile ilgili notlar..."
                onChange={(e) => onAppointmentChange({ ...selectedAppointment, notes: e.target.value })}
                onBlur={() => handleFieldUpdate("notes", selectedAppointment.notes)}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
