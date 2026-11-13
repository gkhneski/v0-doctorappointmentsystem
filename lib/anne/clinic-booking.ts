import { createHash } from "node:crypto"
import { phoneVariants } from "@/lib/phone"
import { generateUrlToken } from "@/lib/secure-random"
import { PUBLIC_REFUSAL_MESSAGE } from "@/lib/public-booking"
import { validatePublicBooking } from "@/lib/validate-booking"
import { addDays, isIsoDate, todayInIstanbul } from "@/lib/anne/pregnancy"
import {
  BOOKING_HORIZON_DAYS,
  SAME_DAY_LEAD_MINUTES,
  formatDayTr,
  isBookingType,
  isFetalCount,
  minutesOf,
  slotTimes,
  weekdayOf,
  type BookingTypeId,
} from "@/lib/anne/booking-types"
import type { AppUser } from "@/lib/anne/auth"

// Uygulamadan randevu: hasta uygulamasının klinik tablolarına açılan İKİNCİ kapısı
// (birincisi lib/anne/clinic-match.ts, yalnızca okur). Kullanıcının kararıyla (ana plan, 9g)
// hasta uygulamadan canlı saatleri görür ve randevu alır.
//
// Kurallar:
//   * Yalnızca oturumu açık hesap için çalışır. Hesabın numarası girişte SMS koduyla
//     doğrulanmıştır; bu yüzden sitedeki randevu yolunun aksine ikinci bir kod istenmez
//     ve randevu doğrudan "confirmed" doğar (sitede kod doğrulanınca olduğu gibi).
//   * Saat kuralları sitedekiyle aynıdır: günün programı açık olmalı, saat 15 dakikalık
//     ızgarada olmalı, aynı saatte (iptal edilmiş olsa bile) randevu olmamalı, hastanın
//     aynı hafta başka randevusu olmamalı, kara listedeki numara randevu alamaz.
//   * Hasta yalnızca KENDİ kaydının randevularını görür ve iptal eder. Kayıt, doğrulanmış
//     numarayla bulunur; numarayı birden çok kayıt paylaşıyorsa ad sorulur.
//   * Dokunduğu tablolar ve işlemler tests/guards/anne-routes.test.ts içinde sayılıdır;
//     buraya yeni bir tablo eklemek o testi de değiştirmeyi gerektirir.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

const SECRETARY = "0531 080 47 20"
const CHUNK_DAYS = 20

/** İstanbul'da şu an: tarih ve gün içindeki dakika. */
export function istanbulNow(now: Date = new Date()): { today: string; minutes: number } {
  const clock = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now)
  return { today: todayInIstanbul(now), minutes: minutesOf(clock) }
}

type Doctor = { id: string; name: string; working_hours: Record<string, { enabled?: boolean }> | null }

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

async function theDoctor(db: Db): Promise<Doctor | null> {
  const { data } = await db.from("doctors").select("id, name, working_hours").order("name").limit(1)
  return data?.[0] ?? null
}

/** Sitedeki takvim hafta sonunu ve doktorun kapalı işaretlediği günü göstermez. */
function isWorkingDay(doctor: Doctor, date: string): boolean {
  const weekday = weekdayOf(date)
  if (weekday === 0 || weekday === 6) return false
  // Sitedeki takvimle aynı: çalışma saatleri tanımlıysa gün açıkça "enabled" olmalıdır.
  if (!doctor.working_hours) return true
  return Boolean(doctor.working_hours[DAY_KEYS[weekday]]?.enabled)
}

export type OpenDay = { date: string; times: string[] }

/**
 * Önümüzdeki günlerin boş saatleri. Boş saati kalmayan gün listede yer almaz.
 * Dolu saat: o saatte herhangi bir randevu satırı olması (iptal edilmiş randevunun saatini
 * yalnızca personel yeniden verebilir; veritabanındaki tekillik kuralı da böyledir).
 */
