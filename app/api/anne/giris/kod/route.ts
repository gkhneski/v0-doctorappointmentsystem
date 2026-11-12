import { NextResponse } from "next/server"
import { isPhoneAllowed, issueLoginCode, loginPhone } from "@/lib/anne/auth"
import { appDb, isSameOrigin } from "@/lib/anne/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { sendSms } from "@/lib/sms"

// Giriş kodu ister. Hesabın var olup olmadığını söylemez: kayıtlı ve kayıtsız numara aynı yanıtı alır.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "İstek reddedildi" }, { status: 403 })

  const body = await request.json().catch(() => null)
  const phone = loginPhone(body?.phone)
  if (!phone) {
    return NextResponse.json({ error: "Geçerli bir cep telefonu numarası girin." }, { status: 400 })
  }

  if (!isPhoneAllowed(phone)) {
    return NextResponse.json(
      { error: "Uygulama henüz herkese açılmadı. Açıldığında bu numarayla giriş yapabilirsiniz." },
      { status: 403 },
    )
  }

  // SMS pahalıdır ve kötüye kullanılabilir: sınır denetlenemiyorsa gönderilmez.
  const ip = getClientIp(request)
  const allowed =
    (await checkRateLimit(`anne-kod-tel:${phone}`, 3, 600, { failClosed: true })) &&
    (await checkRateLimit(`anne-kod-ip:${ip}`, 10, 3600, { failClosed: true }))
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla kod istendi. Lütfen birkaç dakika sonra yeniden deneyin." },
      { status: 429 },
    )
  }

  const issued = await issueLoginCode(appDb(), phone)
  if (!issued) return NextResponse.json({ error: "Kod oluşturulamadı. Lütfen yeniden deneyin." }, { status: 500 })

  const sms = await sendSms(phone, `NeoBreed giris kodunuz: ${issued.code}. Kod 5 dakika gecerlidir.`, {
    strictPhone: true,
  })

  if (!sms.sent) {
    // Yalnızca geliştirme bilgisayarında, SMS ayarı hiç yokken kod yanıtta döner.
    if (process.env.NODE_ENV !== "production" && sms.code === "credentials_missing") {
      return NextResponse.json({ ok: true, devCode: issued.code })
    }
    return NextResponse.json({ error: "Kod gönderilemedi. Lütfen yeniden deneyin." }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
