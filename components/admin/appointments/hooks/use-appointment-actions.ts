import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export type Appointment = {
  id: string
  patient_id?: string
  appointment_date: string
  appointment_time: string
  status: string
  confirmation_status?: string | null
  notes: string | null
  appointment_type: string | null
  print_type?: string | null
  payment_status?: string | null
  payment_amount?: number | null
  fetal_bebek_sayisi?: string | null
  is_intermediate?: boolean | null
  reminder_sent_at?: string | null
  link_clicked_at?: string | null
  confirmed_at?: string | null
  created_at?: string | null
  patients?: {
    id: string
    full_name: string
    phone: string | null
    tc_no?: string | null
  }
}

export function useAppointmentActions(
  onAppointmentsChange: (appointments: Appointment[]) => void,
  onSelectedChange: (appointment: Appointment | null) => void
) {
  const router = useRouter()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const updateStatus = async (appointmentId: string, newStatus: string, appointments: Appointment[]) => {
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

  const updatePaymentStatus = async (
    appointmentId: string,
    status: "paid" | "unpaid",
    appointments: Appointment[],
    selectedAppointment: Appointment | null
  ) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq("id", appointmentId)
      if (error) throw error
      const updated = appointments.map(a => a.id === appointmentId ? { ...a, payment_status: status } : a)
      onAppointmentsChange(updated)
      if (selectedAppointment?.id === appointmentId) {
        onSelectedChange({ ...selectedAppointment, payment_status: status })
      }
    } catch (error) {
      console.error("[v0] Ödeme durumu güncellenirken hata:", error)
    }
  }

  const updatePaymentAmount = async (
    appointmentId: string,
    amount: number,
    appointments: Appointment[],
    selectedAppointment: Appointment | null
  ) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ payment_amount: amount, updated_at: new Date().toISOString() })
        .eq("id", appointmentId)
      if (error) throw error
      const updated = appointments.map(a => a.id === appointmentId ? { ...a, payment_amount: amount } : a)
      onAppointmentsChange(updated)
      if (selectedAppointment?.id === appointmentId) {
        onSelectedChange({ ...selectedAppointment, payment_amount: amount })
      }
    } catch (error) {
      console.error("[v0] Ödeme tutarı güncellenirken hata:", error)
    }
  }

  const updatePrintType = async (
    appointmentId: string,
    printType: string | null,
    appointments: Appointment[],
    selectedAppointment: Appointment | null
  ) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ print_type: printType })
        .eq("id", appointmentId)
      if (error) throw error
      const updated = appointments.map(a => a.id === appointmentId ? { ...a, print_type: printType } : a)
      onAppointmentsChange(updated)
      toast({ title: "Başarılı", description: "Yazdırma tipi güncellendi" })
    } catch (error) {
      console.error("[v0] Yazdırma tipi güncellenirken hata:", error)
      toast({ title: "Hata", description: "Yazdırma tipi güncellenemedi", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string, appointments: Appointment[]) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id)
      if (error) throw error
      const updated = appointments.filter(a => a.id !== id)
      onAppointmentsChange(updated)
      onSelectedChange(null)
      toast({ title: "Silindi", description: "Randevu başarıyla silindi" })
      router.refresh()
    } catch (error) {
      console.error("[v0] Randevu silinirken hata:", error)
    }
  }

  return {
    isUpdating,
    deleteId,
    setDeleteId,
    updateStatus,
    updatePaymentStatus,
    updatePaymentAmount,
    updatePrintType,
    handleDelete,
  }
}
