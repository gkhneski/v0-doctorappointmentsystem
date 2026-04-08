import { notFound } from "next/navigation"
import { validateAppointmentToken } from "@/lib/generate-appointment-token"
import AppointmentLinkForm from "@/components/appointment-link-form"
import { Card } from "@/components/ui/card"
import { Calendar, Clock, User } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PatientFormPage({
  searchParams,
}: {
  searchParams: Promise<{ aid?: string; t?: string }>
}) {
  const params = await searchParams
  const token = params.t

  console.log("[v0] Patient form page - Token:", token)

  if (!token) {
    console.log("[v0] No token in search params")
    notFound()
  }

  // Token'ı validate et
  const tokenData = await validateAppointmentToken(token)

  console.log("[v0] Token validation in page:", tokenData)

  if (!tokenData || !tokenData.appointments) {
    console.log("[v0] Invalid token or no appointment data")
    notFound()
  }

  const appointment = tokenData.appointments as any
  const doctor = appointment.doctors

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Randevu Bilgileri ve Form</h1>
          <p className="text-gray-600">Lütfen aşağıdaki bilgileri doldurun</p>
        </div>

        <Card className="p-6 mb-6 bg-white shadow-lg">
          <h2 className="font-semibold text-lg mb-4 text-gray-900">Randevu Detayları</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-medium">Doktor:</span> {doctor?.name || "Prof. Dr. Eray Çalışkan"}
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-medium">Tarih:</span>{" "}
                {new Date(appointment.appointment_date).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-medium">Saat:</span> {appointment.appointment_time}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white shadow-lg">
          <AppointmentLinkForm
            appointmentId={appointment.id}
            token={token}
            appointmentType={appointment.appointment_type}
          />
        </Card>
      </div>
    </div>
  )
}
