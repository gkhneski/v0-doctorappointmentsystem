import { describe, it, expect } from "vitest"
import { createFakeSupabase } from "../helpers/fake-supabase"
import { slotTimes, weekdayOf, formatDayTr } from "@/lib/anne/booking-types"
import {
  bookAppointment,
  bookingState,
  cancelAppointment,
  istanbulNow,
  linkedPatient,
  listOpenDays,
} from "@/lib/anne/clinic-booking"
import type { AppUser } from "@/lib/anne/auth"

// 16 Kasım 2026 Pazartesi, İstanbul 10:00 (UTC 07:00).
const NOW = new Date("2026-11-16T07:00:00Z")
const DOCTOR = "doc-1"
const EVIDENCE = { ipAddress: "1.2.3.4", userAgent: "test" }

const user = (over: Partial<AppUser> = {}): AppUser => ({
  id: "u1",
  phone: "05321234567",
  display_name: "Ayşe",
  lmp_date: "2026-06-01",
  due_date: "2027-03-08",
  due_date_source: "lmp",
  onboarded_at: "2026-11-10T08:00:00Z",
  clinic_approved_at: null,
  clinic_patient_id: null,
  created_at: "2026-11-10T08:00:00Z",
  ...over,
})

const hours = { enabled: true, start: "11:30", end: "17:45" }

function db(over: Record<string, unknown[]> = {}, failOn?: (table: string, op: string) => boolean | Record<string, unknown>) {
  return createFakeSupabase(
    {
      doctors: [
        {
          id: DOCTOR,
          name: "Prof. Dr. Eray Çalışkan",
          working_hours: { monday: hours, tuesday: hours, wednesday: hours, thursday: hours, friday: hours, saturday: { enabled: false }, sunday: { enabled: false } },
        },
      ],
      doctor_schedules: [
        { doctor_id: DOCTOR, schedule_date: "2026-11-16", start_time: "09:00:00", end_time: "11:00:00", is_available: true, is_active: true },
        { doctor_id: DOCTOR, schedule_date: "2026-11-17", start_time: "13:30:00", end_time: "14:15:00", is_available: true, is_active: true },
        { doctor_id: DOCTOR, schedule_date: "2026-11-18", start_time: "11:30:00", end_time: "12:00:00", is_available: false, is_active: true },
        { doctor_id: DOCTOR, schedule_date: "2026-11-21", start_time: "11:30:00", end_time: "12:00:00", is_available: true, is_active: true },
        { doctor_id: DOCTOR, schedule_date: "2026-11-24", start_time: "11:30:00", end_time: "12:00:00", is_available: true, is_active: true },
      ],
      patients: [{ id: "p1", full_name: "AYŞE YILMAZ", phone: "05321234567", is_blacklisted: false }],
      pregnancy_episodes: [],
      appointments: [],
      appointment_forms: [],
      appointment_audit_events: [],
      app_users: [{ id: "u1", phone: "05321234567", clinic_patient_id: null }],
      ...over,
    },
    failOn,
  )
}

describe("saat ızgarası", () => {
  it("15 dakikalık saatler üretir; başlangıcı yukarı, bitişi aşağı yuvarlar ve bitişi dahil eder", () => {
    expect(slotTimes("13:30:00", "14:15:00", "gebelik-takibi")).toEqual(["13:30", "13:45", "14:00", "14:15"])
    expect(slotTimes("11:40", "12:10", "kontrol-takip")).toEqual(["11:45", "12:00"])
  })

  it("ayrıntılı ultrasonda yalnızca tam ve buçukları verir", () => {
    expect(slotTimes("13:30:00", "14:15:00", "ayrintili-fetal-ultrason")).toEqual(["13:30", "14:00"])
  })

  it("haftanın gününü saat diliminden bağımsız bulur", () => {
    expect(weekdayOf("2026-11-16")).toBe(1)
    expect(formatDayTr("2026-11-20")).toBe("20 Kasım Cuma")
  })

  it("İstanbul saatini verir", () => {
    expect(istanbulNow(NOW)).toEqual({ today: "2026-11-16", minutes: 600 })
    expect(istanbulNow(new Date("2026-11-16T21:30:00Z"))).toEqual({ today: "2026-11-17", minutes: 30 })
  })
})

