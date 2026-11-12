import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { SESSION_COOKIE, resolveSession, type AppUser } from "@/lib/anne/auth"
import { hasRequiredConsents } from "@/lib/anne/consents"
import { gestationalAge, todayInIstanbul, type GestationalAge } from "@/lib/anne/pregnancy"

// Hasta uygulamasının sunucu tarafı kapısı. /api/anne altındaki her yol (giriş yolları
// dışında) işe requireAppUser ile başlar; tests/guards/anne-routes.test.ts bunu denetler.

/** Hasta tablolarına erişen tek istemci. Tarayıcıya hiçbir zaman verilmez. */
export function appDb() {
  return createServiceRoleClient()
}

/** Oturumdaki hasta; yoksa null. Sayfalarda (sunucu bileşenleri) kullanılır. */
export async function getAppUser(): Promise<AppUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  return resolveSession(appDb(), token)
}

/**
 * Durum değiştiren isteklerin başka bir siteden gönderilmesini engeller: tarayıcının
 * eklediği Origin başlığı isteğin geldiği sunucuyla aynı olmalıdır. Çerez zaten
 * SameSite=Lax; bu ikinci bir kilittir.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return false
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export type AppGate =
  | { ok: true; user: AppUser; db: ReturnType<typeof appDb> }
  | { ok: false; response: NextResponse }

export async function requireAppUser(request: Request): Promise<AppGate> {
  if (request.method !== "GET" && request.method !== "HEAD" && !isSameOrigin(request)) {
    return { ok: false, response: NextResponse.json({ error: "İstek reddedildi" }, { status: 403 }) }
  }

  const db = appDb()
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const user = await resolveSession(db, token)
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 }) }
  }
  return { ok: true, user, db }
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 })
}

/** Tarayıcıya gönderilen hesap bilgisi: yalnızca hastanın kendi ekranının ihtiyaç duyduğu alanlar. */
export function publicProfile(user: AppUser) {
  return {
    phone: user.phone,
    displayName: user.display_name,
    lmp: user.lmp_date,
    dueDate: user.due_date,
    dueDateSource: user.due_date_source,
    onboarded: Boolean(user.onboarded_at),
  }
}

/** Albüm fotoğraflarının durduğu, herkese kapalı depo. */
export const ALBUM_BUCKET = "anne-album"

export type ReadyUser = { user: AppUser & { lmp_date: string; due_date: string }; today: string; age: GestationalAge }

/**
 * Giriş yapmış, başlangıç formunu doldurmuş ve zorunlu onayları vermiş hasta.
 * Eksik adım varsa ilgili ekrana yönlendirir. Sayfalarda (sunucu bileşenleri) kullanılır.
 */
export async function requireReadyUser(): Promise<ReadyUser> {
  const user = await getAppUser()
  if (!user) redirect("/anne/giris")
  if (!user.onboarded_at || !user.lmp_date || !user.due_date) redirect("/anne/baslangic")
  if (!(await hasRequiredConsents(appDb(), user.id))) redirect("/anne/onay")

  const today = todayInIstanbul()
  const age = gestationalAge(user.lmp_date, today)
  if (!age) redirect("/anne/hesap")
  return { user: { ...user, lmp_date: user.lmp_date, due_date: user.due_date }, today, age }
}

/** Sağlık verisi saklayan yollar için: zorunlu onaylar yoksa 403. */
export async function consentBlock(gate: Extract<AppGate, { ok: true }>): Promise<NextResponse | null> {
  if (await hasRequiredConsents(gate.db, gate.user.id)) return null
  return NextResponse.json({ error: "Önce onayları tamamlamanız gerekiyor." }, { status: 403 })
}
