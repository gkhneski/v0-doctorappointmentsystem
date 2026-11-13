import { describe, it, expect } from "vitest"
import { createFakeSupabase } from "../helpers/fake-supabase"
import { resolveTheme } from "@/lib/anne/theme"
import { saveTheme, themeFor } from "@/lib/anne/theme-service"

function db() {
  return createFakeSupabase({
    app_users: [{ id: "u1", theme: null }],
    app_generations: [
      { id: "g1", user_id: "u1", status: "generated", gender: "male", created_at: "2026-11-10T10:00:00Z" },
      { id: "g2", user_id: "u1", status: "generated", gender: "female", created_at: "2026-11-12T10:00:00Z" },
      { id: "g3", user_id: "u1", status: "failed", gender: "male", created_at: "2026-11-13T10:00:00Z" },
      { id: "gx", user_id: "u2", status: "generated", gender: "male", created_at: "2026-11-13T11:00:00Z" },
    ],
  })
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
