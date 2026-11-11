import { describe, it, expect } from "vitest"
import { resolvePatient, resolvePatientId, applyPendingPatient } from "@/lib/resolve-patient"
import { createFakeSupabase } from "./helpers/fake-supabase"

const existing = () => ({
  id: "p1",
  tc_no: "11111111110",
  full_name: "Eski Ad",
  phone: "05321111111",
  date_of_birth: "1990-01-01",
  kvkk_approved: false,
  created_at: "2025-01-01T00:00:00Z",
})

const input = {
  tc_no: "11111111110",
  full_name: "Yeni Ad",
  phone: "0532 999 99 99",
  date_of_birth: "1991-02-02",
  kvkk_approved: true,
}

describe("resolvePatient", () => {
  it("personel yolunda (defer:false) TC eşleşen kaydı hemen günceller", async () => {
    const db = createFakeSupabase({ patients: [existing()] })
    const result = await resolvePatient(db, input, { defer: false })
    expect(result).toEqual({ id: "p1", created: false, pending: null })
    expect(db.tables.patients[0]).toMatchObject({ full_name: "Yeni Ad", phone: "05329999999" })
  })

  it("resolvePatientId eski davranışı korur", async () => {
    const db = createFakeSupabase({ patients: [existing()] })
    expect(await resolvePatientId(db, input)).toBe("p1")
    expect(db.tables.patients[0].full_name).toBe("Yeni Ad")
  })

  it("herkese açık yolda (defer:true) TC eşleşen kayda dokunmaz, değişikliği bekletir", async () => {
    const db = createFakeSupabase({ patients: [existing()] })
    const result = await resolvePatient(db, input, { defer: true })
    expect(db.tables.patients[0]).toEqual(existing())
    expect(result).toEqual({
      id: "p1",
      created: false,
      pending: { full_name: "Yeni Ad", phone: "05329999999", date_of_birth: "1991-02-02", kvkk_approved: true },
    })
  })

  it("herkese açık yolda aynı telefonlu geçici kayda dokunmaz, yükseltmeyi bekletir", async () => {
    const temp = { ...existing(), tc_no: "TEMP_123", phone: "05329999999" }
    const db = createFakeSupabase({ patients: [{ ...temp }] })
    const result = await resolvePatient(db, input, { defer: true })
    expect(db.tables.patients).toEqual([temp])
    expect(result).toEqual({
      id: "p1",
      created: false,
      pending: { tc_no: "11111111110", full_name: "Yeni Ad", date_of_birth: "1991-02-02", kvkk_approved: true },
    })
  })

  it("personel yolunda geçici kaydı hemen yükseltir", async () => {
    const db = createFakeSupabase({ patients: [{ ...existing(), tc_no: "TEMP_123", phone: "05329999999" }] })
    const result = await resolvePatient(db, input, { defer: false })
    expect(result).toEqual({ id: "p1", created: false, pending: null })
    expect(db.tables.patients[0]).toMatchObject({ tc_no: "11111111110", full_name: "Yeni Ad" })
  })

  it("eşleşme yoksa yeni kayıt açar", async () => {
    const db = createFakeSupabase({ patients: [] })
    const result = await resolvePatient(db, input, { defer: true })
    expect(result).toMatchObject({ created: true, pending: null })
    expect(db.tables.patients).toHaveLength(1)
    expect(db.tables.patients[0]).toMatchObject({ id: result.id, tc_no: "11111111110", phone: "05329999999" })
  })
})

describe("applyPendingPatient", () => {
  it("bekleyen değişikliği hastaya uygular ve formdan siler", async () => {
    const db = createFakeSupabase({
      patients: [existing()],
      appointments: [{ id: "a1", patient_id: "p1" }],
      appointment_forms: [
        {
          id: "f1",
          appointment_id: "a1",
          form_data: { referral_doctor: "x", _pending_patient: { full_name: "Yeni Ad", phone: "05329999999", evil: 1 } },
        },
      ],
    })
    await applyPendingPatient(db, "a1")
    expect(db.tables.patients[0]).toMatchObject({ full_name: "Yeni Ad", phone: "05329999999", tc_no: "11111111110" })
    expect(db.tables.patients[0]).not.toHaveProperty("evil")
    expect(db.tables.appointment_forms[0].form_data).toEqual({ referral_doctor: "x" })
  })

  it("bekleyen değişiklik yoksa hiçbir şeyi değiştirmez", async () => {
    const db = createFakeSupabase({
      patients: [existing()],
      appointments: [{ id: "a1", patient_id: "p1" }],
      appointment_forms: [{ id: "f1", appointment_id: "a1", form_data: { referral_doctor: "x" } }],
    })
    await applyPendingPatient(db, "a1")
    expect(db.tables.patients[0]).toEqual(existing())
    expect(db.tables.appointment_forms[0].form_data).toEqual({ referral_doctor: "x" })
  })
})
