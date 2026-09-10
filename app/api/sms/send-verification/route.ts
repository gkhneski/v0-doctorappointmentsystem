import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { phone, appointmentId } = await request.json()

    // SMS maliyet/spam korumasi: her telefon icin saatte en fazla 5, her IP icin
    // saatte en fazla 15 dogrulama SMS'i. Boylece bir bot binlerce SMS attiramaz.
    const cleanPhone = String(phone || "").replace(/\D/g, "")
    const ip = getClientIp(request)
    const [phoneOk, ipOk] = await Promise.all([
      checkRateLimit(`sms:phone:${cleanPhone}`, 5, 3600),
      checkRateLimit(`sms:ip:${ip}`, 15, 3600),
    ])
    if (!phoneOk || !ipOk) {
      return NextResponse.json(
        { success: false, message: "Cok fazla SMS istegi. Lutfen bir sure sonra tekrar deneyin." },
        { status: 429 },
      )
    }

    // 6 haneli rastgele kod oluştur
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Kodu veritabanına kaydet (5 dakika geçerli)
    const supabase = await createServiceRoleClient()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    const { error: insertError } = await supabase.from("sms_verifications").insert({
      phone: phone,
      code: verificationCode,
      appointment_id: appointmentId,
      expires_at: expiresAt.toISOString(),
      verified: false,
    })

    if (insertError) {
      console.error("[v0] SMS verification insert error:", insertError)
      throw insertError
    }

    // Netgsm API'sine SMS gönder
    const netgsmUser = process.env.NETGSM_USER
    const netgsmPassword = process.env.NETGSM_PASSWORD
    const netgsmHeader = process.env.NETGSM_HEADER || "SAGLIK"

    if (!netgsmUser || !netgsmPassword) {
      console.error("[v0] Netgsm credentials eksik!")
      // Development ortamında konsola yazdır
      console.log("[v0] SMS Doğrulama Kodu:", verificationCode)
      console.log("[v0] Telefon:", phone)

      return NextResponse.json({
        success: true,
        message: "Development mode - Kod konsola yazdırıldı",
        code: verificationCode, // Sadece development için
      })
    }

    const smsMessage = `Randevu onay kodunuz: ${verificationCode}\n\nKod 5 dakika geçerlidir.\nProf. Dr. Eray Caliskan`

    // Netgsm SMS API çağrısı
    const netgsmUrl = `https://api.netgsm.com.tr/sms/send/get/?usercode=${netgsmUser}&password=${netgsmPassword}&gsmno=${phone.replace(/\D/g, "")}&message=${encodeURIComponent(smsMessage)}&msgheader=${netgsmHeader}`

    const response = await fetch(netgsmUrl)
    const responseText = await response.text()

    console.log("[v0] Netgsm Response:", responseText)

    // Netgsm response kodları:
    // 00 veya 01 = Başarılı
    // 30 = Invalid username/password
    // Diğer kodlar = Hata
    if (responseText.startsWith("00") || responseText.startsWith("01")) {
      return NextResponse.json({
        success: true,
        message: "SMS gönderildi",
      })
    } else {
      if (responseText === "30") {
        throw new Error(
          "Netgsm kullanıcı adı veya şifresi hatalı. Lütfen NETGSM_USER ve NETGSM_PASSWORD değişkenlerini kontrol edin.",
        )
      }
      throw new Error(`Netgsm error: ${responseText}`)
    }
  } catch (error) {
    console.error("[v0] SMS gönderme hatası:", error)
    return NextResponse.json(
      {
        success: false,
        message: "SMS gönderilemedi",
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    )
  }
}
