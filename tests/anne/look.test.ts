import { describe, it, expect } from "vitest"
import { createFakeSupabase } from "../helpers/fake-supabase"
import {
  ACCESSORIES,
  LOOK_LIMITS,
  MAX_LOOK_ITEMS,
  STARTERS,
  accessoryOf,
  accessorySvg,
  nextGift,
  placed,
  resolveTheme,
  sanitizeLook,
  trayOrder,
} from "@/lib/anne/look"
import { openGift, readLook, saveLook, saveTheme, themeFor } from "@/lib/anne/look-service"

const TODAY = "2026-11-13"
const ALL = ACCESSORIES.map((a) => a.id)

function db(over: Record<string, unknown[]> = {}, failOn?: (table: string, op: string) => boolean | Record<string, unknown>) {
  return createFakeSupabase(
    {
      app_users: [{ id: "u1", theme: null }],
      app_generations: [
        { id: "g1", user_id: "u1", status: "generated", gender: "male", created_at: "2026-11-10T10:00:00Z" },
        { id: "g2", user_id: "u1", status: "generated", gender: "female", created_at: "2026-11-12T10:00:00Z" },
        { id: "g3", user_id: "u1", status: "failed", gender: "male", created_at: "2026-11-13T10:00:00Z" },
        { id: "gx", user_id: "u2", status: "generated", gender: "male", created_at: "2026-11-13T11:00:00Z" },
      ],
      app_looks: [],
      app_accessories: [],
      ...over,
    },
    failOn,
  )
}

describe("renk teması", () => {
  it("annenin seçimi önce gelir; yoksa cinsiyet; o da yoksa sade", () => {
    expect(resolveTheme("erkek", "female")).toBe("erkek")
    expect(resolveTheme(null, "female")).toBe("kiz")
    expect(resolveTheme(null, "male")).toBe("erkek")
    expect(resolveTheme(null, null)).toBe("sade")
    expect(resolveTheme("mor", null)).toBe("sade")
  })

  it("tema, hesabın son üretilmiş yüzündeki cinsiyetten çıkarılır", async () => {
    expect(await themeFor(db(), { id: "u1" })).toBe("kiz")
    expect(await themeFor(db(), { id: "u2" })).toBe("erkek")
    expect(await themeFor(db(), { id: "u3" })).toBe("sade")
    expect(await themeFor(db(), { id: "u1", theme: "sade" })).toBe("sade")
  })

  it("veritabanı okunamazsa ekran sade temayla açılır", async () => {
    const broken = { from: () => { throw new Error("yok") } }
    expect(await themeFor(broken, { id: "u1" })).toBe("sade")
  })

  it("tema seçimi kaydedilir; hesap yoksa başarısız döner", async () => {
    const store = db()
    expect(await saveTheme(store, "u1", "erkek")).toBe(true)
    expect(store.tables.app_users[0].theme).toBe("erkek")
    expect(await saveTheme(store, "u1", null)).toBe(true)
    expect(store.tables.app_users[0].theme).toBeNull()
    expect(await saveTheme(store, "yok", "kiz")).toBe(false)
  })
})

