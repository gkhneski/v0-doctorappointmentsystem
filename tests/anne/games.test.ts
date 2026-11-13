import { describe, it, expect } from "vitest"
import { MYTHS, MYTHS_PER_DAY, mythsOfDay } from "@/lib/anne/content/myths"
import { QUIZ } from "@/lib/anne/content/quiz"
import { DANGER_SIGNS } from "@/lib/anne/content/danger-signs"
import { SCHEDULE } from "@/lib/anne/content/schedule"
import { SOURCES } from "@/lib/anne/content/sources"
import { weekContent } from "@/lib/anne/content/weeks"
import { MAX_RECORD_SECONDS, WOMB_CUTOFF_HZ, encodeWav } from "@/lib/anne/womb-audio"

const myth = (id: string) => MYTHS.find((m) => m.id === id)!
const allWeeks = Array.from({ length: 40 }, (_, i) => weekContent(i + 1)?.text ?? "").join(" ")

describe("doğru mu, efsane mi", () => {
  it("her kartın tekil kimliği, tanımlı kaynağı ve açıklaması var", () => {
    expect(new Set(MYTHS.map((m) => m.id)).size).toBe(MYTHS.length)
    for (const m of MYTHS) {
      expect(SOURCES[m.source]).toBeDefined()
      expect(m.text.length).toBeGreaterThan(15)
      expect(m.explanation.length).toBeGreaterThan(20)
    }
    expect(MYTHS.some((m) => m.truth)).toBe(true)
    expect(MYTHS.some((m) => !m.truth)).toBe(true)
  })

  it("Bakanlık kaynaklı kartlar uygulamadaki içerikle aynı bilgiyi verir", () => {
    const sugar = SCHEDULE.find((i) => i.id === "seker-taramasi")!
    expect(myth("seker-testi").truth).toBe(false)
    expect(myth("seker-testi").explanation).toContain(`${sugar.fromWeek}–${sugar.toWeek}. haftalar`)
    expect(DANGER_SIGNS).toContain("Su gelmesi")
    expect(DANGER_SIGNS).toContain("Bebek hareketlerinin azalması")
    expect(myth("su-gelmesi").truth).toBe(false)
    expect(myth("hareket-azalmasi").truth).toBe(false)
    expect(myth("izlem-sayisi").explanation).toBe(QUIZ.find((q) => q.id === "izlem-sayisi")!.explanation)
  })

  it("gelişim kartları hafta hafta gelişim metnine dayanır", () => {
    expect(allWeeks).toContain("parmak izleri")
    expect(allWeeks).toContain("hıçkırabilir")
    expect(allWeeks).toContain("kalp atışınızı")
    expect(allWeeks).toContain("gözlerini açabilir")
    expect(allWeeks).toContain("parlak bir ışık")
    expect(myth("parmak-izi").truth).toBe(false)
    expect(myth("hickirik").truth).toBe(true)
    expect(myth("kalp-atisi").truth).toBe(true)
    expect(myth("gozler").truth).toBe(false)
    expect(myth("isik").truth).toBe(true)
  })

  it("aynı gün herkese aynı beş kartı, ertesi gün sıradakileri verir", () => {
    const today = mythsOfDay("2026-11-13")
    expect(today).toHaveLength(MYTHS_PER_DAY)
    expect(new Set(today.map((m) => m.id)).size).toBe(MYTHS_PER_DAY)
    expect(mythsOfDay("2026-11-13")).toEqual(today)
    expect(mythsOfDay("2026-11-14")[0]).not.toBe(today[0])
    expect(mythsOfDay("2025-03-01")).toHaveLength(MYTHS_PER_DAY)
  })
})

describe("beni böyle duyuyor", () => {
  it("süzgeç kaynaktaki aralıkta keser, kayıt kısa tutulur", () => {
    expect(WOMB_CUTOFF_HZ).toBeGreaterThanOrEqual(400)
    expect(WOMB_CUTOFF_HZ).toBeLessThanOrEqual(600)
    expect(MAX_RECORD_SECONDS).toBeLessThanOrEqual(30)
  })

  it("ses örnekleri geçerli bir WAV dosyasına yazılır", () => {
    const bytes = encodeWav(new Float32Array([0, 1, -1, 2, -2, 0.5]), 44100)
    const view = new DataView(bytes)
    const tag = (at: number) => String.fromCharCode(...new Uint8Array(bytes, at, 4))
    expect(bytes.byteLength).toBe(44 + 6 * 2)
    expect(tag(0)).toBe("RIFF")
    expect(tag(8)).toBe("WAVE")
    expect(view.getUint32(24, true)).toBe(44100)
    expect(view.getUint16(22, true)).toBe(1)
    expect(view.getInt16(44, true)).toBe(0)
    expect(view.getInt16(46, true)).toBe(32767)
    expect(view.getInt16(48, true)).toBe(-32767)
    // Sınır dışındaki örnekler kırpılır.
    expect(view.getInt16(50, true)).toBe(32767)
    expect(view.getInt16(52, true)).toBe(-32767)
  })
})

describe("havuç mu, lahana mı", () => {
  it("her yiyeceğin fotoğrafı var; araştırmadaki iki yiyecek doğru tat ailesinde", async () => {
    const { existsSync } = await import("node:fs")
    const { foodsOfDay } = await import("@/components/anne/taste-game")
    const foods = foodsOfDay(0)
    expect(foods.length).toBeGreaterThanOrEqual(12)
    expect(new Set(foods.map((f) => f.id)).size).toBe(foods.length)
    for (const food of foods) expect(existsSync(`public/anne/gorsel/yemek-${food.id}.jpg`), food.id).toBe(true)
    expect(foods.find((f) => f.id === "havuc")?.taste).toBe("tatli")
    expect(foods.find((f) => f.id === "lahana")?.taste).toBe("aci")
  })

  it("liste her gün başka bir yiyecekten başlar ve hiçbirini atlamaz", async () => {
    const { foodsOfDay } = await import("@/components/anne/taste-game")
    const today = foodsOfDay(100)
    const tomorrow = foodsOfDay(101)
    expect(tomorrow[0].id).toBe(today[1].id)
    expect([...tomorrow.map((f) => f.id)].sort()).toEqual([...today.map((f) => f.id)].sort())
    expect(foodsOfDay(-3)).toHaveLength(today.length)
  })
})
