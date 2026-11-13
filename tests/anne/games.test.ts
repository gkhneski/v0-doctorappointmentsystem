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
  it("her yiyeceğin tekil kimliği, grubu ve fotoğrafı var", async () => {
    const { existsSync } = await import("node:fs")
    const { FOODS, FOOD_GROUPS } = await import("@/lib/anne/content/foods")
    expect(FOODS.length).toBeGreaterThanOrEqual(45)
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length)
    for (const food of FOODS) {
      expect(FOOD_GROUPS.some((g) => g.id === food.group), food.id).toBe(true)
      expect(existsSync(`public/anne/gorsel/yemek-${food.id}.jpg`), food.id).toBe(true)
    }
    for (const group of FOOD_GROUPS) expect(FOODS.filter((f) => f.group === group.id).length, group.id).toBeGreaterThanOrEqual(4)
  })

  it("gebelikte önerilmeyenler listede yok", async () => {
    const { FOODS } = await import("@/lib/anne/content/foods")
    const labels = FOODS.map((f) => f.label.toLocaleLowerCase("tr")).join(" | ")
    for (const banned of ["alkol", "rakı", "bira", "şarap", "çiğ köfte", "suşi", "ciğer", "pastırma", "enerji", "papatya", "adaçayı", "rafadan", "çiğ süt"]) {
      expect(labels, banned).not.toContain(banned)
    }
  })

  it("yalnızca araştırılan yiyecekler kanıtlı sayılır; diğerleri tahmin olduğunu söyler", async () => {
    const { FOODS, foodScience } = await import("@/lib/anne/content/foods")
    const food = (id: string) => FOODS.find((f) => f.id === id)!
    expect(FOODS.filter((f) => f.evidence === "olculdu").map((f) => f.id).sort()).toEqual(["havuc", "lahana"])
    expect(food("havuc").taste).toBe("tatli")
    expect(food("lahana").taste).toBe("aci")
    expect(foodScience(food("havuc")).source).toBe("tatDurham")
    expect(foodScience(food("sarimsak")).text).toContain("ölçülmedi")
    expect(foodScience(food("baklava")).text).toContain("tahminimizdir")
    expect(foodScience(null).text.length).toBeGreaterThan(20)
    for (const f of FOODS) expect(SOURCES[foodScience(f).source]).toBeDefined()
    expect(FOODS.filter((f) => f.caffeine).map((f) => f.id).sort()).toEqual(["cay", "kahve", "kola"])
    expect(SOURCES.kafein).toBeDefined()
  })

  it("grup ve sıra her gün değişir, hiçbir yiyecek atlanmaz", async () => {
    const { FOODS, foodsOfDay, groupOfDay } = await import("@/lib/anne/content/foods")
    expect(groupOfDay(100)).not.toBe(groupOfDay(101))
    const today = foodsOfDay("meyve", 100)
    const tomorrow = foodsOfDay("meyve", 101)
    expect(tomorrow[0].id).toBe(today[1].id)
    expect(today).toHaveLength(FOODS.filter((f) => f.group === "meyve").length)
    expect(foodsOfDay("icecek", -3).length).toBeGreaterThan(0)
  })
})

describe("isim çarkı", () => {
  it("isimler tekildir, her birinin anlamı ve geçerli bir türü var", async () => {
    const { NAMES } = await import("@/lib/anne/content/names")
    expect(NAMES.length).toBeGreaterThanOrEqual(380)
    expect(new Set(NAMES.map((n) => n.name)).size).toBe(NAMES.length)
    for (const n of NAMES) {
      expect(n.name, n.name).toMatch(/^[A-ZÇĞİÖŞÜ][a-zçğıöşüâîû]+$/)
      expect(n.meaning.length, n.name).toBeGreaterThan(1)
      expect(n.meaning.length, n.name).toBeLessThanOrEqual(110)
      expect(["kiz", "erkek", "ortak"]).toContain(n.kind)
    }
  })

  it("çark seçilen cinsiyetin ve ortak isimlerle döner; açılış bebeğin cinsiyetine göredir", async () => {
    const { NAMES, namesFor, filterForGender } = await import("@/lib/anne/content/names")
    const girls = namesFor("kiz")
    const boys = namesFor("erkek")
    expect(girls.every((n) => n.kind !== "erkek")).toBe(true)
    expect(boys.every((n) => n.kind !== "kiz")).toBe(true)
    expect(girls.some((n) => n.kind === "ortak")).toBe(true)
    expect(girls.length).toBeGreaterThan(150)
    expect(boys.length).toBeGreaterThan(150)
    expect(namesFor("hepsi")).toHaveLength(NAMES.length)
    expect(filterForGender("female")).toBe("kiz")
    expect(filterForGender("male")).toBe("erkek")
    expect(filterForGender(null)).toBe("hepsi")
  })
})

describe("soru bankası", () => {
  it("her sorunun tekil kimliği, geçerli konusu, tanımlı kaynağı ve kaynaktaki yeri var", async () => {
    const { QUESTIONS, QUESTION_CATEGORIES } = await import("@/lib/anne/content/questions")
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(70)
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length)
    for (const q of QUESTIONS) {
      expect(QUESTION_CATEGORIES.some((c) => c.id === q.category), q.id).toBe(true)
      expect(SOURCES[q.source], q.id).toBeDefined()
      expect(SOURCES[q.source].url, q.id).toContain("saglik.gov.tr")
      expect(q.where.length, q.id).toBeGreaterThan(2)
      expect(q.question.endsWith("?"), q.id).toBe(true)
      expect(q.answer.length, q.id).toBeLessThanOrEqual(420)
    }
    for (const c of QUESTION_CATEGORIES) expect(QUESTIONS.filter((q) => q.category === c.id).length, c.id).toBeGreaterThanOrEqual(5)
  })

  it("tehlike işareti yanıtları beklemeden sağlık kuruluşuna gitmeyi söyler", async () => {
    const { QUESTIONS } = await import("@/lib/anne/content/questions")
    const danger = QUESTIONS.filter((q) => q.category === "tehlike")
    expect(danger.length).toBeGreaterThanOrEqual(8)
    for (const q of danger) expect(q.answer, q.id).toMatch(/beklemeden bir sağlık kuruluşuna git\.$/)
  })

  it("arama Türkçe büyük-küçük harfe bakmaz, konuya göre süzer", async () => {
    const { QUESTIONS, searchQuestions } = await import("@/lib/anne/content/questions")
    expect(searchQuestions("", "hepsi")).toHaveLength(QUESTIONS.length)
    expect(searchQuestions("MİDE YANMASI", "hepsi").length).toBeGreaterThan(0)
    expect(searchQuestions("olmayankelimexyz", "hepsi")).toHaveLength(0)
    expect(searchQuestions("", "emzirme").every((q) => q.category === "emzirme")).toBe(true)
  })
})
