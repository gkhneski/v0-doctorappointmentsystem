import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { isTheme } from "@/lib/anne/theme"
import { saveTheme } from "@/lib/anne/theme-service"
import { requireAppUser } from "@/lib/anne/server"

// Renk teması.
//   PUT   { theme } temayı değiştirir (null: bebeğin cinsiyetine göre)

export async function PUT(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  if (!(await checkRateLimit(`anne:tema:${gate.user.id}`, 60, 3600))) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Biraz sonra yeniden dene." }, { status: 429 })
  }
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || !("theme" in body) || (body.theme !== null && !isTheme(body.theme))) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }
  if (!(await saveTheme(gate.db, gate.user.id, body.theme))) {
    return NextResponse.json({ error: "Kaydedilemedi. Lütfen yeniden dene." }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