export async function listOpenDays(db: Db, type: BookingTypeId, now: Date = new Date()): Promise<OpenDay[]> {
  const doctor = await theDoctor(db)
  if (!doctor) return []

  const { today, minutes } = istanbulNow(now)
  const last = addDays(today, BOOKING_HORIZON_DAYS)

  const { data: schedules } = await db
    .from("doctor_schedules")
    .select("schedule_date, start_time, end_time")
    .eq("doctor_id", doctor.id)
    .eq("is_available", true)
    .eq("is_active", true)
    .gte("schedule_date", today)
    .lte("schedule_date", last)
    .order("schedule_date")
    .limit(200)
  if (!schedules || schedules.length === 0) return []

  // Tek sorguda en çok 1000 satır gelir; dolu takvimde eksik okumamak için dilimlenir.
  const chunks: Promise<{ data: { appointment_date: string; appointment_time: string }[] | null }>[] = []
  for (let offset = 0; offset <= BOOKING_HORIZON_DAYS; offset += CHUNK_DAYS) {
    const from = addDays(today, offset)
    const to = addDays(today, Math.min(offset + CHUNK_DAYS - 1, BOOKING_HORIZON_DAYS))
    chunks.push(
      db
        .from("appointments")
        .select("appointment_date, appointment_time")
        .eq("doctor_id", doctor.id)
        .gte("appointment_date", from)
        .lte("appointment_date", to)
        .limit(1000),
    )
  }
  const taken = new Set<string>()
  for (const chunk of await Promise.all(chunks)) {
    for (const row of chunk.data ?? []) taken.add(`${row.appointment_date}_${String(row.appointment_time).slice(0, 5)}`)
  }

  const days: OpenDay[] = []
  for (const schedule of schedules as { schedule_date: string; start_time: string; end_time: string }[]) {
    const date = schedule.schedule_date
    if (!isWorkingDay(doctor, date)) continue
    const times = slotTimes(schedule.start_time, schedule.end_time, type).filter(
      (time) => !taken.has(`${date}_${time}`) && (date !== today || minutesOf(time) >= minutes + SAME_DAY_LEAD_MINUTES),
    )
    if (times.length > 0) days.push({ date, times })
  }
  return days
}

type ClinicPatient = { id: string; full_name: string; phone: string | null; is_blacklisted: boolean | null }

const PATIENT_COLUMNS = "id, full_name, phone, is_blacklisted"

/** Karşılaştırma için ad: Türkçe küçük harf, tek boşluk. */
function foldName(name: string): string {
  return name.normalize("NFC").toLocaleLowerCase("tr").replace(/\s+/gu, " ").trim()
}

async function patientsByPhone(db: Db, phone: string): Promise<ClinicPatient[]> {
  const variants = phoneVariants(phone)
  if (variants.length === 0) return []
  const { data } = await db.from("patients").select(PATIENT_COLUMNS).in("phone", variants).limit(10)
  return data ?? []
}

async function rememberPatient(db: Db, user: AppUser, patientId: string | null): Promise<void> {
  if ((user.clinic_patient_id ?? null) === patientId) return
  await db.from("app_users").update({ clinic_patient_id: patientId }).eq("id", user.id)
}

/**
 * Hesabın klinik hasta kaydı; kesin değilse null.
 *   1. Daha önce bağlanmış kayıt hâlâ duruyorsa VE numarası hâlâ hesabın numarasıysa o.
 *      (Personel kayıttaki numarayı düzeltirse eski numaranın hesabı o kaydı artık göremez.)
 *   2. Numara tek bir kayda aitse o.
 *   3. Numarayı birden çok kayıt paylaşıyorsa içlerinden yalnızca biri etkin gebelikse o.
 */
export async function linkedPatient(db: Db, user: AppUser): Promise<ClinicPatient | null> {
  if (user.clinic_patient_id) {
    const { data } = await db.from("patients").select(PATIENT_COLUMNS).eq("id", user.clinic_patient_id).maybeSingle()
    if (data && phoneVariants(user.phone).includes(data.phone)) return data
    await rememberPatient(db, user, null)
  }

  const candidates = await patientsByPhone(db, user.phone)
  let found: ClinicPatient | null = null
  if (candidates.length === 1) {
    found = candidates[0]
  } else if (candidates.length > 1) {
    const { data: episodes } = await db
      .from("pregnancy_episodes")
      .select("patient_id")
      .in(
        "patient_id",
        candidates.map((p) => p.id),
      )
      .eq("status", "active")
    const pregnant = [...new Set(((episodes ?? []) as { patient_id: string }[]).map((e) => e.patient_id))]
    if (pregnant.length === 1) found = candidates.find((p) => p.id === pregnant[0]) ?? null
  }
  if (found) await rememberPatient(db, { ...user, clinic_patient_id: null }, found.id)
  return found
}

