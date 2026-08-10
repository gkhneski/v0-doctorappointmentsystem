// Randevu tipi slug -> okunabilir isim
const APPOINTMENT_TYPE_NAMES: Record<string, string> = {
  "asilama-tup-bebek": "Asilama/Tup Bebek",
  "ayrintili-fetal-ultrason": "Ayrintili Fetal Ultrason",
  "gebelik-takibi": "Gebelik Takibi",
  "gebelik-istemi-infertilite": "Gebelik Istemi/Infertilite",
  "jinekolojik-muayene": "Jinekolojik Muayene",
  "kontrol-takip": "Kontrol/Takip",
}

export async function sendAppointmentLinkSMS(
  phone: string, 
  patientName: string,
  appointmentDate?: string,
  appointmentTime?: string,
  appointmentType?: string
) {
  // Tarih formatla (2026-05-14 -> 14 Mayis Persembe)
  let dateStr = ""
  if (appointmentDate) {
    const date = new Date(appointmentDate)
    const days = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]
    const months = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"]
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    dateStr = `${day} ${month} ${dayName}`
  }

  // Saat formatla (14:30:00 -> 14:30)
  const timeStr = appointmentTime ? appointmentTime.slice(0, 5) : ""

  const dateTimeInfo = dateStr && timeStr 
    ? ` Tarih: ${dateStr}, Saat: ${timeStr}.` 
    : ""

  // Randevu tipi bilgisi
  const typeName = appointmentType ? APPOINTMENT_TYPE_NAMES[appointmentType] || appointmentType : ""
  
  // Fetal ultrason DEGIL ise uyari ekle
  const nonFetalWarning = appointmentType && appointmentType !== "ayrintili-fetal-ultrason"
    ? " NOT: Bu randevu AYRINTILI FETAL ULTRASON degildir."
    : ""

  const message = `Sayin ${patientName}, randevunuz basariyla olusturuldu.${dateTimeInfo} Randevu Tipi: ${typeName}.${nonFetalWarning} Randevu saatinizden once lutfen klinige geliniz.`

  const params = new URLSearchParams({
    usercode: process.env.NETGSM_USER || "",
    password: process.env.NETGSM_PASSWORD || "",
    gsmno: phone.replace(/\D/g, ""),
    message: message,
    msgheader: process.env.NETGSM_HEADER || "SAGLIK",
  })

  try {
    const response = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${params}`, {
      method: "GET",
    })

    const result = await response.text()
    return result.startsWith("00") || result.includes("ID:")
  } catch (error) {
    console.error("SMS sending error:", error)
    return false
  }
}
