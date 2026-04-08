import { getDocumentListByType } from "./send-document-list-sms"

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

  const params = new URLSearchParams({
    usercode: process.env.NETGSM_USER || "",
    password: process.env.NETGSM_PASSWORD || "",
    gsmno: phone.replace(/\D/g, ""),
    message: message,
    msgheader: process.env.NETGSM_HEADER || "SAGLIK",
  })

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 saniye timeout

    const response = await fetch(
      `https://api.netgsm.com.tr/sms/send/get/?${params}`,
      { 
        method: "GET",
        signal: controller.signal 
      }
    )

    clearTimeout(timeoutId)

    const result = await response.text()
    console.log("[v0] Reschedule SMS sent:", result)

    return result.startsWith("00") || result.includes("ID:")
  } catch (error) {
    // Hata loglama ama throw etme - SMS hatasi kritik degil
    console.error("[v0] Reschedule SMS sending error:", error)
    return false
  }
}