export type MyAppointment = { id: string; date: string; time: string; type: string | null }

/** Hastanın bugünden sonraki, iptal edilmemiş randevuları (nereden alınmış olursa olsun). */
export async function upcomingAppointments(db: Db, patientId: string, today: string): Promise<MyAppointment[]> {
  const { data } = await db
    .from("appointments")
    .select("id, appointment_date, appointment_time, appointment_type, status")
    .eq("patient_id", patientId)
    .gte("appointment_date", today)
    .in("status", ["scheduled", "confirmed"])
    .order("appointment_date")
    .limit(10)
  return ((data ?? []) as { id: string; appointment_date: string; appointment_time: string; appointment_type: string | null }[])
    .map((row) => ({ id: row.id, date: row.appointment_date, time: String(row.appointment_time).slice(0, 5), type: row.appointment_type }))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

export type BookingState = {
  /** Kayıt kesin değil: randevu alırken ad soyad sorulur. */
  needsName: boolean
  appointments: MyAppointment[]
}

export async function bookingState(db: Db, user: AppUser, now: Date = new Date()): Promise<BookingState> {
  const patient = await linkedPatient(db, user)
  if (!patient) return { needsName: true, appointments: [] }
  return { needsName: false, appointments: await upcomingAppointments(db, patient.id, istanbulNow(now).today) }
}

/** Tarihin haftası: Pazartesi–Pazar. */
function weekOf(date: string): { start: string; end: string } {
  const weekday = weekdayOf(date)
  const start = addDays(date, weekday === 0 ? -6 : 1 - weekday)
  return { start, end: addDays(start, 6) }
}

export type BookingRequest = { type: unknown; date: unknown; time: unknown; fetalCount?: unknown; fullName?: unknown }

export type BookingResult =
  | { ok: true; appointment: MyAppointment; patientName: string; phone: string }
  | { ok: false; status: number; error: string; needsName?: boolean; refresh?: boolean }

const FULL = "Bu saat az önce doldu. Lütfen başka bir saat seç."

/**
 * Randevuyu oluşturur. Bütün denetimler sunucudadır; tarayıcıdan gelen tarih ve saat,
 * günün programından yeniden üretilen listeyle karşılaştırılır.
 */
export async function bookAppointment(db: Db, user: AppUser, request: BookingRequest, now: Date = new Date()): Promise<BookingResult> {
  const { type, date, time } = request
  if (!isBookingType(type) || !isIsoDate(date) || typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) {
    return { ok: false, status: 400, error: "Geçersiz istek." }
  }
  const fetalCount = type === "ayrintili-fetal-ultrason" ? request.fetalCount : null
  if (type === "ayrintili-fetal-ultrason" && !isFetalCount(fetalCount)) {
    return { ok: false, status: 400, error: "Lütfen bebek sayısını seç." }
  }

  const doctor = await theDoctor(db)
  if (!doctor) return { ok: false, status: 503, error: "Şu anda randevu alınamıyor. Lütfen biraz sonra yeniden dene." }

  const { today, minutes } = istanbulNow(now)
  if (date < today || date > addDays(today, BOOKING_HORIZON_DAYS)) {
    return { ok: false, status: 400, error: "Bu tarih için randevu alınamıyor.", refresh: true }
  }

  const { data: schedules } = await db
    .from("doctor_schedules")
    .select("start_time, end_time")
    .eq("doctor_id", doctor.id)
    .eq("schedule_date", date)
    .eq("is_active", true)
    .eq("is_available", true)
    .limit(1)
  const schedule = schedules?.[0]
  if (!schedule || !isWorkingDay(doctor, date)) {
    return { ok: false, status: 409, error: "Bu gün yeni randevu alımına kapandı. Lütfen başka bir gün seç.", refresh: true }
  }
  if (!slotTimes(schedule.start_time, schedule.end_time, type).includes(time)) {
    return { ok: false, status: 400, error: "Bu saat için randevu alınamıyor.", refresh: true }
  }
  if (date === today && minutesOf(time) < minutes + SAME_DAY_LEAD_MINUTES) {
    return { ok: false, status: 409, error: "Bu saat geçti. Lütfen başka bir saat seç.", refresh: true }
  }

  // Kara liste: doğrulanmış numaranın herhangi bir kaydı. Neden reddedildiği söylenmez.
  const candidates = await patientsByPhone(db, user.phone)
  if (candidates.some((p) => p.is_blacklisted)) return { ok: false, status: 409, error: PUBLIC_REFUSAL_MESSAGE }

  let patient = await linkedPatient(db, user)
  if (patient?.is_blacklisted) return { ok: false, status: 409, error: PUBLIC_REFUSAL_MESSAGE }

  let created = false
  if (!patient) {
    const invalid = validatePublicBooking({ patient_name: request.fullName, appointment_type: type })
    if (invalid) return { ok: false, status: 400, error: "Lütfen adını ve soyadını yaz.", needsName: true }
    const fullName = String(request.fullName).normalize("NFC").replace(/\s+/gu, " ").trim()

    // Numarayı paylaşan kayıtlardan adı tutan tek kişi varsa o; yoksa yeni (geçici) kayıt.
    const sameName = candidates.filter((p) => foldName(p.full_name) === foldName(fullName))
    if (sameName.length === 1) {
      patient = sameName[0]
    } else {
      // Sekreterin hızlı kayıt açarken yaptığının aynısı: kimlik numarası ve doğum tarihi
      // muayenede tamamlanır (personel ekranı "Geçici Kayıt" olarak gösterir).
      const { data: inserted, error } = await db
        .from("patients")
        .insert({
          full_name: fullName,
          tc_no: `TEMP_${now.getTime()}`,
          phone: user.phone,
          date_of_birth: "1900-01-01",
          kvkk_approved: true,
        })
        .select(PATIENT_COLUMNS)
        .single()
      if (error || !inserted) return { ok: false, status: 500, error: "Randevu oluşturulamadı. Lütfen yeniden dene." }
      patient = inserted as ClinicPatient
      created = true
    }
  }

  // Yeni açılan kayıt, randevu oluşmadıysa geri alınır. Aynı anda gelen başka bir istek bu
  // kayda randevu yazdıysa kayıt silinmez (silinseydi o randevu da zincirleme silinirdi).
  const undoPatient = async () => {
    if (!created || !patient) return
    const { data: used } = await db.from("appointments").select("id").eq("patient_id", patient.id).limit(1)
    if (used && used.length > 0) return
    await db.from("patients").delete().eq("id", patient.id)
  }

  const week = weekOf(date)
  const { data: sameWeek } = await db
    .from("appointments")
    .select("id, appointment_date, status")
    .eq("patient_id", patient.id)
    .gte("appointment_date", week.start)
    .lte("appointment_date", week.end)
    .neq("status", "cancelled")
    .limit(1)
  if (sameWeek && sameWeek.length > 0) {
    await undoPatient()
    return {
      ok: false,
      status: 409,
      error: `Bu hafta zaten bir randevun var (${formatDayTr(sameWeek[0].appointment_date)}). Aynı haftaya ikinci randevu için sekreteri ara: ${SECRETARY}`,
    }
  }

  const { data: appointment, error: insertError } = await db
    .from("appointments")
    .insert({
      patient_id: patient.id,
      doctor_id: doctor.id,
      appointment_date: date,
      appointment_time: time,
      status: "confirmed",
      confirmation_status: "pending",
      confirmation_token: generateUrlToken(),
      appointment_type: type,
      fetal_bebek_sayisi: fetalCount ?? null,
      notes: null,
    })
    .select("id")
    .single()
  if (insertError || !appointment) {
    await undoPatient()
    // 23505: aynı doktor, gün ve saatte randevu var (tekillik kuralı). Yarışı veritabanı çözer.
    if (insertError?.code === "23505") return { ok: false, status: 409, error: FULL, refresh: true }
    return { ok: false, status: 500, error: "Randevu oluşturulamadı. Lütfen yeniden dene." }
  }

  // Personel ekranı her randevuda bir form satırı bekler (sitedeki yolla aynı alanlar).
  await db
    .from("appointment_forms")
    .insert({ appointment_id: appointment.id, form_data: { appointment_type: type, referral_doctor: null, medical_documents: {} } })

  await rememberPatient(db, user, patient.id)

  return {
    ok: true,
    appointment: { id: appointment.id, date, time, type },
    patientName: patient.full_name,
    phone: user.phone,
  }
}

export type CancelResult =
  | { ok: true; details: { patient_name: string; patient_phone: string; appointment_date: string; appointment_time: string } }
  | { ok: false; status: number; error: string }

/**
 * Hastanın kendi randevusunu iptal eder. SMS bağlantısından iptalle aynı sonuç: randevu
 * silinmez, "cancelled" olur; saat takvimde dolu kalır ve yalnızca personel yeniden verir.
 * Kanıt kaydı (kim, ne zaman, hangi cihazdan) değiştirilemez denetim tablosuna yazılır.
 */
export async function cancelAppointment(
  db: Db,
  user: AppUser,
  appointmentId: string,
  evidence: { ipAddress: string | null; userAgent: string | null },
  now: Date = new Date(),
): Promise<CancelResult> {
  const missing: CancelResult = { ok: false, status: 404, error: "Randevu bulunamadı." }
  const patient = await linkedPatient(db, user)
  if (!patient) return missing

  const { data: row } = await db
    .from("appointments")
    .select("id, appointment_date, appointment_time, status")
    .eq("id", appointmentId)
    .eq("patient_id", patient.id)
    .maybeSingle()
  if (!row || (row.status !== "scheduled" && row.status !== "confirmed")) return missing

  const { today, minutes } = istanbulNow(now)
  const time = String(row.appointment_time).slice(0, 5)
  if (row.appointment_date < today || (row.appointment_date === today && minutesOf(time) <= minutes)) {
    return { ok: false, status: 409, error: "Geçmiş randevu iptal edilemez." }
  }

  // Güncelleme okunan duruma bağlıdır: iki istek aynı anda gelirse yalnızca biri iptal eder.
  const occurredAt = now.toISOString()
  const { data: changed, error } = await db
    .from("appointments")
    .update({ status: "cancelled", confirmation_status: "cancelled", updated_at: occurredAt })
    .eq("id", row.id)
    .eq("patient_id", patient.id)
    .eq("status", row.status)
    .select("id")
  if (error) return { ok: false, status: 500, error: "Randevu iptal edilemedi. Lütfen yeniden dene." }
  if (!changed || changed.length === 0) return missing

  const eventHash = createHash("sha256")
    .update([row.id, "response_cancelled", occurredAt, evidence.ipAddress ?? "", evidence.userAgent ?? ""].join("|"))
    .digest("hex")
  const audit = await db.from("appointment_audit_events").insert({
    patient_id: patient.id,
    appointment_id: row.id,
    event_type: "response_cancelled",
    occurred_at: occurredAt,
    patient_name_snapshot: patient.full_name || "Bilinmeyen Hasta",
    patient_phone_snapshot: user.phone,
    appointment_date_snapshot: row.appointment_date,
    appointment_time_snapshot: row.appointment_time,
    response_type: "cancelled",
    channel: "hasta_uygulamasi",
    ip_address: evidence.ipAddress,
    user_agent: evidence.userAgent,
    event_hash: eventHash,
  })
  if (audit.error) console.error("App cancellation audit failed:", audit.error.message)

  return {
    ok: true,
    details: {
      patient_name: patient.full_name,
      patient_phone: user.phone,
      appointment_date: row.appointment_date,
      appointment_time: time,
    },
  }
}
