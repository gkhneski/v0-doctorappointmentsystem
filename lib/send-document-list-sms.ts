export function getDocumentListByType(appointmentType: string): string[] {
  const documentCategories: Record<string, string[]> = {
    "asilama-tup-bebek": [
      "1. Hormon Tahlilleri (FSH, LH, E2, AMH, Prolaktin)",
      "2. Rahim Filmi (HSG)",
      "3. Spermiogram (erkek partner)",
      "4. Genetik Tahliller",
      "5. Onceki Tedavi Kayitlari",
      "6. Ameliyat Raporlari",
    ],
    "gebelik-takibi": [
      "1. Kan/idrar tahlilleri",
      "2. Gebelik ultrasonlari",
      "3. Ikili/uclu/dortlu testler",
      "4. Fetal DNA analizleri",
      "5. Kullandiginiz ilaclar",
      "6. Kan grubu bilgisi",
    ],
    "gebelik-istemi-infertilite": [
      "1. Kan/idrar tahlilleri",
      "2. Gebelik ultrasonlari",
      "3. Ikili/uclu/dortlu testler",
      "4. Fetal DNA analizleri",
      "5. Kullandiginiz ilaclar",
      "6. Kan grubu bilgisi",
    ],
    "ayrintili-fetal-ultrason": [
      "1. Kan/idrar tahlilleri",
      "2. Gebelik ultrasonlari",
      "3. Ikili/uclu/dortlu testler",
      "4. Fetal DNA analizleri",
      "5. Kullandiginiz ilaclar",
      "6. Kan grubu bilgisi",
    ],
    "jinekolojik-muayene": [
      "1. Smear Testi Sonuclari",
      "2. HPV Test Sonuclari",
      "3. Ultrason Goruntuleri",
      "4. Kan Tahlilleri (hormon testleri)",
      "5. Gecmis Ameliyat Raporlari",
      "6. Kullandiginiz Ilaclar",
    ],
    "kontrol-takip": [
      "1. Kan/idrar tahlilleri",
      "2. Ultrason raporlari",
      "3. MRG ve Tomografi sonuclari",
      "4. Smear/HPV Test sonuclari",
      "5. Ameliyat veya biyopsi notlari",
      "6. Diger hastalik bilgileri",
    ],
  }

  return documentCategories[appointmentType] || documentCategories["kontrol-takip"]
}

export async function sendDocumentListSMS(phone: string, patientName: string, appointmentType: string) {
  const documents = getDocumentListByType(appointmentType)

  const message = `Sayin ${patientName},

EVRAK LISTESI

Randevunuza getirmeniz gereken evraklar:

${documents.join("\n")}

Not: Evraklar zorunlu degildir ama doktorunuzun daha iyi hizmet vermesi icin onerilir.

Prof. Dr. Eray Caliskan
Kadin Hastaliklari ve Dogum Uzmani`

  // NetGSM API parametreleri
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
    console.log("[v0] Document list SMS sent:", result)

    return result.startsWith("00") || result.includes("ID:")
  } catch (error) {
    console.error("[v0] Document list SMS sending error:", error)
    return false
  }
}
