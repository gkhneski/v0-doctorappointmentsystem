export async function sendAppointmentLinkSMS(phone: string, patientName: string) {
  const message = `Sayın ${patientName}, randevunuz başarıyla oluşturuldu. Randevu saatinizden önce lütfen kliniğe geliniz.`

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
