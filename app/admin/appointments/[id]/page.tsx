import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, FileText, RefreshCw } from "lucide-react"
import { sendAppointmentLinkSMS } from "@/lib/send-appointment-link-sms"

/* ---------------- FORM FORMATTER ---------------- */

const formatFormData = (data: Record<string, any>) => {
  const fieldLabels: Record<string, string> = {
    previousPregnancy: "Önceki Gebelik",
    ivfAttempt: "Tüp Bebek Denemesi",
    miscarriage: "Düşük",
    chronicDisease: "Kronik Hastalık",
    medications: "İlaçlar",
    spermTest: "Sperm Testi",
    varicocele: "Varikosel",
    smoking: "Sigara",
    alcohol: "Alkol",
    appointment_type: "Randevu Tipi",
    referral_doctor: "Yönlendiren Doktor",
  }

  return Object.entries(data)
    .filter(([key]) => key !== "medical_documents") // Filter out medical_documents
    .map(([key, value]) => ({
      label: fieldLabels[key] || key.replace(/([A-Z_])/g, " $1").trim(),
      value:
        value === null || value === undefined || value === ""
          ? "Belirtilmemiş"
          : value === true
            ? "Evet"
            : value === false
              ? "Hayır"
              : Array.isArray(value)
                ? value.join(", ")
                : typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value),
    }))
}

/* ---------------- PAGE ---------------- */

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/admin/login")

  const { id } = await params

  if (id === "new") {
    redirect("/admin")
  }

  const serviceSupabase = createServiceRoleClient()

  /* ---------- APPOINTMENT ---------- */

  const { data: appointment } = await serviceSupabase
    .from("appointments")
    .select(`
      *,
      doctors:doctor_id (
        name,
        specialization
      ),
      patients:patient_id (
        id,
        full_name,
        phone,
        tc_no,
        kvkk_approved,
        kvkk_approved_at,
        kvkk_approved_via
      )
    `)
    .eq("id", id)
    .single()

  if (!appointment) notFound()

  /* ---------- FORM DATA (TEK DOĞRU KAYNAK) ---------- */

  const { data: appointmentForm } = await serviceSupabase
    .from("appointment_forms")
    .select("form_data")
    .eq("appointment_id", id)
    .maybeSingle()

  /* ---------- DOCUMENTS ---------- */

  const { data: documents } = await serviceSupabase.from("patient_documents").select("*").eq("appointment_id", id)

  const patient = appointment.patients
  const doctor = appointment.doctors

  const formattedFormData = appointmentForm?.form_data ? formatFormData(appointmentForm.form_data) : null

  /* ---------- RESEND LINK ---------- */

  const handleResendLink = async () => {
    "use server"

    try {
      const serviceSupabase = createServiceRoleClient()

      await sendAppointmentLinkSMS(patient.phone, patient.full_name)

      redirect(`/admin/appointments/${id}?sent=true`)
    } catch (err) {
      console.error("[RESEND LINK ERROR]", err)
    }
  }

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Panele Dön
          </Link>
        </Button>

        {/* DETAILS */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Randevu Detayları</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Doktor</p>
              <p className="font-medium">{doctor.name}</p>
              <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Tarih & Saat</p>
              <p className="font-medium">
                {new Date(appointment.appointment_date).toLocaleDateString("tr-TR")} – {appointment.appointment_time}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Hasta</p>
              <p className="font-medium">{patient.full_name}</p>
              <p className="text-sm text-muted-foreground">{patient.phone}</p>
            </div>

                  <div>
                    <p className="text-sm text-muted-foreground">TC Kimlik No</p>
                    <p className="font-medium">{patient.tc_no}</p>
                  </div>

                  <div className={`col-span-full rounded-lg border p-3 ${(patient as any).kvkk_approved ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-500">KVKK Onay Durumu</p>
                    {(patient as any).kvkk_approved ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-green-700">Onaylandı</p>
                        {(patient as any).kvkk_approved_at && (
                          <p className="text-xs text-green-600">
                            Tarih: {new Date((patient as any).kvkk_approved_at).toLocaleString("tr-TR")}
                          </p>
                        )}
                        {(patient as any).kvkk_approved_via && (
                          <p className="text-xs text-green-600 font-mono bg-green-100 rounded px-2 py-0.5 inline-block">
                            {(patient as any).kvkk_approved_via}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-red-600">Onay alınmamis</p>
                    )}
                  </div>

            <div>
              <p className="text-sm text-muted-foreground">Muayene Ücreti</p>
              <p className="font-medium text-lg text-green-600">
                {appointment.fee ? `${appointment.fee} ₺` : "Belirlenmedi"}
              </p>
            </div>

            <form action={handleResendLink} className="col-span-2">
              <Button variant="outline" className="w-full bg-transparent">
                <RefreshCw className="mr-2 h-4 w-4" />
                Randevu Onay SMS'i Tekrar Gönder
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FORM */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hasta Formu</CardTitle>
            <CardDescription>Hastanın doldurduğu tıbbi geçmiş formu</CardDescription>
          </CardHeader>
          <CardContent>
            {formattedFormData ? (
              <div className="space-y-4">
                {formattedFormData.map((field, i) => (
                  <div key={i} className="border-b pb-3">
                    <p className="font-medium text-sm">{field.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{field.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Hasta henüz formu doldurmadı</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DOCUMENTS */}
        <Card>
          <CardHeader>
            <CardTitle>Yüklenen Evraklar</CardTitle>
          </CardHeader>
          <CardContent>
            {documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex justify-between border p-3 rounded">
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">{doc.file_type}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={doc.file_url} target="_blank" rel="noreferrer">
                        Görüntüle
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">Henüz evrak yüklenmedi</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
