import { PatientDetailClient } from "./patient-detail-client"

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  return <PatientDetailClient patientId={patientId} />
}