describe("boş saatler", () => {
  it("kapalı günü, hafta sonunu, dolu ve geçmiş saatleri göstermez", async () => {
    const store = db({
      appointments: [
        { id: "a1", doctor_id: DOCTOR, patient_id: "px", appointment_date: "2026-11-17", appointment_time: "13:45:00", status: "confirmed" },
        // İptal edilmiş randevunun saati de doludur: yalnızca personel yeniden verir.
        { id: "a2", doctor_id: DOCTOR, patient_id: "px", appointment_date: "2026-11-17", appointment_time: "14:15:00", status: "cancelled" },
      ],
    })
    const days = await listOpenDays(store, "gebelik-takibi", NOW)
    expect(days).toEqual([
      // Bugün 10:00: en erken 10:30.
      { date: "2026-11-16", times: ["10:30", "10:45", "11:00"] },
      { date: "2026-11-17", times: ["13:30", "14:00"] },
      // 18'i kapalı, 21'i Cumartesi.
      { date: "2026-11-24", times: ["11:30", "11:45", "12:00"] },
    ])
  })

  it("boş saati kalmayan günü listeden çıkarır", async () => {
    const store = db({
      appointments: ["13:30:00", "14:00:00"].map((t, i) => ({
        id: `a${i}`,
        doctor_id: DOCTOR,
        patient_id: "px",
        appointment_date: "2026-11-17",
        appointment_time: t,
        status: "confirmed",
      })),
    })
    const days = await listOpenDays(store, "ayrintili-fetal-ultrason", NOW)
    expect(days.map((d) => d.date)).toEqual(["2026-11-16", "2026-11-24"])
  })
})

describe("hesabın klinik kaydı", () => {
  it("numara tek kayda aitse onu bağlar ve hesaba yazar", async () => {
    const store = db()
    expect((await linkedPatient(store, user()))?.id).toBe("p1")
    expect(store.tables.app_users[0].clinic_patient_id).toBe("p1")
  })

  it("numarayı paylaşan kayıtlardan yalnızca tek gebe olanı bağlar; belirsizse bağlamaz", async () => {
    const shared = [
      { id: "p1", full_name: "AYŞE YILMAZ", phone: "05321234567", is_blacklisted: false },
      { id: "p2", full_name: "FATMA YILMAZ", phone: "05321234567", is_blacklisted: false },
    ]
    expect(await linkedPatient(db({ patients: shared }), user())).toBeNull()
    const store = db({ patients: shared, pregnancy_episodes: [{ patient_id: "p2", status: "active" }] })
    expect((await linkedPatient(store, user()))?.id).toBe("p2")
  })

  it("bağlı kayıt silinmişse bağlantıyı temizler ve numaradan yeniden bulur", async () => {
    const store = db({ app_users: [{ id: "u1", phone: "05321234567", clinic_patient_id: "silinmis" }] })
    expect((await linkedPatient(store, user({ clinic_patient_id: "silinmis" })))?.id).toBe("p1")
    expect(store.tables.app_users[0].clinic_patient_id).toBe("p1")
  })

  it("bağlı kaydın numarası değiştiyse (personel düzeltti) eski numaranın hesabı o kaydı artık göremez", async () => {
    const store = db({
      patients: [{ id: "p1", full_name: "AYŞE YILMAZ", phone: "05329999999", is_blacklisted: false }],
      app_users: [{ id: "u1", phone: "05321234567", clinic_patient_id: "p1" }],
    })
    expect(await linkedPatient(store, user({ clinic_patient_id: "p1" }))).toBeNull()
    expect(store.tables.app_users[0].clinic_patient_id).toBeNull()
  })

  it("yalnızca kendi kaydının yaklaşan, iptal edilmemiş randevularını gösterir", async () => {
    const store = db({
      appointments: [
        { id: "a1", doctor_id: DOCTOR, patient_id: "p1", appointment_date: "2026-11-24", appointment_time: "11:30:00", appointment_type: "gebelik-takibi", status: "confirmed" },
        { id: "a2", doctor_id: DOCTOR, patient_id: "p1", appointment_date: "2026-11-10", appointment_time: "11:30:00", appointment_type: "gebelik-takibi", status: "completed" },
        { id: "a3", doctor_id: DOCTOR, patient_id: "p1", appointment_date: "2026-11-25", appointment_time: "11:30:00", appointment_type: "kontrol-takip", status: "cancelled" },
        { id: "a4", doctor_id: DOCTOR, patient_id: "baska", appointment_date: "2026-11-24", appointment_time: "12:00:00", appointment_type: "gebelik-takibi", status: "confirmed" },
      ],
    })
    expect(await bookingState(store, user(), NOW)).toEqual({
      needsName: false,
      appointments: [{ id: "a1", date: "2026-11-24", time: "11:30", type: "gebelik-takibi" }],
    })
  })
})

