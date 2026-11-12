import { describe, it, expect } from "vitest"
import { createFakeSupabase } from "../helpers/fake-supabase"
import {
  CODE_TTL_MS,
  MAX_CODE_ATTEMPTS,
  SESSION_TTL_MS,
  checkLoginCode,
  createSession,
  deleteAccount,
  destroySession,
  findOrCreateUser,
  hashToken,
  isPhoneAllowed,
  issueLoginCode,
  loginPhone,
  resolveSession,
} from "@/lib/anne/auth"

const PHONE = "05321234567"
const OTHER = "05550000001"
const now = new Date("2026-11-12T10:00:00Z")
const later = (ms: number) => new Date(now.getTime() + ms)

function freshDb() {
  return createFakeSupabase({ app_users: [], app_login_codes: [], app_sessions: [], app_consents: [] })
}

describe("loginPhone", () => {
  it("TR cep telefonunu tek biçime çevirir", () => {
    expect(loginPhone("+90 532 123 45 67")).toBe(PHONE)
    expect(loginPhone("5321234567")).toBe(PHONE)
  })

  it("sabit hat, yurt dışı ve metin olmayan girdiyi reddeder", () => {
    expect(loginPhone("0262 123 45 67")).toBeNull()
    expect(loginPhone("+49 151 234 56789")).toBeNull()
    expect(loginPhone(5321234567)).toBeNull()
    expect(loginPhone("")).toBeNull()
  })
})

describe("isPhoneAllowed", () => {
  it("ayar yoksa kimse giremez", () => {
    expect(isPhoneAllowed(PHONE, {})).toBe(false)
  })

  it("yalnızca listedeki deneme numaraları girer; yazım biçimi fark etmez", () => {
    const env = { ANNE_DENEME_TELEFONLARI: "+90 532 123 45 67, 0555 000 00 01" }
    expect(isPhoneAllowed(PHONE, env)).toBe(true)
    expect(isPhoneAllowed(OTHER, env)).toBe(true)
    expect(isPhoneAllowed("05550000002", env)).toBe(false)
  })

  it("ANNE_ACIK=1 ise herkes girer", () => {
    expect(isPhoneAllowed(PHONE, { ANNE_ACIK: "1" })).toBe(true)
    expect(isPhoneAllowed(PHONE, { ANNE_ACIK: "true" })).toBe(false)
  })
})

describe("giriş kodu", () => {
  it("kodu düz metin saklamaz", async () => {
    const db = freshDb()
    const issued = await issueLoginCode(db, PHONE, now)
    expect(issued!.code).toMatch(/^\d{6}$/)
    expect(JSON.stringify(db.tables.app_login_codes)).not.toContain(issued!.code)
  })

  it("doğru kodu bir kez kabul eder", async () => {
    const db = freshDb()
    const { code } = (await issueLoginCode(db, PHONE, now))!
    expect(await checkLoginCode(db, PHONE, code, later(1000))).toBe("ok")
    expect(await checkLoginCode(db, PHONE, code, later(2000))).toBe("expired")
  })

  it("yanlış kodu reddeder ve denemeyi sayar", async () => {
    const db = freshDb()
    const { code } = (await issueLoginCode(db, PHONE, now))!
    const wrong = code === "000000" ? "111111" : "000000"
    expect(await checkLoginCode(db, PHONE, wrong, now)).toBe("wrong")
    expect(db.tables.app_login_codes[0].attempts).toBe(1)
  })

  it("deneme sınırından sonra doğru kodu da kabul etmez", async () => {
    const db = freshDb()
    const { code } = (await issueLoginCode(db, PHONE, now))!
    const wrong = code === "000000" ? "111111" : "000000"
    for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) expect(await checkLoginCode(db, PHONE, wrong, now)).toBe("wrong")
    expect(await checkLoginCode(db, PHONE, code, now)).toBe("too_many_attempts")
  })

  it("süresi dolan kodu kabul etmez", async () => {
    const db = freshDb()
    const first = (await issueLoginCode(db, PHONE, now))!
    expect(await checkLoginCode(db, PHONE, first.code, later(CODE_TTL_MS - 1))).toBe("ok")
    const second = (await issueLoginCode(db, PHONE, now))!
    expect(await checkLoginCode(db, PHONE, second.code, later(CODE_TTL_MS))).toBe("expired")
  })

  it("yeni kod istenince eskisi geçersiz olur", async () => {
    const db = freshDb()
    const first = (await issueLoginCode(db, PHONE, now))!
    const second = (await issueLoginCode(db, PHONE, later(1000)))!
    expect(db.tables.app_login_codes.filter((c: any) => !c.consumed_at)).toHaveLength(1)
    if (first.code !== second.code) expect(await checkLoginCode(db, PHONE, first.code, later(2000))).toBe("wrong")
    expect(await checkLoginCode(db, PHONE, second.code, later(3000))).toBe("ok")
  })

  it("başka numaranın koduyla girilemez", async () => {
    const db = freshDb()
    const { code } = (await issueLoginCode(db, PHONE, now))!
    expect(await checkLoginCode(db, OTHER, code, now)).toBe("expired")
  })

  it("altı rakam olmayan girdiyi denemeden reddeder", async () => {
    const db = freshDb()
    await issueLoginCode(db, PHONE, now)
    for (const bad of ["12345", "1234567", "12345a", "", null, 123456, { $ne: "" }]) {
      expect(await checkLoginCode(db, PHONE, bad, now)).toBe("wrong")
    }
    expect(db.tables.app_login_codes[0].attempts).toBe(0)
  })
})