describe("aksesuar listesi", () => {
  it("kimlikler tekildir, çizimler dışarıdan içerik ya da betik taşımaz", () => {
    expect(new Set(ALL).size).toBe(ALL.length)
    for (const item of ACCESSORIES) {
      expect(item.svg).not.toMatch(/<script|href|url\(|on[a-z]+=|<foreignObject|<image/i)
      expect(item.w).toBeGreaterThan(0)
      expect(item.h).toBeGreaterThan(0)
      expect(item.place.x).toBeGreaterThanOrEqual(LOOK_LIMITS.xMin)
      expect(item.place.x).toBeLessThanOrEqual(LOOK_LIMITS.xMax)
      expect(item.place.size).toBeGreaterThanOrEqual(LOOK_LIMITS.sizeMin)
      expect(accessorySvg(item, 200)).toContain(`viewBox="0 0 ${item.w} ${item.h}"`)
    }
    for (const id of STARTERS) expect(accessoryOf(id)).toBeDefined()
  })

  it("her temada bütün aksesuarlar hediye olarak sırayla açılır", () => {
    for (const theme of ["kiz", "erkek", "sade"] as const) {
      const unlocked = [...STARTERS]
      for (let i = 0; i < ACCESSORIES.length - STARTERS.length; i++) {
        const gift = nextGift(theme, unlocked)
        expect(gift).not.toBeNull()
        expect(unlocked).not.toContain(gift)
        unlocked.push(gift as string)
      }
      expect([...unlocked].sort()).toEqual([...ALL].sort())
      expect(nextGift(theme, unlocked)).toBeNull()
    }
    expect(nextGift("kiz", STARTERS)).toBe("tac")
    expect(nextGift("erkek", STARTERS)).toBe("bere")
  })

  it("şeritte temaya yakın aksesuar başta durur, yalnızca açık olanlar görünür", () => {
    expect(trayOrder("kiz", STARTERS).map((a) => a.id)).toEqual(["toka", "emzik", "sapka"])
    expect(trayOrder("erkek", STARTERS).map((a) => a.id)).toEqual(["sapka", "emzik", "toka"])
    expect(trayOrder("sade", STARTERS).map((a) => a.id)).toEqual(["toka", "sapka", "emzik"])
    expect(trayOrder("kiz", ALL)).toHaveLength(ALL.length)
  })
})

describe("görünümü temizleme", () => {
  it("sayıları sınırlara çeker, açılmamış ve yinelenen aksesuarı atar", () => {
    const result = sanitizeLook(
      [
        { item: "toka", x: 5, y: -2, size: 9, rot: 725 },
        { item: "toka", x: 0.5, y: 0.5, size: 0.3, rot: 0 },
        { item: "tac", x: 0.5, y: 0.5, size: 0.3, rot: 0 },
        { item: "yok", x: 0.5, y: 0.5, size: 0.3, rot: 0 },
      ],
      STARTERS,
    )
    expect(result).toEqual([{ item: "toka", x: LOOK_LIMITS.xMax, y: LOOK_LIMITS.yMin, size: LOOK_LIMITS.sizeMax, rot: 5 }])
  })

  it("biçimi bozuk girdiyi reddeder", () => {
    expect(sanitizeLook("toka", STARTERS)).toBeNull()
    expect(sanitizeLook([{ item: "toka", x: "0.5", y: 0.5, size: 0.3, rot: 0 }], STARTERS)).toBeNull()
    expect(sanitizeLook([{ item: "toka", x: Number.NaN, y: 0.5, size: 0.3, rot: 0 }], STARTERS)).toBeNull()
    expect(sanitizeLook([null], STARTERS)).toBeNull()
    expect(sanitizeLook(Array.from({ length: 100 }, () => placed("toka")), STARTERS)).toBeNull()
  })

  it("en çok belirli sayıda aksesuar tutar", () => {
    const many = ALL.map((id) => placed(id))
    expect(sanitizeLook(many, ALL)).toHaveLength(MAX_LOOK_ITEMS)
  })
})

describe("süsle: kayıt ve günlük hediye", () => {
  it("ilk durumda üç aksesuar açık, bugünün hediyesi hazır", async () => {
    const state = await readLook(db(), { id: "u1" }, TODAY)
    expect(state.theme).toBe("kiz")
    expect(state.themeChoice).toBeNull()
    expect(state.unlocked).toEqual([...STARTERS])
    expect(state.items).toEqual([])
    expect(state.giftReady).toBe(true)
    expect(state.giftsLeft).toBe(ACCESSORIES.length - STARTERS.length)
  })

  it("görünüm kaydedilir, ikinci kayıt aynı satırı günceller", async () => {
    const store = db()
    const first = await saveLook(store, "u1", [placed("toka")])
    expect(first.ok).toBe(true)
    const second = await saveLook(store, "u1", [placed("sapka"), placed("emzik")])
    expect(second.ok && second.items.map((i) => i.item)).toEqual(["sapka", "emzik"])
    expect(store.tables.app_looks).toHaveLength(1)
    expect((await readLook(store, { id: "u1" }, TODAY)).items.map((i) => i.item)).toEqual(["sapka", "emzik"])
  })

  it("açılmamış aksesuar kaydedilmez; bozuk istek 400 döner", async () => {
    const store = db()
    const saved = await saveLook(store, "u1", [placed("tac"), placed("toka")])
    expect(saved.ok && saved.items.map((i) => i.item)).toEqual(["toka"])
    expect(await saveLook(store, "u1", { items: 1 })).toMatchObject({ ok: false, status: 400 })
  })

  it("başka hesabın görünümüne dokunmaz", async () => {
    const store = db({ app_looks: [{ user_id: "u2", items: [placed("emzik")] }] })
    await saveLook(store, "u1", [placed("toka")])
    expect(store.tables.app_looks.find((r: { user_id: string }) => r.user_id === "u2").items).toEqual([placed("emzik")])
    expect((await readLook(store, { id: "u1" }, TODAY)).items).toEqual([placed("toka")])
  })

  it("veritabanı hatasında kayıt başarısız döner", async () => {
    const store = db({}, (table, op) => table === "app_looks" && op === "update")
    expect(await saveLook(store, "u1", [placed("toka")])).toMatchObject({ ok: false, status: 500 })
  })

  it("hediye günde bir kez açılır ve temaya göre sıradaki aksesuarı verir", async () => {
    const store = db()
    const gift = await openGift(store, { id: "u1" }, TODAY)
    expect(gift).toEqual({ ok: true, item: "tac" })
    expect(await openGift(store, { id: "u1" }, TODAY)).toMatchObject({ ok: false, status: 409 })

    const state = await readLook(store, { id: "u1" }, TODAY)
    expect(state.unlocked).toContain("tac")
    expect(state.giftReady).toBe(false)

    const tomorrow = await openGift(store, { id: "u1" }, "2026-11-14")
    expect(tomorrow).toEqual({ ok: true, item: "cicek" })
    expect((await readLook(store, { id: "u1" }, "2026-11-15")).giftReady).toBe(true)
  })

  it("aynı anda gelen ikinci hediye isteği (tekillik çakışması) 409 döner", async () => {
    const store = db({}, (table, op) => (table === "app_accessories" && op === "insert" ? { code: "23505" } : false))
    expect(await openGift(store, { id: "u1" }, TODAY)).toMatchObject({ ok: false, status: 409 })
  })

  it("bütün aksesuarlar açıldıysa hediye kalmaz", async () => {
    const rows = ALL.filter((id) => !STARTERS.includes(id)).map((item, i) => ({ user_id: "u1", item, day: `2026-10-${String(i + 1).padStart(2, "0")}` }))
    const store = db({ app_accessories: rows })
    const state = await readLook(store, { id: "u1" }, TODAY)
    expect(state.giftsLeft).toBe(0)
    expect(state.giftReady).toBe(false)
    expect(await openGift(store, { id: "u1" }, TODAY)).toMatchObject({ ok: false, status: 409 })
  })

  it("hediye açılınca takılabilir hale gelir", async () => {
    const store = db()
    await openGift(store, { id: "u1" }, TODAY)
    const saved = await saveLook(store, "u1", [placed("tac")])
    expect(saved.ok && saved.items.map((i) => i.item)).toEqual(["tac"])
  })
})
