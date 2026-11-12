import { describe, it, expect } from "vitest"
import { QUIZ, questionOfDay } from "@/lib/anne/content/quiz"
import { SCHEDULE } from "@/lib/anne/content/schedule"
import { DANGER_SIGNS } from "@/lib/anne/content/danger-signs"
import { SOURCES } from "@/lib/anne/content/sources"
import { SIZE_WEEKS, sizeComparison } from "@/lib/anne/content/sizes"
import { NAMES, isKnownName } from "@/lib/anne/content/names"
import { CONSENT_KINDS, REQUIRED_CONSENTS, hasRequired, latestConsents, recordConsents } from "@/lib/anne/consents"
import { createFakeSupabase } from "../helpers/fake-supabase"

describe("günün sorusu", () => {
  it("her sorunun üç şıkkı, geçerli bir doğru yanıtı ve tanımlı bir kaynağı var", () => {
    expect(new Set(QUIZ.map((q) => q.id)).size).toBe(QUIZ.length)
    for (const q of QUIZ) {
      expect(q.options).toHaveLength(3)
      expect(new Set(q.options).size).toBe(3)
      expect([0, 1, 2]).toContain(q.answer)
      expect(SOURCES[q.source]).toBeDefined()
      expect(q.explanation.length).toBeGreaterThan(10)
    }
  })

  it("hafta aralığı soran soruların doğru şıkkı izlem takvimiyle aynıdır", () => {
    const range = (id: string) => {
      const item = SCHEDULE.find((i) => i.id === id)!
      return `${item.fromWeek}–${item.toWeek}. haftalar`
    }
    const right = (id: string) => {
      const q = QUIZ.find((x) => x.id === id)!
      return q.options[q.answer]
    }
    expect(right("seker-taramasi")).toBe(range("seker-taramasi"))
    expect(right("izlem-3")).toBe(range("izlem-3"))
    expect(right("izlem-4")).toBe(range("izlem-4"))
    expect(right("tetanoz")).toBe(range("tetanoz"))
  })

  it("tehlike işareti soruları listedeki işaretlere dayanır", () => {
    expect(DANGER_SIGNS).toContain("Su gelmesi")
    expect(DANGER_SIGNS).toContain("Bebek hareketlerinin azalması")
  })

  it("aynı gün herkese aynı soruyu, ertesi gün sıradakini verir", () => {
    const a = questionOfDay("2026-11-12")
    expect(questionOfDay("2026-11-12")).toBe(a)
    expect(questionOfDay("2026-11-13")).not.toBe(a)
    expect(QUIZ).toContain(questionOfDay("2025-06-01"))
  })
})

describe("boy benzetmeleri", () => {
  it("5–40. haftaların her biri için bir benzetme var, dışında yok", () => {
    expect([...SIZE_WEEKS].sort((x, y) => x - y)).toEqual(Array.from({ length: 36 }, (_, i) => i + 5))
    expect(sizeComparison(4)).toBeNull()
    expect(sizeComparison(41)).toBeNull()
    expect(sizeComparison(24)).toBe("bir mısır koçanı")
  })
})

describe("isim listesi", () => {
  it("isimler tekildir ve yalnızca listedekiler kabul edilir", () => {
    expect(new Set(NAMES.map((n) => n.name)).size).toBe(NAMES.length)
    expect(isKnownName("Deniz")).toBe(true)
    expect(isKnownName("deniz")).toBe(false)
    expect(isKnownName("<script>")).toBe(false)
    expect(isKnownName(42)).toBe(false)
  })
})

describe("onaylar", () => {
  it("zorunlu onaylar tanımlı türlerdendir", () => {
    for (const kind of REQUIRED_CONSENTS) expect(CONSENT_KINDS).toContain(kind)
  })

  it("zorunlu ikisi de verilmeden tamam sayılmaz", () => {
    expect(hasRequired({ aydinlatma: true, saglik_verisi: false, bildirim: true })).toBe(false)
    expect(hasRequired({ aydinlatma: true, saglik_verisi: true, bildirim: false })).toBe(true)
  })

  it("hiç kayıt yokken hepsi verilmemiş sayılır ve kayıt yalnızca o hesabın satırlarını yazar", async () => {
    const db = createFakeSupabase({ app_consents: [] })
    expect(await latestConsents(db as never, "u1")).toEqual({ aydinlatma: false, saglik_verisi: false, bildirim: false })

    expect(await recordConsents(db as never, "u1", { aydinlatma: true, saglik_verisi: true })).toBe(true)
    const rows = db.tables.app_consents
    expect(rows).toHaveLength(2)
    expect(rows.every((r: { user_id: string }) => r.user_id === "u1")).toBe(true)
  })
})