describe("randevu alma", () => {
  const request = { type: "gebelik-takibi", date: "2026-11-17", time: "13:30" }

  it("tanınan hastaya kod sormadan onaylı randevu açar", async () => {
    const store = db()
    const result = await bookAppointment(store, user(), request, NOW)
    expect(result).toMatchObject({ ok: true, appointment: { date: "2026-11-17", time: "13:30", type: "gebelik-takibi" }, patientName: "AYŞE YILMAZ" })
    expect(store.tables.appointments[0]).toMatchObject({
      patient_id: "p1",
      doctor_id: DOCTOR,
      appointment_date: "2026-11-17",
      appointment_time: "13:30",
      status: "confirmed",
      confirmation_status: "pending",
      appointment_type: "gebelik-takibi",
      fetal_bebek_sayisi: null,
    })
    expect(store.tables.appointments[0].confirmation_token.length).toBeGreaterThan(20)
    expect(store.tables.appointment_forms).toHaveLength(1)
    expect(store.tables.patients).toHaveLength(1)
    expect(store.tables.app_users[0].clinic_patient_id).toBe("p1")
  })

  it("ızgarada olmayan, geçmiş ya da kapalı güne ait saati reddeder", async () => {
    const store = db()
    expect(await bookAppointment(store, user(), { ...request, time: "13:40" }, NOW)).toMatchObject({ ok: false, status: 400 })
    expect(await bookAppointment(store, user(), { ...request, time: "18:00" }, NOW)).toMatchObject({ ok: false, status: 400 })
    expect(await bookAppointment(store, user(), { ...request, date: "2026-11-16", time: "10:15" }, NOW)).toMatchObject({ ok: false, status: 409 })
    expect(await bookAppointment(store, user(), { ...request, date: "2026-11-18", time: "11:30" }, NOW)).toMatchObject({ ok: false, status: 409 })
    expect(await bookAppointment(store, user(), { ...request, date: "2026-11-21", time: "11:30" }, NOW)).toMatchObject({ ok: false, status: 409 })
    expect(await bookAppointment(store, user(), { ...request, date: "2026-11-15" }, NOW)).toMatchObject({ ok: false, status: 400 })
    expect(await bookAppointment(store, user(), { ...request, type: "asilama-tup-bebek" }, NOW)).toMatchObject({ ok: false, status: 400 })
    expect(store.tables.appointments).toHaveLength(0)
  })

  it("ayrıntılı ultrasonda bebek sayısını ister ve yalnızca tam/buçuk saat verir", async () => {
    const store = db()
    const fetal = { type: "ayrintili-fetal-ultrason", date: "2026-11-17", time: "13:30" }
    expect(await bookAppointment(store, user(), fetal, NOW)).toMatchObject({ ok: false, status: 400 })
    expect(await bookAppointment(store, user(), { ...fetal, time: "13:45", fetalCount: "tek" }, NOW)).toMatchObject({ ok: false, status: 400 })
    expect(await bookAppointment(store, user(), { ...fetal, fetalCount: "ikiz" }, NOW)).toMatchObject({ ok: true })
    expect(store.tables.appointments[0].fetal_bebek_sayisi).toBe("ikiz")
  })

  it("aynı hafta ikinci randevuyu vermez; iptal edilmiş olan sayılmaz", async () => {
    const existing = { id: "a1", doctor_id: DOCTOR, patient_id: "p1", appointment_date: "2026-11-20", appointment_time: "12:00:00", status: "confirmed" }
    const blocked = await bookAppointment(db({ appointments: [existing] }), user(), request, NOW)
    expect(blocked).toMatchObject({ ok: false, status: 409 })
    expect((blocked as { error: string }).error).toContain("20 Kasım Cuma")

    const store = db({ appointments: [{ ...existing, status: "cancelled" }] })
    expect(await bookAppointment(store, user(), request, NOW)).toMatchObject({ ok: true })
  })

  it("saat başkasınca alındıysa (tekillik çakışması) dolu der ve yeni açtığı hasta kaydını geri alır", async () => {
    const store = db({ patients: [] }, (table, op) => (table === "appointments" && op === "insert" ? { code: "23505", message: "duplicate" } : false))
    const result = await bookAppointment(store, user(), { ...request, fullName: "Zeynep Kaya" }, NOW)
    expect(result).toMatchObject({ ok: false, status: 409, refresh: true })
    expect(store.tables.patients).toHaveLength(0)
  })

  it("kara listedeki numaraya nedenini söylemeden randevu vermez", async () => {
    const store = db({ patients: [{ id: "p1", full_name: "AYŞE YILMAZ", phone: "05321234567", is_blacklisted: true }] })
    const result = await bookAppointment(store, user(), request, NOW)
    expect(result).toMatchObject({ ok: false, status: 409 })
    expect((result as { error: string }).error).toContain("sekreterimizi arayın")
    expect(store.tables.appointments).toHaveLength(0)
  })

  it("kayıtlı olmayan numarada ad ister, geçici hasta kaydı açar ve hesabı ona bağlar", async () => {
    const store = db({ patients: [] })
    expect(await bookAppointment(store, user(), request, NOW)).toMatchObject({ ok: false, status: 400, needsName: true })
    expect(await bookAppointment(store, user(), { ...request, fullName: "<b>x</b>" }, NOW)).toMatchObject({ ok: false, needsName: true })
    expect(store.tables.patients).toHaveLength(0)

    expect(await bookAppointment(store, user(), { ...request, fullName: "  Zeynep   Kaya " }, NOW)).toMatchObject({ ok: true, patientName: "Zeynep Kaya" })
    expect(store.tables.patients[0]).toMatchObject({ full_name: "Zeynep Kaya", phone: "05321234567", date_of_birth: "1900-01-01", kvkk_approved: true })
    expect(store.tables.patients[0].tc_no).toMatch(/^TEMP_\d+$/)
    expect(store.tables.app_users[0].clinic_patient_id).toBe(store.tables.patients[0].id)
  })

  it("numarayı paylaşan kayıtlardan adı tutanı kullanır, yeni kayıt açmaz", async () => {
    const store = db({
      patients: [
        { id: "p1", full_name: "AYŞE YILMAZ", phone: "05321234567", is_blacklisted: false },
        { id: "p2", full_name: "FATMA YILMAZ", phone: "05321234567", is_blacklisted: false },
      ],
    })
    expect(await bookAppointment(store, user(), { ...request, fullName: "fatma yılmaz" }, NOW)).toMatchObject({ ok: true })
    expect(store.tables.patients).toHaveLength(2)
    expect(store.tables.appointments[0].patient_id).toBe("p2")
  })
})