describe("hesap ve oturum", () => {
  it("ilk girişte hesap açar, sonrakinde aynı hesabı döndürür", async () => {
    const db = freshDb()
    const first = await findOrCreateUser(db, PHONE, now)
    const second = await findOrCreateUser(db, PHONE, later(1000))
    expect(first!.id).toBe(second!.id)
    expect(db.tables.app_users).toHaveLength(1)
  })

  it("belirteci düz metin saklamaz ve onunla hesabı bulur", async () => {
    const db = freshDb()
    const user = (await findOrCreateUser(db, PHONE, now))!
    const session = (await createSession(db, user.id, "test-agent", now))!
    expect(JSON.stringify(db.tables.app_sessions)).not.toContain(session.token)
    expect(db.tables.app_sessions[0].token_hash).toBe(hashToken(session.token))
    expect((await resolveSession(db, session.token, later(1000)))!.id).toBe(user.id)
  })

  it("bilinmeyen, boş ya da biçimsiz belirteci reddeder", async () => {
    const db = freshDb()
    const user = (await findOrCreateUser(db, PHONE, now))!
    await createSession(db, user.id, null, now)
    expect(await resolveSession(db, "x".repeat(43), now)).toBeNull()
    expect(await resolveSession(db, "", now)).toBeNull()
    expect(await resolveSession(db, undefined, now)).toBeNull()
    expect(await resolveSession(db, "kisa", now)).toBeNull()
  })

  it("süresi dolan oturumu reddeder", async () => {
    const db = freshDb()
    const user = (await findOrCreateUser(db, PHONE, now))!
    const session = (await createSession(db, user.id, null, now))!
    expect(await resolveSession(db, session.token, later(SESSION_TTL_MS - 1))).not.toBeNull()
    expect(await resolveSession(db, session.token, later(SESSION_TTL_MS))).toBeNull()
  })

  it("bir hastanın oturumu başka hastanın hesabını döndürmez", async () => {
    const db = freshDb()
    const a = (await findOrCreateUser(db, PHONE, now))!
    const b = (await findOrCreateUser(db, OTHER, now))!
    const sa = (await createSession(db, a.id, null, now))!
    const sb = (await createSession(db, b.id, null, now))!
    expect((await resolveSession(db, sa.token, now))!.phone).toBe(PHONE)
    expect((await resolveSession(db, sb.token, now))!.phone).toBe(OTHER)
  })

  it("çıkışta oturum silinir", async () => {
    const db = freshDb()
    const user = (await findOrCreateUser(db, PHONE, now))!
    const session = (await createSession(db, user.id, null, now))!
    await destroySession(db, session.token)
    expect(await resolveSession(db, session.token, now)).toBeNull()
  })

  it("hesap silinince hesap ve giriş kodları gider, diğer hasta etkilenmez", async () => {
    const db = freshDb()
    const a = (await findOrCreateUser(db, PHONE, now))!
    await findOrCreateUser(db, OTHER, now)
    await issueLoginCode(db, PHONE, now)
    await issueLoginCode(db, OTHER, now)
    expect(await deleteAccount(db, a)).toBe(true)
    expect(db.tables.app_users.map((u: any) => u.phone)).toEqual([OTHER])
    expect(db.tables.app_login_codes.map((c: any) => c.phone)).toEqual([OTHER])
  })

  it("hesabını silip aynı numarayla yeniden açan, kullandığı ücretsiz hakkı yeniden kazanmaz", async () => {
    const db = freshDb()
    const a = (await findOrCreateUser(db, PHONE, now))!
    db.tables.app_generations = [
      { id: "g1", user_id: a.id, status: "generated" },
      { id: "g2", user_id: a.id, status: "failed" },
    ]
    expect(await deleteAccount(db, a)).toBe(true)
    // Geriye numaranın kendisi değil, anahtarlı özeti ve sayı kalır.
    expect(db.tables.app_phone_usage).toHaveLength(1)
    expect(db.tables.app_phone_usage[0].generations_used).toBe(1)
    expect(JSON.stringify(db.tables.app_phone_usage)).not.toContain(PHONE)

    const again = (await findOrCreateUser(db, PHONE, now))!
    expect(db.tables.app_users.find((u: any) => u.id === again.id).generation_allowance).toBe(0)
    // Hiç üretmemiş başka numara varsayılan hakla açılır (sütun varsayılanı; değer yazılmaz).
    const other = (await findOrCreateUser(db, OTHER, now))!
    expect(db.tables.app_users.find((u: any) => u.id === other.id).generation_allowance).toBeUndefined()
  })

  it("hiç üretmemiş hesap silinince geriye kayıt kalmaz", async () => {
    const db = freshDb()
    const a = (await findOrCreateUser(db, PHONE, now))!
    expect(await deleteAccount(db, a)).toBe(true)
    expect(db.tables.app_phone_usage ?? []).toHaveLength(0)
  })
})
