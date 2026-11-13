import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { isTheme } from "@/lib/anne/look"
import { openGift, readLook, saveLook, saveTheme } from "@/lib/anne/look-service"
import { todayInIstanbul } from "@/lib/anne/pregnancy"
import { requireAppUser } from "@/lib/anne/server"

// "Süsle" ve renk teması.
//   GET   tema, takılı aksesuarlar, açık aksesuarlar, bugünün hediyesi açılabilir mi
//   PUT   { items } takılı aksesuarları kaydeder; { theme } temayı değiştirir (null: cinsiyete göre)
//   POST  bugünün hediyesini açar (günde bir aksesuar)

const PRIVATE = { "Cache-Control": "private, no-store" }

export async function GET(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  return NextResponse.json(await readLook(gate.db, gate.user, todayInIstanbul()), { headers: PRIVATE })
}

export async function PUT(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  if (!(await checkRateLimit(`anne:sus:${gate.user.id}`, 240, 3600))) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Biraz sonra yeniden dene." }, { status: 429 })
  }
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })

  if ("theme" in body) {
    if (body.theme !== null && !isTheme(body.theme)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
    if (!(await saveTheme(gate.db, gate.user.id, body.theme))) {
      return NextResponse.json({ error: "Kaydedilemedi. Lütfen yeniden dene." }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  const saved = await saveLook(gate.db, gate.user.id, body.items)
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status })
  return NextResponse.json({ ok: true, items: saved.items })
}

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  if (!(await checkRateLimit(`anne:hediye:${gate.user.id}`, 20, 86_400))) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Yarın yeniden dene." }, { status: 429 })
  }
  const today = todayInIstanbul()
  const gift = await openGift(gate.db, gate.user, today)
  if (!gift.ok) return NextResponse.json({ error: gift.error }, { status: gift.status })
  return NextResponse.json({ ok: true, item: gift.item, state: await readLook(gate.db, gate.user, today) })
}
