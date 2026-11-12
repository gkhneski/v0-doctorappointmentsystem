import { describe, it, expect } from "vitest"
import {
  addDays,
  dateOfWeekStart,
  daysBetween,
  dueDateFromLmp,
  formatGestationalAge,
  gestationalAge,
  isIsoDate,
  lmpFromDueDate,
  resolvePregnancyStart,
  todayInIstanbul,
} from "@/lib/anne/pregnancy"

describe("tarih yardımcıları", () => {
  it("geçerli günü kabul eder, olmayan günü reddeder", () => {
    expect(isIsoDate("2026-11-12")).toBe(true)
    expect(isIsoDate("2026-02-30")).toBe(false)
    expect(isIsoDate("2026-13-01")).toBe(false)
    expect(isIsoDate("12.11.2026")).toBe(false)
    expect(isIsoDate(20261112)).toBe(false)
    expect(isIsoDate("")).toBe(false)
  })

  it("gün ekler; ay, yıl ve artık yıl sınırlarını doğru geçer", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29")
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
    expect(daysBetween("2026-01-01", "2026-12-31")).toBe(364)
  })

  it("yaz saati geçişinde gün kaydırmaz", () => {
    // Avrupa'da saatler 25 Ekim 2026'da geri alınır; 24 saatlik fark varsayımı burada bozulur.
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2)
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30")
  })

  it("İstanbul gününü verir: UTC 21:30, İstanbul'da ertesi gündür", () => {
    expect(todayInIstanbul(new Date("2026-11-12T21:30:00Z"))).toBe("2026-11-13")
    expect(todayInIstanbul(new Date("2026-11-12T20:59:00Z"))).toBe("2026-11-12")
  })
})

describe("tahmini doğum tarihi", () => {
  it("son adet tarihine 280 gün ekler", () => {
    expect(dueDateFromLmp("2026-01-01")).toBe("2026-10-08")
    expect(lmpFromDueDate("2026-10-08")).toBe("2026-01-01")
  })
})

describe("resolvePregnancyStart", () => {
  const today = "2026-11-12"

  it("son adet tarihinden ikisini de üretir", () => {
    expect(resolvePregnancyStart({ lmp: "2026-08-20" }, today)).toEqual({
      ok: true,
      lmp: "2026-08-20",
      dueDate: "2027-05-27",
      source: "lmp",
    })
  })

  it("tahmini doğum tarihinden son adet tarihini geri hesaplar", () => {
    expect(resolvePregnancyStart({ dueDate: "2027-05-27" }, today)).toEqual({
      ok: true,
      lmp: "2026-08-20",
      dueDate: "2027-05-27",
      source: "due",
    })
  })

  it("ikisi birden ya da hiçbiri verilirse reddeder", () => {
    expect(resolvePregnancyStart({}, today).ok).toBe(false)
    expect(resolvePregnancyStart({ lmp: "", dueDate: "" }, today).ok).toBe(false)
    expect(resolvePregnancyStart({ lmp: "2026-08-20", dueDate: "2027-05-27" }, today).ok).toBe(false)
  })

  it("geçersiz tarihi reddeder", () => {
    expect(resolvePregnancyStart({ lmp: "2026-02-30" }, today).ok).toBe(false)
    expect(resolvePregnancyStart({ lmp: 5 }, today).ok).toBe(false)
  })

  it("gelecekteki son adet tarihini reddeder, bugünü kabul eder", () => {
    expect(resolvePregnancyStart({ lmp: "2026-11-13" }, today).ok).toBe(false)
    expect(resolvePregnancyStart({ lmp: today }, today).ok).toBe(true)
  })

  it("44 haftadan eski gebeliği reddeder, tam 44 haftayı kabul eder", () => {
    expect(resolvePregnancyStart({ lmp: addDays(today, -308) }, today).ok).toBe(true)
    expect(resolvePregnancyStart({ lmp: addDays(today, -309) }, today).ok).toBe(false)
  })

  it("40 haftadan uzak ya da 4 haftadan fazla geçmiş doğum tarihini reddeder", () => {
    expect(resolvePregnancyStart({ dueDate: addDays(today, 280) }, today).ok).toBe(true)
    expect(resolvePregnancyStart({ dueDate: addDays(today, 281) }, today).ok).toBe(false)
    expect(resolvePregnancyStart({ dueDate: addDays(today, -28) }, today).ok).toBe(true)
    expect(resolvePregnancyStart({ dueDate: addDays(today, -29) }, today).ok).toBe(false)
  })
})

describe("gestationalAge", () => {
  const lmp = "2026-08-20"

  it("hafta ve günü hesaplar", () => {
    expect(gestationalAge(lmp, "2026-11-12")).toMatchObject({ days: 84, weeks: 12, extraDays: 0, daysToDue: 196 })
    expect(gestationalAge(lmp, "2026-11-15")).toMatchObject({ weeks: 12, extraDays: 3 })
    expect(gestationalAge(lmp, lmp)).toMatchObject({ days: 0, weeks: 0, extraDays: 0, progressPercent: 0 })
  })

  it("üç aylık dönem sınırları: 14. ve 28. haftanın başı", () => {
    expect(gestationalAge(lmp, addDays(lmp, 13 * 7 + 6))!.trimester).toBe(1)
    expect(gestationalAge(lmp, addDays(lmp, 14 * 7))!.trimester).toBe(2)
    expect(gestationalAge(lmp, addDays(lmp, 27 * 7 + 6))!.trimester).toBe(2)
    expect(gestationalAge(lmp, addDays(lmp, 28 * 7))!.trimester).toBe(3)
  })

  it("doğum tarihi geçince kalan gün eksiye düşer, ilerleme 100'de kalır", () => {
    expect(gestationalAge(lmp, addDays(lmp, 290))).toMatchObject({ weeks: 41, daysToDue: -10, progressPercent: 100 })
  })

  it("son adet tarihinden önceki gün için null döner", () => {
    expect(gestationalAge(lmp, "2026-08-19")).toBeNull()
  })

  it("okunur metin üretir", () => {
    expect(formatGestationalAge({ weeks: 12, extraDays: 0 })).toBe("12 hafta")
    expect(formatGestationalAge({ weeks: 12, extraDays: 3 })).toBe("12 hafta 3 gün")
  })

  it("bir haftanın başladığı günü verir", () => {
    expect(dateOfWeekStart(lmp, 12)).toBe("2026-11-12")
  })
})
