import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { SESSION_COOKIE, destroySession } from "@/lib/anne/auth"
import { appDb, clearSessionCookie, isSameOrigin } from "@/lib/anne/server"

// Oturumu kapatır. Oturum yoksa da başarılı döner.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "İstek reddedildi" }, { status: 403 })

  await destroySession(appDb(), (await cookies()).get(SESSION_COOKIE)?.value)
  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response)
  return response
}
