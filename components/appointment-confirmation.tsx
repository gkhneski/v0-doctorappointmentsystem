"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

type Props = {
  appointment: any
  token: string
}

export function AppointmentConfirmation({ appointment, token }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(appointment.confirmation_status === "confirmed")
  const [cancelled, setCancelled] = useState(appointment.confirmation_status === "cancelled")

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/confirm-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "confirm" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Onaylama başarısız")
      }

      setConfirmed(true)
      toast({
        title: "Başarılı",
        description: "Randevunuz onaylandı!",
      })
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/confirm-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "cancel" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "İptal başarısız")
      }

      setCancelled(true)
      toast({
        title: "İptal Edildi",
        description: "Randevunuz iptal edildi. Yeni randevu için klinikle iletişime geçebilirsiniz.",
      })
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    })
  }

  if (confirmed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Randevu Onaylandı</CardTitle>
            <CardDescription>Randevunuz başarıyla onaylandı. Görüşmek üzere!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-1 h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{formatDate(appointment.appointment_date)}</p>
                  <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Randevu İptal Edildi</CardTitle>
            <CardDescription>Randevunuz iptal edildi. Yeni randevu almak için bizimle iletişime geçin.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Randevu Onayı</CardTitle>
          <CardDescription>Randevunuza katılıp katılmayacağınızı lütfen bildirin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Hasta</p>
                <p className="font-medium text-gray-900">{appointment.patients?.full_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Tarih</p>
                <p className="font-medium text-gray-900">{formatDate(appointment.appointment_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-1 h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Saat</p>
                <p className="font-medium text-gray-900">{appointment.appointment_time}</p>
              </div>
            </div>
            {appointment.doctors?.name && (
              <div className="flex items-start gap-3">
                <User className="mt-1 h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Doktor</p>
                  <p className="font-medium text-gray-900">{appointment.doctors.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button onClick={handleConfirm} disabled={isSubmitting} className="w-full" size="lg">
              <CheckCircle className="mr-2 h-5 w-5" />
              {isSubmitting ? "İşleniyor..." : "Geliyorum"}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isSubmitting}
              variant="outline"
              className="w-full bg-transparent"
              size="lg"
            >
              <XCircle className="mr-2 h-5 w-5" />
              {isSubmitting ? "İşleniyor..." : "Gelemiyorum / İptal Et"}
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Bu link sadece bu randevunun onayı için kullanılabilir
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
