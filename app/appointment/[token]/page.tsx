import { notFound } from "next/navigation"
import { validateAppointmentToken } from "@/lib/generate-appointment-token"
import AppointmentLinkForm from "@/components/appointment-link-form"

export default async function AppointmentLinkPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  console.log("[v0] Appointment link page - Token:", token)

  const tokenData = await validateAppointmentToken(token)

  console.log("[v0] Token validation result:", tokenData ? "Valid" : "Invalid")

  if (!tokenData) {
    console.log("[v0] Token invalid, redirecting to not-found")
    notFound()
  }

  const appointment = tokenData.appointments as any

  console.log("[v0] Appointment data:", appointment)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Randevu Bilgi Formu</h1>
            <p className="text-gray-600">Lütfen aşağıdaki bilgileri eksiksiz doldurun</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">Randevu Bilgileri</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Doktor:</span>
                <span className="ml-2 font-medium">{appointment.doctors?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Tarih:</span>
                <span className="ml-2 font-medium">
                  {new Date(appointment.appointment_date).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Saat:</span>
                <span className="ml-2 font-medium">{appointment.appointment_time}</span>
              </div>
              <div>
                <span className="text-gray-600">Muayene Tipi:</span>
                <span className="ml-2 font-medium">{appointment.appointment_type}</span>
              </div>
            </div>
          </div>

          <AppointmentLinkForm
            appointmentId={appointment.id}
            token={token}
            appointmentType={appointment.appointment_type}
          />
        </div>
      </div>
    </div>
  )
}
