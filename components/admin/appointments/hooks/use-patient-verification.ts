import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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

export function usePatientVerification(
  onAppointmentsChange: (appointments: Appointment[]) => void,
  onSelectedChange: (appointment: Appointment | null) => void
) {
  const { toast } = useToast()
  const router = useRouter()
  const [verificationStep, setVerificationStep] = useState<"form" | "code">("form")
  const [verificationCode, setVerificationCode] = useState("")
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [completingInfo, setCompletingInfo] = useState(false)

  const sendVerificationCode = async (selectedAppointment: Appointment | null, completeFormData: any) => {
    setCompletingInfo(true)
    
    if (!completeFormData.tc_no || !completeFormData.phone) {
      toast({ title: "Hata", description: "TC ve telefon zorunludur", variant: "destructive" })
      setCompletingInfo(false)
      return
    }

    try {
      const response = await fetch("/api/admin/patients/complete-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedAppointment?.patients?.id,
          appointment_id: selectedAppointment?.id,
          tc_no: completeFormData.tc_no,
          phone: completeFormData.phone,
          date_of_birth: completeFormData.date_of_birth || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "Hata",
          description: result.error || "Kod gönderilemedi",
          variant: "destructive",
        })
        setCompletingInfo(false)
        return
      }

      setVerificationStep("code")
      toast({
        title: "Kod Gönderildi",
        description: `${completeFormData.phone}'e KVKK onay kodu gönderildi`,
      })
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "İsteğiniz işlenirken bir hata oluştu", variant: "destructive" })
    } finally {
      setCompletingInfo(false)
    }
  }

  const verifyCode = async (
    selectedAppointment: Appointment | null,
    verificationCode: string,
    completeFormData: any,
    appointments: Appointment[]
  ) => {
    setVerifyingCode(true)
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      toast({ title: "Hata", description: "Lütfen 6 haneli kodu girin", variant: "destructive" })
      setVerifyingCode(false)
      return
    }

    try {
      const response = await fetch("/api/admin/patients/verify-kvkk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedAppointment?.patients?.id,
          appointment_id: selectedAppointment?.id,
          phone: completeFormData.phone,
          code: verificationCode,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Kod doğrulanamadı")
      }

      if (result.success) {
        const updated = appointments.map(a =>
          a.id === selectedAppointment?.id
            ? {
                ...a,
                is_intermediate: false,
                status: "confirmed",
                confirmation_status: "confirmed",
                patients: a.patients ? {
                  ...a.patients,
                  tc_no: completeFormData.tc_no,
                  phone: completeFormData.phone,
                } : a.patients
              }
            : a
        )

        onAppointmentsChange(updated)
        onSelectedChange({
          ...selectedAppointment,
          is_intermediate: false,
          status: "confirmed",
          confirmation_status: "confirmed",
          patients: selectedAppointment?.patients ? {
            ...selectedAppointment.patients,
            tc_no: completeFormData.tc_no,
            phone: completeFormData.phone,
          } : selectedAppointment?.patients
        } as any)

        setVerificationStep("form")
        setVerificationCode("")
        toast({ 
          title: "✓ KVKK Onayı Tamamlandı", 
          description: "Hasta artık kayıtlı ve randevular alabilir" 
        })
        router.refresh()
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Kod doğrulanamadı", variant: "destructive" })
    } finally {
      setVerifyingCode(false)
    }
  }

  return {
    verificationStep,
    setVerificationStep,
    verificationCode,
    setVerificationCode,
    verifyingCode,
    completingInfo,
    sendVerificationCode,
    verifyCode,
  }
}
