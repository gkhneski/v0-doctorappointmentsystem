import { describe, it, expect } from "vitest"
import { ALL_WEEKS, weekContent } from "@/lib/anne/content/weeks"
import { SCHEDULE, personalSchedule, statusAt } from "@/lib/anne/content/schedule"
import { DANGER_SIGNS } from "@/lib/anne/content/danger-signs"
import { SOURCES } from "@/lib/anne/content/sources"

describe("hafta içerikleri", () => {
  it("5–40. haftaların her biri için tek bir içerik var", () => {
    expect(ALL_WEEKS.map((w) => w.week)).toEqual(Array.from({ length: 36 }, (_, i) => i + 5))
  })

  it("0–4. haftalar ortak metni, 40'tan sonrası null döndürür", () => {
    expect(weekContent(0)!.text).toBe(weekContent(4)!.text)
    expect(weekContent(5)!.text).not.toBe(weekContent(4)!.text)
    expect(weekContent(40)).not.toBeNull()
    expect(weekContent(41)).toBeNull()
    expect(weekContent(-1)).toBeNull()
    expect(weekContent(12.5)).toBeNull()
  })

  it("metinler teşhis, kişiye özel yorum ya da meyve benzetmesi içermez", () => {
    for (const w of ALL_WEEKS) {
      expect(w.text.length).toBeGreaterThan(20)
      expect(w.text).not.toMatch(/büyüklüğünde|normal(dir)?\b|riskli|endişe/i)
    }
  })
})

describe("izlem takvimi", () => {
  it("her madde tanımlı bir kaynağa dayanır ve aralığı tutarlıdır", () => {
    for (const item of SCHEDULE) {
      expect(SOURCES[item.source]).toBeDefined()
      expect(item.fromWeek).toBeGreaterThanOrEqual(0)
      if (item.toWeek !== null) expect(item.toWeek).toBeGreaterThan(item.fromWeek)
    }
    expect(new Set(SCHEDULE.map((i) => i.id)).size).toBe(SCHEDULE.length)
  })

  it("dört izlem 2026 rehberindeki haftalardadır", () => {
    const visit = (id: string) => SCHEDULE.find((i) => i.id === id)!
    expect([visit("izlem-1").fromWeek, visit("izlem-1").toWeek]).toEqual([0, 14])
    expect([visit("izlem-2").fromWeek, visit("izlem-2").toWeek]).toEqual([18, 24])
    expect([visit("izlem-3").fromWeek, visit("izlem-3").toWeek]).toEqual([28, 32])
    expect([visit("izlem-4").fromWeek, visit("izlem-4").toWeek]).toEqual([36, 38])
  })

  it("durum: aralıktan önce sırada, içinde şimdi, sonra geçti", () => {
    const item = { fromWeek: 18, toWeek: 24 }
    expect(statusAt(item, 17)).toBe("next")
    expect(statusAt(item, 18)).toBe("now")
    expect(statusAt(item, 23)).toBe("now")
    expect(statusAt(item, 24)).toBe("past")
  })

  it("ucu açık madde başladıktan sonra hep geçerlidir", () => {
    expect(statusAt({ fromWeek: 16, toWeek: null }, 15)).toBe("next")
    expect(statusAt({ fromWeek: 16, toWeek: null }, 41)).toBe("now")
  })

  it("kişisel takvim tarihleri son adet tarihinden hesaplar ve şimdi olanı öne alır", () => {
    const items = personalSchedule("2026-08-20", 12)
    expect(items).toHaveLength(SCHEDULE.length)

    const second = items.find((i) => i.id === "izlem-2")!
    expect(second.fromDate).toBe("2026-12-24")
    expect(second.toDate).toBe("2027-02-04")
    expect(items.find((i) => i.id === "demir")!.toDate).toBeNull()

    const statuses = items.map((i) => i.status)
    expect(statuses).toEqual([...statuses].sort((a, b) => "now next past".indexOf(a) - "now next past".indexOf(b)))
    expect(items[0].status).toBe("now")
    expect(items.find((i) => i.id === "folik-asit")!.status).toBe("past")
  })
})

describe("tehlike işaretleri", () => {
  it("rehberdeki 13 maddenin hepsi var", () => {
    expect(DANGER_SIGNS).toHaveLength(13)
    expect(new Set(DANGER_SIGNS).size).toBe(13)
  })
})
