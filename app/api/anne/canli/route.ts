import { after, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { GENERATION_BUCKET } from "@/lib/anne/generation/limits"
import { todayInIstanbul } from "@/lib/anne/pregnancy"
import { MOMENT_BUCKET, faceWithoutFrame, readLiveState, runMoment, startMoment } from "@/lib/anne/animation/service"
import { consentBlock, requireAppUser } from "@/lib/anne/server"

// "Canlı bebeğim": üretilmiş bebek yüzünün kısa canlandırmaları.
//   GET            durum (yüz, açılmış anlar, bugün yenisi açılabilir mi)
//   GET ?klip=id   anın videosu (yalnızca sahibine; telefonların istediği parçalı okuma desteklenir)
//   GET ?yuz=id    çerçevesiz yüz resmi (videonun ilk karesiyle aynı görüntü)
//   POST           bugünün anını başlatır; üretim yanıttan sonra sürer, ekran durumu yoklar

export const maxDuration = 300

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PRIVATE = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }

/** "bytes=0-1023" başlığını çözer; geçersizse null. */
function parseRange(header: string | null, size: number): { start: number; end: number } | null {
  const match = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null
  if (!match || (match[1] === "" && match[2] === "")) return null
  let start = match[1] === "" ? Math.max(0, size - Number(match[2])) : Number(match[1])
  let end = match[1] === "" || match[2] === "" ? size - 1 : Number(match[2])
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  end = Math.min(end, size - 1)
  start = Math.max(0, start)
  return start <= end ? { start, end } : null
}

export async function GET(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const params = new URL(request.url).searchParams
  const notFound = () => NextResponse.json({ error: "Bulunamadı." }, { status: 404 })

  const clip = params.get("klip")
  if (clip !== null) {
    if (!UUID.test(clip)) return notFound()
    const { data: row } = await gate.db
      .from("app_moments")
      .select("storage_path")
      .eq("user_id", gate.user.id)
      .eq("id", clip)
      .eq("status", "ready")
      .maybeSingle()
    if (!row?.storage_path) return notFound()
    const { data: file, error } = await gate.db.storage.from(MOMENT_BUCKET).download(row.storage_path)
    if (error || !file) return notFound()

    const bytes = new Uint8Array(await file.arrayBuffer())
    const base = { ...PRIVATE, "Content-Type": "video/mp4", "Accept-Ranges": "bytes" }
    const rangeHeader = request.headers.get("range")
    if (!rangeHeader) return new NextResponse(bytes, { headers: { ...base, "Content-Length": String(bytes.length) } })

    const range = parseRange(rangeHeader, bytes.length)
    if (!range) return new NextResponse(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${bytes.length}` } })
    return new NextResponse(bytes.slice(range.start, range.end + 1), {
      status: 206,
      headers: {
        ...base,
        "Content-Range": `bytes ${range.start}-${range.end}/${bytes.length}`,
        "Content-Length": String(range.end - range.start + 1),
      },
    })
  }

  const face = params.get("yuz")
  if (face !== null) {
    if (!UUID.test(face)) return notFound()
    const { data: row } = await gate.db
      .from("app_generations")
      .select("storage_path")
      .eq("user_id", gate.user.id)
      .eq("id", face)
      .eq("status", "generated")
      .maybeSingle()
    if (!row?.storage_path) return notFound()
    const { data: file, error } = await gate.db.storage.from(GENERATION_BUCKET).download(row.storage_path)
    if (error || !file) return notFound()
    const { jpeg } = await faceWithoutFrame(Buffer.from(await file.arrayBuffer()))
    return new NextResponse(new Uint8Array(jpeg), { headers: { ...PRIVATE, "Content-Type": "image/jpeg" } })
  }

  return NextResponse.json(await readLiveState(gate.db, gate.user.id, todayInIstanbul()), { headers: PRIVATE })
}

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  const blocked = await consentBlock(gate)
  if (blocked) return blocked

  // Başarısız deneme günün hakkını yakmaz; yine de günde birkaç denemeden fazlasına izin yok.
  if (!(await checkRateLimit(`anne:canli:${gate.user.id}`, 4, 86_400))) {
    return NextResponse.json({ error: "Bugün çok fazla deneme yapıldı. Yarın yeniden dene." }, { status: 429 })
  }

  const startedAt = Date.now()
  const started = await startMoment(gate.db, gate.user.id, todayInIstanbul())
  if (!started.ok) return NextResponse.json({ error: started.error }, { status: started.status })

  const db = gate.db
  const userId = gate.user.id
  after(() =>
    runMoment(db, { id: started.id, userId, kind: started.kind, storagePath: started.storagePath }, { deadlineAt: startedAt + 285_000 }).then(
      () => undefined,
    ),
  )

  return NextResponse.json({ ok: true, moment: { id: started.id, kind: started.kind, status: "processing" } })
}
