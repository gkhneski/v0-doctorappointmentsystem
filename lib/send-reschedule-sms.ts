import { getDocumentListByType } from "./send-document-list-sms"
import { sendSms } from "@/lib/sms"

export async function sendRescheduleSMS(
  phone: string,
  patientName: string,
  newDate: string,
  newTime: string,
  appointmentType: string | null
) {
  // Tarihi formatla: 2026-02-13 -> 13.02.2026
  const [year, month, day] = newDate.split("-")
  const formattedDate = `${day}.${month}.${year}`

  // Saati formatla: 13:15:00 -> 13:15
  const formattedTime = newTime.substring(0, 5)

  // Evrak listesini al
  const documents = appointmentType
    ? getDocumentListByType(appointmentType)
    : []

  const documentSection = documents.length > 0
    ? `\nGetirmeniz gereken evraklar:\n${documents.join("\n")}\n`
    : ""

  const message = `Sayin ${patientName},

Randevunuz guncellendi.

Yeni Tarih: ${formattedDate}
Yeni Saat: ${formattedTime}
${documentSection}
Not: Evraklar zorunlu degildir ama onerilir.

Prof. Dr. Eray Caliskan
Kadin Hastaliklari ve Dogum Uzmani`

  return (await sendSms(phone, message, { timeoutMs: 10_000 })).sent
}
