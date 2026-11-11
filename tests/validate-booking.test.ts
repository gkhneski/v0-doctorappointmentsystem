import { describe, it, expect } from "vitest"
import { validatePublicBooking } from "@/lib/validate-booking"

// components/appointment-type-selector.tsx içindeki türler + sihirbazın varsayılanı ("ilk-randevu")
// + canlı veride son aylarda görülen diğer değerler.
const PUBLIC_TYPES: string[] = [
  "asilama-tup-bebek",
  "ayrintili-fetal-ultrason",
  "gebelik-takibi",
  "gebelik-istemi-infertilite",
  "jinekolojik-muayene",
  "kontrol-takip",
  "acil-durum",
  "ilk-randevu",
  "ilk-muayene",
  "diger",
]

const NAME_ERROR = "Lütfen adınızı ve soyadınızı yalnızca harflerle yazın."
const TYPE_ERROR = "Geçersiz randevu türü."

const check = (name: unknown, type: unknown = "kontrol-takip") =>
  validatePublicBooking({ patient_name: name, appointment_type: type })

describe("validatePublicBooking", () => {
  it.each(["Ayşe Gül Öztürk", "Zeynep-Nur O'Brien", "İ. Çağla Ş.", "Élodie Müller", "  Fatma Yılmaz  ", "ŞULE IŞIK"])(
    "geçerli adı kabul eder: %s",
    (name) => expect(check(name)).toBeNull(),
  )

  it.each(PUBLIC_TYPES)("mevcut randevu türünü kabul eder: %s", (type) => expect(check("Ayşe Yılmaz", type)).toBeNull())

  it.each(["<img src=x onerror=alert(1)>", "Ayşe<script>", "A", "x".repeat(81), "12345", "", "   ", "Ayşe (eşi Ali)"])(
    "geçersiz adı reddeder: %s",
    (name) => expect(check(name)).toBe(NAME_ERROR),
  )

  it.each([null, undefined, 42, {}])("metin olmayan adı reddeder: %s", (name) => expect(check(name)).toBe(NAME_ERROR))

  it.each(["<b>x</b>", "", "x".repeat(81), null, undefined, 7, 'a"b'])("geçersiz türü reddeder: %s", (type) =>
    expect(validatePublicBooking({ patient_name: "Ayşe Yılmaz", appointment_type: type })).toBe(TYPE_ERROR),
  )

  it("ad hatası tür hatasından önce döner", () => {
    expect(check("<x>", "<y>")).toBe(NAME_ERROR)
  })
})