describe("randevu iptali", () => {
  const appointment = (over: Record<string, unknown> = {}) => ({
    id: "a1",
    doctor_id: DOCTOR,
    patient_id: "p1",
    appointment_date: "2026-11-24",
    appointment_time: "11:30:00",
    appointment_type: "gebelik-takibi",
    status: "confirmed",
    confirmation_status: "confirmed",
    ...over,
  })

  it("kendi randevusunu iptal eder: satır silinmez, kanıt kaydı yazılır", async () => {
    const store = db({ appointments: [appointment()] })
    const result = await cancelAppointment(store, user(), "a1", EVIDENCE, NOW)
    expect(result).toMatchObject({ ok: true, details: { patient_name: "AYŞE YILMAZ", appointment_date: "2026-11-24", appointment_time: "11:30" } })
    expect(store.tables.appointments[0]).toMatchObject({ status: "cancelled", confirmation_status: "cancelled" })
    expect(store.tables.appointment_audit_events[0]).toMatchObject({
      appointment_id: "a1",
      patient_id: "p1",
      event_type: "response_cancelled",
      response_type: "cancelled",
      ip_address: "1.2.3.4",
    })
    // İkinci istek aynı randevuyu yeniden iptal edemez.
    expect(await cancelAppointment(store, user(), "a1", EVIDENCE, NOW)).toMatchObject({ ok: false, status: 404 })
    expect(store.tables.appointment_audit_events).toHaveLength(1)
  })

  it("başkasının randevusunu ve geçmiş randevuyu iptal etmez", async () => {
    const store = db({
      appointments: [appointment({ patient_id: "baska" }), appointment({ id: "a2", appointment_date: "2026-11-16", appointment_time: "09:30:00" })],
    })
    expect(await cancelAppointment(store, user(), "a1", EVIDENCE, NOW)).toMatchObject({ ok: false, status: 404 })
    expect(await cancelAppointment(store, user(), "a2", EVIDENCE, NOW)).toMatchObject({ ok: false, status: 409 })
    expect(store.tables.appointments.every((a: { status: string }) => a.status === "confirmed")).toBe(true)
  })
})
