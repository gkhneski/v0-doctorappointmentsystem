import { after, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { purgeStaleUnverified } from "@/lib/public-booking"
import { notifyStaffOfCancellation } from "@/lib/cancellation-notice"
import { sendAppointmentLinkSMS } from "@/lib/send-appointment-link-sms"
import { sendDocumentListSMS } from "@/lib/send-document-list-sms"
import { isBookingType } from "@/lib/anne/booking-types"
import { bookAppointment, bookingState, cancelAppointment, listOpenDays } from "@/lib/anne/clinic-booking"
import { consentBlock, requireAppUser } from "@/lib/anne/server"

// Uygulamadan randevu: canlı boş saatler, randevu alma, kendi randevusunu iptal.
// Bütün kurallar lib/anne/clinic-booking.ts içindedir; bu yol yalnızca oturumu denetler,
// hız sınırı koyar ve SMS / personel bildirimini yanıttan sonra gönderir.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NO_STORE = { "Cache-Control": "private, no-store" }

/** Hastanın randevuları ve (tur verilmişse) o tür için boş günler ve saatler. */
export async function GET(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  if (!(await checkRateLimit(`anne:randevu:oku:${gate.user.id}`, 90, 60))) {
    return NextResponse.json({ error: "Çok sık yenilendi. Lütfen biraz bekle." }, { status: 429 })
  }

  const type = new URL(request.url).searchParams.get("tur")
  const state = await bookingState(gate.db, gate.user)
  if (!isBookingType(type)) return NextResponse.json({ ...state, days: null }, { headers: NO_STORE })

  // Sitede kodu doğrulanmadan bırakılmış randevular saati tutmaya devam etmesin.
  await purgeStaleUnverified(gate.db)
  return NextResponse.json({ ...state, days: await listOpenDays(gate.db, type) }, { headers: NO_STORE })
}

export async function POST(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response
  const blocked = await consentBlock(gate)
  if (blocked) return blocked

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== "object") return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })

  if (!(await checkRateLimit(`anne:randevu:al:${gate.user.id}`, 8, 3600))) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Lütfen bir süre sonra yeniden dene." }, { status: 429 })
  }

  // Günlük üst sınır: al-iptal et döngüsüyle takvimde saat tüketilmesin.
  if (!(await checkRateLimit(`anne:randevu:gun:${gate.user.id}`, 10, 86_400))) {
    return NextResponse.json({ error: "Bugün çok fazla deneme yapıldı. Lütfen sekreteri ara: 0531 080 47 20" }, { status: 429 })
  }
  // Çift dokunuş ya da iki sekme: aynı hesabın istekleri art arda işlenir (iki geçici kayıt açılmasın).
  if (!(await checkRateLimit(`anne:randevu:sira:${gate.user.id}`, 1, 3))) {
    return NextResponse.json({ error: "Randevun işleniyor. Birkaç saniye sonra yeniden dene." }, { status: 429 })
  }

  await purgeStaleUnverified(gate.db)
  const result = await bookAppointment(gate.db, gate.user, {
    type: payload.tur,
    date: payload.tarih,
    time: payload.saat,
    fetalCount: payload.bebekSayisi,
    fullName: payload.adSoyad,
  })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, needsName: result.needsName === true, refresh: result.refresh === true },
      { status: result.status },
    )
  }

  // Sitedeki yolun kod doğrulandıktan sonra gönderdiği iki SMS'in aynısı: onay ve evrak listesi.
  const { appointment, patientName, phone } = result
  after(async () => {
    try {
      await sendAppointmentLinkSMS(phone, patientName, appointment.date, appointment.time, appointment.type ?? undefined)
      if (appointment.type) await sendDocumentListSMS(phone, patientName, appointment.type)
    } catch (error) {
      console.error("App booking SMS failed:", error instanceof Error ? error.message : error)
    }
  })

  return NextResponse.json({ ok: true, appointment })
}

export async function DELETE(request: Request) {
  const gate = await requireAppUser(request)
  if (!gate.ok) return gate.response

  const payload = await request.json().catch(() => null)
  if (typeof payload?.randevu !== "string" || !UUID.test(payload.randevu)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 })
  }

  // İptal edilen saat takvimde dolu kalır ve personele bildirim gider; günde en çok üç iptal.
  if (!(await checkRateLimit(`anne:randevu:iptal:${gate.user.id}`, 3, 86_400))) {
    return NextResponse.json({ error: "Bugün daha fazla iptal yapılamıyor. Lütfen sekreteri ara: 0531 080 47 20" }, { status: 429 })
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const result = await cancelAppointment(gate.db, gate.user, payload.randevu, {
    ipAddress: forwarded || request.headers.get("x-real-ip") || null,
    userAgent: request.headers.get("user-agent")?.slice(0, 1000) || null,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

  const db = gate.db
  after(() => notifyStaffOfCancellation(db, { ...result.details, source: "app" }))
  return NextResponse.json({ ok: true })
}
