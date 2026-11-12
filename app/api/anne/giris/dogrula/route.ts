import { NextResponse } from "next/server"
import { checkLoginCode, createSession, findOrCreateUser, isPhoneAllowed, loginPhone } from "@/lib/anne/auth"
import { appDb, isSameOrigin, publicProfile, setSessionCookie } from "@/lib/anne/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

// Kodu denetler; doğruysa hesabı (yoksa) açar ve oturum çerezini verir.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "İstek reddedildi" }, { status: 403 })

  const body = await request.json().catch(() => null)
  const phone = loginPhone(body?.phone)
  if (!phone || !isPhoneAllowed(phone)) {
    return NextResponse.json({ error: "Kod hatalı ya da süresi dolmuş." }, { status: 400 })
  }

  // Kod başına 5 deneme sınırına ek olarak adres başına sınır: denetlenemiyorsa reddedilir.
  if (!(await checkRateLimit(`anne-dogrula-ip:${getClientIp(request)}`, 20, 600, { failClosed: true }))) {
    return NextResponse.json({ error: "Çok fazla deneme. Lütfen birkaç dakika sonra yeniden deneyin." }, { status: 429 })
  }

  const db = appDb()
  const result = await checkLoginCode(db, phone, body?.code)

  if (result === "too_many_attempts") {
    return NextResponse.json({ error: "Çok fazla hatalı deneme. Lütfen yeni kod isteyin." }, { status: 429 })
  }
  if (result === "error") {
    return NextResponse.json({ error: "Şu anda giriş yapılamıyor. Lütfen yeniden deneyin." }, { status: 500 })
  }
  if (result !== "ok") {
    return NextResponse.json({ error: "Kod hatalı ya da süresi dolmuş." }, { status: 400 })
  }

  const user = await findOrCreateUser(db, phone)
  const session = user && (await createSession(db, user.id, request.headers.get("user-agent")))
  if (!user || !session) {
    return NextResponse.json({ error: "Şu anda giriş yapılamıyor. Lütfen yeniden deneyin." }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true, profile: publicProfile(user) })
  setSessionCookie(response, session.token, session.expiresAt)
  return response
}
