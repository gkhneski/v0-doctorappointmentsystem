import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

// Yol dosyaları birim testine uygun değil (çok sayıda dış bağımlılık); bu bekçi, güvenlik
// kararlarının yol dosyalarından sessizce çıkarılmasını yakalar. Davranış lib/ testlerindedir.
const booking = readFileSync("app/api/appointments/route.ts", "utf8")
const verify = readFileSync("app/api/appointments/verify/route.ts", "utf8")
const linkSubmit = readFileSync("app/api/appointment-link/submit/route.ts", "utf8")

describe("herkese açık randevu yolu", () => {
  it("hastanın varlığını ya da mevcut randevusunu açıklamaz", () => {
    expect(booking).not.toContain("duplicate_appointment")
    expect(booking).not.toContain("existing_appointment")
    expect(booking).toContain("PUBLIC_REFUSAL_MESSAGE")
  })

  it("kodu yanıta yalnızca smsOutcome karar verirse koyar", () => {
    expect(booking).toContain("smsOutcome(")
    expect(booking).not.toMatch(/devCode\s*=\s*verificationCode/)
  })

  it("doğrulanmamış randevuları işaretler ve temizler", () => {
    expect(booking).toContain("initialStatus(")
    expect(booking).toContain("purgeStaleUnverified(")
  })

  it("mevcut hasta kaydını kod doğrulanmadan güncellemez", () => {
    expect(booking).toContain("defer: !isVerifiedAdmin")
    expect(booking).not.toContain("resolvePatientId(")
  })
})

describe("kod doğrulama yolu", () => {
  it("deneme sayısını sınırlar", () => {
    expect(verify).toContain("checkRateLimitDetailed(`verify:appt:")
  })

  it("bekleyen hasta değişikliğini doğrulamadan sonra uygular", () => {
    expect(verify).toContain("applyPendingPatient(")
  })
})

describe("form bağlantısı yolu", () => {
  it("istemcinin bekleyen hasta değişikliği yazmasına izin vermez", () => {
    expect(linkSubmit).toContain("PENDING_PATIENT_KEY")
  })
})
