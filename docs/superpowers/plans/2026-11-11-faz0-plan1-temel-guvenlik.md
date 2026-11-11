# Faz 0 / Plan 1 — Temel Güvenlik (Adım 0.1–0.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut randevu sisteminde davranış değiştirmeyen güvenlik düzeltmelerini (G2, G4–G9) yayına almak: Next.js güncellemesi, yönetici yollarında yol içi yetki kontrolü, hassas kayıt satırlarının silinmesi, yazdırma ekranındaki kod çalıştırma açığı, ölü kodun kaldırılması.

**Architecture:** Hiçbir akışın davranışı değişmez; yalnızca kontrol eklenir, kayıt satırı ve kullanılmayan kod silinir. Ortak mantık üç küçük `lib/` dosyasına konur (`require-admin`, `escape-html`, `validate-booking`) ve Vitest ile sınanır. Kuralların kalıcı olması için depoyu tarayan iki "bekçi" testi eklenir (yönetici yolları korumalı mı, sunucu kodunda `console.log` var mı).

**Tech Stack:** Next.js 16 App Router (pnpm), React 19, Supabase (`@supabase/ssr`), TypeScript, Vitest (yeni, yalnızca geliştirme bağımlılığı).

**Spec:** `docs/superpowers/specs/2026-11-11-hasta-uygulamasi-ana-plan.md` — bölüm 7, "Faz 0", Adım 0.1–0.3 (G1–G9).

**Kapsam notu:** Faz 0 dört ayrı plana bölünmüştür; her biri kendi başına yayına alınabilir. Bu belge Plan 1'dir. Sonrakiler sırası geldiğinde yazılır: Plan 2 = Adım 0.4–0.5 (herkese açık randevu akışı, G10–G19), Plan 3 = Adım 0.6 (veritabanı kuralları, G20–G27), Plan 4 = Adım 0.7 (roller ve sertleştirme, G28–G31; G28 için S7 yanıtı gerekir).

**Bu planda olmayanlar:** G1 tamamlandı (11.11.2026). G3 (`nbreeda` anahtarlarının yenilenmesi) kod işi değildir; kullanıcı yapar. G2'nin şifre değiştirme kısmı da kullanıcıdadır (Görev 1'de not edilir).

## Global Constraints

- Çalışan hiçbir akış bozulmaz: herkese açık randevu, SMS doğrulama, hatırlatma görevleri, admin panelinin tüm ekranları.
- Her görev sonunda `pnpm test` ve `pnpm build` geçer.
- `pnpm exec tsc --noEmit` hata sayısı başlangıçtaki **55**'i aşmaz (derleme tip hatalarını yok sayıyor; yeni hata eklenmez).
- Next.js sürümü en az **16.4.1**; bu planda **16.4.6** sabitlenir.
- Gizli değerler (şifre, anahtar, SMS kodu) hiçbir çıktıya, commit mesajına ya da teste yazılmaz.
- Canlı veritabanında bu plan hiçbir değişiklik yapmaz.
- Dal: `fix/kritik-guvenlik-1`. `main`'e birleştirme ve canlıya alma, Görev 7'deki ön izleme denemesinden ve kullanıcının onayından sonra yapılır.
- Kullanıcıya dönük hata metinleri Türkçedir; mevcut metinler değiştirilmez.

## Review Focus

1. **Yönetici oturumu açıkken sekiz yolun hâlâ çalışması** — `requireAdmin` yanlış bağlanırsa sekreter hasta bilgisi kaydedemez. Görev 3'teki birim testleri "oturum var → işleyici devam eder" durumunu sınar; Görev 7'de elle denenir.
2. **Türkçe ve yabancı adlar** — "Ayşe Gül Öztürk", "Zeynep-Nur O'Brien", "İ. Çağla Ş." gibi adlar herkese açık formda reddedilmemeli. Görev 5'teki testlerde bu adlar geçer.
3. **Mevcut randevu türlerinin hepsi doğrulamadan geçmeli** — `components/appointment-type-selector.tsx` içindeki her tür değeri. Görev 5'te bu listenin tamamı teste girer.
4. **Yazdırmada boş ve özel karakterli değerler** — notu olmayan randevu, `&` içeren ad ("Ali & Veli"), `null` tür. Görev 4'teki testler `escapeHtml(null) === ""` ve `&` kaçışını sınar; liste görünümü eskisiyle aynı kalır.
5. **Next.js güncellemesinden sonra zamanlanmış görevler ve giriş yönlendirmesi** — `proxy.ts` davranışı ve `/api/cron/*` yetki kontrolü. Görev 2'deki duman testi bu beş adresi sınar.

---

## File Structure

| Dosya | Sorumluluk |
|---|---|
| `vitest.config.ts` (yeni) | Test ayarı; `@` takma adı depo köküne |
| `lib/require-admin.ts` (yeni) | Yol işleyicileri için tek yönetici kontrolü |
| `lib/escape-html.ts` (yeni) | HTML'e gömülecek değerlerin kaçışlanması |
| `lib/validate-booking.ts` (yeni) | Herkese açık randevu isteğinde ad ve tür doğrulaması |
| `tests/require-admin.test.ts`, `tests/escape-html.test.ts`, `tests/validate-booking.test.ts` (yeni) | Birim testleri |
| `tests/guards/admin-routes.test.ts`, `tests/guards/no-server-console-log.test.ts` (yeni) | Depoyu tarayan bekçi testleri |
| Sekiz yol dosyası (Görev 3) | Başlarına `requireAdmin` eklenir |
| `components/admin/appointments-list.tsx` | Yazdırma şablonunda kaçışlama |
| `app/api/appointments/route.ts` | Herkese açık istekte doğrulama |

---

### Task 1: Test altyapısı, `.gitignore` ve depodaki giriş bilgileri (G2, G4)

**Files:**
- Create: `vitest.config.ts`, `tests/smoke.test.ts`
- Modify: `package.json` (scripts + devDependencies), `.gitignore`, `scripts/003_create_admin_account.sql` (satır 2, 3, 6, 10, 11, 20), `scripts/004_add_secretary_account.sql` (satır 2, 7, 10, 11)

**Interfaces:**
- Produces: `pnpm test` komutu (`vitest run`); testler `tests/**/*.test.ts` altında; `@/…` içe aktarmaları depo köküne çözülür.

- [ ] **Step 1: Vitest'i ekle**

Run: `pnpm add -D vitest@^3`
`package.json` → `"scripts"` içine `"test": "vitest run"` ekle.

- [ ] **Step 2: `vitest.config.ts` yaz**

`environment: "node"`, `include: ["tests/**/*.test.ts"]`, `resolve.alias: { "@": <depo kökü> }`.

- [ ] **Step 3: Duman testi yaz ve çalıştır**

```ts
// tests/smoke.test.ts
import { describe, it, expect } from "vitest"
import { normalizePhone } from "@/lib/phone"

describe("test altyapısı", () => {
  it("@ takma adı lib dosyalarını çözer", () => {
    expect(typeof normalizePhone).toBe("function")
  })
})
```

Run: `pnpm test`
Expected: 1 test geçer.

- [ ] **Step 4: `.gitignore` güncelle**

`.env*.local` satırını `.env*` ile değiştir, altına `!.env.example` ekle.

Run: `git check-ignore -v .env .env.production .env.local`
Expected: üçü de `.gitignore` kuralıyla eşleşir.

- [ ] **Step 5: İki SQL dosyasından giriş bilgilerini çıkar**

Yukarıda numarası verilen satırlardaki e-posta ve şifre değerlerini sil; yerlerine `<E-POSTA>` ve `<ŞİFRE — depoya yazmayın>` yer tutucularını koy. Dosyaların başına şu yorumu ekle: `-- Bu dosyadaki eski giriş bilgileri git geçmişinde durduğu için GEÇERSİZ sayılmalıdır; şifreler değiştirilmiştir.` Değerleri hiçbir çıktıya yazdırma.

Run: `git diff --stat scripts/003_create_admin_account.sql scripts/004_add_secretary_account.sql`
Expected: iki dosya değişmiş; `grep -ciE "<ŞİFRE" scripts/003_create_admin_account.sql` en az 1.

- [ ] **Step 6: Kullanıcıya bırakılan işi kaydet**

`docs/superpowers/specs/2026-11-11-hasta-uygulamasi-ana-plan.md` içindeki G2 satırının "Yapılacak" hücresine ekle: `Satırlar silindi (Plan 1, Görev 1). Kalan: doktor ve sekreter şifreleri admin panelinden değiştirilecek — değerler git geçmişinde durduğu için zorunlu.`

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts tests/smoke.test.ts package.json pnpm-lock.yaml .gitignore scripts/003_create_admin_account.sql scripts/004_add_secretary_account.sql docs/superpowers
git commit -m "chore(security): add vitest, ignore all env files, strip credentials from seed scripts"
```

---

### Task 2: Next.js 16.4.6 (G5)

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Olası: `proxy.ts`, `next.config.mjs` — yalnızca sürüm notları bir değişiklik gerektirirse

**Interfaces:**
- Produces: `next@16.4.6`; sonraki görevler bu sürümde derlenir.

- [ ] **Step 1: Başlangıç ölçümü al**

Run: `pnpm build` ve `pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: derleme başarılı; tip hatası sayısı 55. İkisini de not et.

- [ ] **Step 2: Sürüm notlarını oku**

`vercel:next-upgrade` becerisini yükle; 16.2 → 16.4 arasındaki kırıcı değişiklikleri `proxy.ts`, `next.config.mjs` (`experimental.optimizePackageImports`, `redirects`) ve `app/` altındaki `cookies()`/`headers()` kullanımları açısından kontrol et. Gereken değişiklik varsa bu görevde yap; yoksa dokunma.

- [ ] **Step 3: Güncelle**

Run: `pnpm add next@16.4.6`
Expected: `package.json` içinde `"next": "16.4.6"`.

- [ ] **Step 4: Derle ve karşılaştır**

Run: `pnpm build && pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: derleme başarılı; tip hatası sayısı ≤ 55.

- [ ] **Step 5: Yerel duman testi**

Run: `pnpm dev` (arka planda), sonra:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/                                   # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/randevu                            # 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/admin              # 307 → /auth/admin/login?ref=ec25
curl -s -w "\n%{http_code}\n" http://localhost:3000/api/admin/predefined-lists                    # 401 {"error":"Yetkisiz"}
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/cron/send-reminders            # 401 (gizli anahtar yok)
```

Expected: yorumlardaki kodlar. `.env.local` yoksa sayfalar Supabase anahtarı olmadan açılmaz; bu durumda bu adımı atla, atlandığını raporla ve doğrulamayı Görev 7'deki ön izlemeye bırak.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "fix(security): upgrade next to 16.4.6"
```

---

### Task 3: Yönetici yollarında yol içi yetki kontrolü (G6)

**Files:**
- Create: `lib/require-admin.ts`, `tests/require-admin.test.ts`, `tests/guards/admin-routes.test.ts`
- Modify (her dışa aktarılan işleyicinin ilk satırları):
  - `app/api/admin/patients/complete-info/route.ts` (POST)
  - `app/api/admin/patients/verify-kvkk/route.ts` (POST)
  - `app/api/admin/patients/[patientId]/route.ts` (DELETE)
  - `app/api/admin/predefined-lists/route.ts` (GET, POST)
  - `app/api/admin/quick-block/route.ts` (POST)
  - `app/api/patients/[patientId]/route.ts` (PATCH)
  - `app/api/weekly-patterns/route.ts` (GET, POST)
  - `app/api/weekly-patterns/apply-month/route.ts` (POST)

**Interfaces:**
- Consumes: `getAdminAuth()` — `lib/admin-auth.ts`, döndürür `{ user, adminUser: { full_name, role } | null }`.
- Produces:

```ts
// lib/require-admin.ts
export type AdminGate =
  | { ok: true; user: User; adminUser: { full_name: string; role: string } }
  | { ok: false; response: NextResponse }
export async function requireAdmin(): Promise<AdminGate>
```

Kullanım kalıbı (her işleyicide aynı):

```ts
const gate = await requireAdmin()
if (!gate.ok) return gate.response
```

Yanıtlar `lib/supabase/proxy.ts` ile aynıdır: oturum yoksa `401 {"error":"Yetkisiz"}`, oturum var ama `admin_users` satırı yoksa `403 {"error":"Bu islem icin yetkiniz yok"}`.

- [ ] **Step 1: Başarısız birim testini yaz**

```ts
// tests/require-admin.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const getAdminAuth = vi.fn()
vi.mock("@/lib/admin-auth", () => ({ getAdminAuth }))

import { requireAdmin } from "@/lib/require-admin"

beforeEach(() => getAdminAuth.mockReset())

describe("requireAdmin", () => {
  it("oturum yoksa 401 ve 'Yetkisiz' döner", async () => {
    getAdminAuth.mockResolvedValue({ user: null, adminUser: null })
    const gate = await requireAdmin()
    expect(gate.ok).toBe(false)
    if (!gate.ok) {
      expect(gate.response.status).toBe(401)
      expect(await gate.response.json()).toEqual({ error: "Yetkisiz" })
    }
  })

  it("oturum var ama personel değilse 403 döner", async () => {
    getAdminAuth.mockResolvedValue({ user: { id: "u1" }, adminUser: null })
    const gate = await requireAdmin()
    expect(gate.ok).toBe(false)
    if (!gate.ok) {
      expect(gate.response.status).toBe(403)
      expect(await gate.response.json()).toEqual({ error: "Bu islem icin yetkiniz yok" })
    }
  })

  it("personelse kullanıcıyı ve rolü döner", async () => {
    getAdminAuth.mockResolvedValue({ user: { id: "u1" }, adminUser: { full_name: "A", role: "sekreter" } })
    const gate = await requireAdmin()
    expect(gate).toMatchObject({ ok: true, user: { id: "u1" }, adminUser: { role: "sekreter" } })
  })

  it("getAdminAuth hata fırlatırsa 401 döner (açık kalmaz)", async () => {
    getAdminAuth.mockRejectedValue(new Error("supabase down"))
    const gate = await requireAdmin()
    expect(gate.ok).toBe(false)
    if (!gate.ok) expect(gate.response.status).toBe(401)
  })
})
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `pnpm test tests/require-admin.test.ts`
Expected: FAIL — `@/lib/require-admin` bulunamadı.

- [ ] **Step 3: `requireAdmin` yaz**

Yukarıdaki imzayla `lib/require-admin.ts`. `lib/admin-auth.ts` içindeki `cache()` yol işleyicilerinde de çalışır; ek önbellek ekleme.

- [ ] **Step 4: Birim testleri geçsin**

Run: `pnpm test tests/require-admin.test.ts`
Expected: 4 test geçer.

- [ ] **Step 5: Başarısız bekçi testini yaz**

```ts
// tests/guards/admin-routes.test.ts
import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = ["app/api/admin", "app/api/patients", "app/api/weekly-patterns"]

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? routeFiles(p) : name === "route.ts" ? [p] : []
  })
}

describe("yönetici yolları", () => {
  for (const file of ROOTS.flatMap(routeFiles)) {
    it(`${file} her işleyicide yetki kontrolü yapar`, () => {
      const src = readFileSync(file, "utf8")
      const handlers = src.match(/export async function (GET|POST|PUT|PATCH|DELETE)\b/g) ?? []
      const checks = src.match(/requireAdmin\(|getAdminAuth\(|auth\.getUser\(/g) ?? []
      expect(handlers.length).toBeGreaterThan(0)
      expect(checks.length).toBeGreaterThanOrEqual(handlers.length)
    })
  }
})
```

- [ ] **Step 6: Bekçi testinin başarısız olduğunu gör**

Run: `pnpm test tests/guards/admin-routes.test.ts`
Expected: FAIL — en az yukarıdaki sekiz dosya için. Başka dosya da düşerse (ör. kontrolü tek bir yardımcıda toplayan, birden çok işleyicili bir yol) onu da listeye al.

- [ ] **Step 7: Kalıbı her işleyiciye ekle**

Düşen her dosyada, her dışa aktarılan işleyicinin `try` bloğundan önceki ilk iki satır olarak "Interfaces" altındaki kalıbı ekle. İşleyicinin geri kalanına dokunma; servis rolü istemcisi aynen kalır.

- [ ] **Step 8: Bekçi ve tüm testler geçsin**

Run: `pnpm test`
Expected: hepsi geçer.

- [ ] **Step 9: Derle**

Run: `pnpm build && pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: derleme başarılı; sayı ≤ 55.

- [ ] **Step 10: Commit**

```bash
git add lib/require-admin.ts tests/require-admin.test.ts tests/guards/admin-routes.test.ts app/api
git commit -m "fix(security): enforce admin check inside every admin route handler"
```

---

### Task 4: Yazdırma ekranında kaçışlama (G8, birinci yarı)

**Files:**
- Create: `lib/escape-html.ts`, `tests/escape-html.test.ts`
- Modify: `components/admin/appointments-list.tsx:283-394` (yazdırma şablonu; `rows` ve `printContent`)

**Interfaces:**
- Produces: `export function escapeHtml(value: unknown): string` — `& < > " '` karakterlerini `&amp; &lt; &gt; &quot; &#39;` yapar; `null`/`undefined` → `""`; diğer değerler önce `String()` ile metne çevrilir.

- [ ] **Step 1: Başarısız testi yaz**

```ts
// tests/escape-html.test.ts
import { describe, it, expect } from "vitest"
import { escapeHtml } from "@/lib/escape-html"

describe("escapeHtml", () => {
  it("etiketleri etkisizleştirir", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;")
  })
  it("& ve tek tırnağı kaçışlar", () => {
    expect(escapeHtml("Ali & Veli's")).toBe("Ali &amp; Veli&#39;s")
  })
  it("Türkçe karakterlere dokunmaz", () => {
    expect(escapeHtml("Ayşe Gül Öztürk İĞŞÇ")).toBe("Ayşe Gül Öztürk İĞŞÇ")
  })
  it("null ve undefined için boş metin döner", () => {
    expect(escapeHtml(null)).toBe("")
    expect(escapeHtml(undefined)).toBe("")
  })
  it("sayıyı metne çevirir", () => {
    expect(escapeHtml(1500)).toBe("1500")
  })
  it("çift kaçışlamaz: & önce işlenir", () => {
    expect(escapeHtml("<&>")).toBe("&lt;&amp;&gt;")
  })
})
```

- [ ] **Step 2: Başarısız olduğunu gör**

Run: `pnpm test tests/escape-html.test.ts`
Expected: FAIL — modül yok.

- [ ] **Step 3: `escapeHtml` yaz** (`lib/escape-html.ts`, yukarıdaki imza)

- [ ] **Step 4: Testler geçsin**

Run: `pnpm test tests/escape-html.test.ts`
Expected: 6 test geçer.

- [ ] **Step 5: Şablona uygula**

`components/admin/appointments-list.tsx` içinde yazdırma şablonuna gömülen şu sekiz değerin her birini `escapeHtml(...)` ile sar: `no`, `time`, `name`, `type`, `paymentDisplay`, `notes` (satır şablonu) ve `dateLabel`, `listToPrint.length` (başlık). `rows` zaten kaçışlanmış satırlardan oluştuğu için ikinci kez sarılmaz. Randevu notları düz metindir (zengin metin düzenleyici yalnızca gebelik ve infertilite ekranlarında kullanılıyor), bu yüzden kaçışlama görünümü değiştirmez.

Run: `grep -nE '\$\{(no|time|name|type|paymentDisplay|notes|dateLabel)\}' components/admin/appointments-list.tsx`
Expected: çıktı boş (hiçbiri çıplak kalmamış).

- [ ] **Step 6: Derle ve commit**

Run: `pnpm test && pnpm build`
Expected: geçer.

```bash
git add lib/escape-html.ts tests/escape-html.test.ts components/admin/appointments-list.tsx
git commit -m "fix(security): escape all values in the daily list print view"
```

---

### Task 5: Herkese açık randevu isteğinde ad ve tür doğrulaması (G8, ikinci yarı)

**Files:**
- Create: `lib/validate-booking.ts`, `tests/validate-booking.test.ts`
- Modify: `app/api/appointments/route.ts:54-65` (hız sınırı bloğunun hemen ardına, yalnızca `!isVerifiedAdmin` dalında)

**Interfaces:**
- Produces:

```ts
// lib/validate-booking.ts
/** Geçerliyse null, değilse kullanıcıya gösterilecek Türkçe hata metni döner. */
export function validatePublicBooking(input: { patient_name: unknown; appointment_type: unknown }): string | null
```

Kurallar:
- `patient_name`: metin olmalı; baştaki/sondaki boşluk atıldıktan sonra 2–80 karakter; `/^\p{L}[\p{L} .'’-]*$/u` ile eşleşmeli. Hata: `"Lütfen adınızı ve soyadınızı yalnızca harflerle yazın."`
- `appointment_type`: metin olmalı; 1–80 karakter; `/^[\p{L}\p{N} ._()\/+&,-]+$/u` ile eşleşmeli. Hata: `"Geçersiz randevu türü."`

Personelin açtığı randevular (`isVerifiedAdmin === true`) bu doğrulamadan geçmez; sekreter "Ayşe (eşi: Ali) 2" gibi adlar yazmaya devam edebilir. O değerler Görev 4'teki kaçışlama ile zararsızdır.

- [ ] **Step 1: Başarısız testi yaz**

`components/appointment-type-selector.tsx` dosyasını aç, herkese açık sihirbazın gönderebildiği tüm tür değerlerini (`value`/`id` alanları) `PUBLIC_TYPES` dizisine kopyala; diziyi boş bırakma.

```ts
// tests/validate-booking.test.ts
import { describe, it, expect } from "vitest"
import { validatePublicBooking } from "@/lib/validate-booking"

const PUBLIC_TYPES: string[] = [
  "kontrol-takip",
  // components/appointment-type-selector.tsx içindeki diğer tüm değerler buraya
]

const ok = (name: string, type = "kontrol-takip") =>
  validatePublicBooking({ patient_name: name, appointment_type: type })

describe("validatePublicBooking", () => {
  it.each(["Ayşe Gül Öztürk", "Zeynep-Nur O'Brien", "İ. Çağla Ş.", "Élodie Müller", "  Fatma Yılmaz  "])(
    "geçerli adı kabul eder: %s",
    (name) => expect(ok(name)).toBeNull(),
  )

  it.each(PUBLIC_TYPES)("mevcut randevu türünü kabul eder: %s", (type) => expect(ok("Ayşe Yılmaz", type)).toBeNull())

  it.each(['<img src=x onerror=alert(1)>', "Ayşe<script>", "A", "x".repeat(81), "12345", "", "   "])(
    "geçersiz adı reddeder: %s",
    (name) => expect(ok(name)).toBe("Lütfen adınızı ve soyadınızı yalnızca harflerle yazın."),
  )

  it.each([null, undefined, 42, {}])("metin olmayan adı reddeder: %s", (name) =>
    expect(validatePublicBooking({ patient_name: name, appointment_type: "kontrol-takip" })).not.toBeNull(),
  )

  it.each(["<b>x</b>", "", "x".repeat(81), null, 7])("geçersiz türü reddeder: %s", (type) =>
    expect(validatePublicBooking({ patient_name: "Ayşe Yılmaz", appointment_type: type })).toBe("Geçersiz randevu türü."),
  )
})
```

- [ ] **Step 2: Başarısız olduğunu gör**

Run: `pnpm test tests/validate-booking.test.ts`
Expected: FAIL — modül yok.

- [ ] **Step 3: `validatePublicBooking` yaz** (`lib/validate-booking.ts`, yukarıdaki imza ve kurallar; önce ad, sonra tür kontrol edilir)

- [ ] **Step 4: Testler geçsin**

Run: `pnpm test tests/validate-booking.test.ts`
Expected: hepsi geçer. `PUBLIC_TYPES` içindeki bir tür düşerse **türü değil kuralı** düzelt: tür deseninin izinli karakter kümesine eksik karakteri ekle ve "Interfaces" altındaki deseni güncelle.

- [ ] **Step 5: Yola bağla**

`app/api/appointments/route.ts` içinde, `if (!isVerifiedAdmin) { … }` hız sınırı bloğunun içine, `checkRateLimit` kontrolünden sonra:

```ts
const invalid = validatePublicBooking({ patient_name, appointment_type })
if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
```

Sihirbaz (`components/appointment-wizard-modal.tsx`) yanıtın `error` alanını zaten kullanıcıya gösteriyor; bunu dosyada doğrula, göstermiyorsa bu görevde raporla (değiştirme).

- [ ] **Step 6: Derle ve commit**

Run: `pnpm test && pnpm build`
Expected: geçer.

```bash
git add lib/validate-booking.ts tests/validate-booking.test.ts app/api/appointments/route.ts
git commit -m "fix(security): validate patient name and appointment type on public booking"
```

---

### Task 6: Hassas kayıt satırları ve ölü kod (G7, G9)

**Files:**
- Create: `tests/guards/no-server-console-log.test.ts`
- Delete:
  - `app/api/sms/send-verification/route.ts`, `app/api/sms/verify-code/route.ts`
  - `components/sms-verification-dialog.tsx`, `components/patient-intake-wizard.tsx`
  - `app/actions/patient-intake.ts`, `app/actions/clean-weekend-schedules.ts`, `app/actions/create-appointment.ts`
- Modify: `app/api/**`, `lib/**`, `app/appointment/**`, `app/patient-form/**` içindeki tüm `console.log` satırları (başlangıçta 55 adet); `app/admin/patients/[patientId]/patient-detail-client.tsx:316`

**Interfaces:**
- Produces: kural — sunucu kodunda `console.log`/`console.info`/`console.debug` yoktur; yalnızca `console.error` ve `console.warn` kalır ve bunlar istek gövdesi, doğrulama kodu, erişim anahtarı ya da şifre yazmaz.

`app/actions/reset-schedules.ts` **silinmez** (`components/admin/schedule-manager.tsx:17` kullanıyor).

- [ ] **Step 1: Ölü kodun gerçekten kullanılmadığını doğrula**

Run:
```bash
grep -rnE "api/sms/|sms-verification-dialog|SmsVerificationDialog|patient-intake-wizard|PatientIntakeWizard|actions/(patient-intake|clean-weekend-schedules|create-appointment)" --include=*.ts --include=*.tsx app components lib hooks
```
Expected: yalnızca silinecek yedi dosyanın kendi içindeki ve birbirine olan başvuruları çıkar. Başka bir dosya çıkarsa o öğeyi silme, raporla.

- [ ] **Step 2: Yedi dosyayı sil**

Run: `git rm` ile yukarıdaki yedi dosya. `app/api/sms/` klasörü boş kalırsa kendiliğinden kalkar.

- [ ] **Step 3: Başarısız bekçi testini yaz**

```ts
// tests/guards/no-server-console-log.test.ts
import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOTS = ["app/api", "lib", "app/appointment", "app/patient-form"]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.tsx?$/.test(name) ? [p] : []
  })
}

describe("sunucu kodunda hata ayıklama kaydı yok", () => {
  it("console.log / info / debug kullanılmaz", () => {
    const offenders = ROOTS.flatMap(sourceFiles).filter((f) =>
      /console\.(log|info|debug)\(/.test(readFileSync(f, "utf8")),
    )
    expect(offenders).toEqual([])
  })

  it("console.error ve console.warn doğrulama kodu, şifre ya da istek gövdesi yazmaz", () => {
    // Mesaj metinleri ("Error creating access token:") sayılmaz; yalnızca yazdırılan değişkenlere bakılır.
    const stripStrings = (src: string) => src.replace(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g, '""')
    const banned = /console\.(error|warn)\([^)]*\b(verificationCode|verification\.code|password|body|formData|token)\b/
    const offenders = ROOTS.flatMap(sourceFiles).filter((f) => banned.test(stripStrings(readFileSync(f, "utf8"))))
    expect(offenders).toEqual([])
  })
})
```

- [ ] **Step 4: Başarısız olduğunu gör**

Run: `pnpm test tests/guards/no-server-console-log.test.ts`
Expected: FAIL — düşen dosyaların listesi.

- [ ] **Step 5: Kayıt satırlarını sil**

Listelenen her dosyada `console.log`/`info`/`debug` çağrılarını sil. Bir çağrı çok satırlıysa tamamını sil; çağrıyı içeren `if`/`else` dalı boş kalıyorsa dalı da kaldır. İkinci testte düşen `console.error` çağrılarında hassas bağımsız değişkeni çıkar, sabit metin ve hata nesnesi kalsın. Mantık satırlarına dokunma. Ayrıca `app/admin/patients/[patientId]/patient-detail-client.tsx:316` satırını sil (tarayıcı konsoluna hasta formunu yazıyor).

- [ ] **Step 6: Testler ve derleme**

Run: `pnpm test && pnpm build && pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: testler geçer; derleme başarılı; sayı ≤ 55 (silinen dosyalar hata içeriyorduysa düşer).

- [ ] **Step 7: Commit**

```bash
git add -A app lib components tests
git commit -m "fix(security): remove sensitive logging and unauthenticated dead code"
```

---

### Task 7: Ön izleme denemesi ve kayıt

**Files:**
- Modify: `docs/superpowers/specs/2026-11-11-hasta-uygulamasi-ana-plan.md` (G2, G4–G9 satırlarına durum)

**Interfaces:**
- Consumes: Görev 1–6'nın commit'leri.

- [ ] **Step 1: Son tam kontrol**

Run: `pnpm test && pnpm build`
Expected: geçer.

- [ ] **Step 2: Dalı gönder (kullanıcı onayıyla)**

Kullanıcıdan onay al, sonra: `git push -u origin fix/kritik-guvenlik-1`. Vercel bu dal için ön izleme adresi üretir.

- [ ] **Step 3: Ön izlemede otomatik denemeler**

Ön izleme adresi `$P` olsun:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$P/"                                    # 200
curl -s -o /dev/null -w "%{http_code}\n" "$P/randevu"                             # 200
curl -s -w "\n%{http_code}\n" "$P/api/admin/predefined-lists"                     # 401
curl -s -w "\n%{http_code}\n" -X POST "$P/api/weekly-patterns/apply-month"        # 401
curl -s -w "\n%{http_code}\n" -X POST "$P/api/sms/send-verification"              # 404 (silindi)
curl -s -w "\n%{http_code}\n" -X POST "$P/api/appointments" -H "content-type: application/json" \
  -d '{"patient_name":"<img src=x onerror=alert(1)>","appointment_type":"kontrol-takip"}'   # 400, ad hatası
```

Expected: yorumlardaki kodlar. Ön izleme Vercel korumasıyla kapalıysa (401 ve Vercel giriş sayfası) bunu raporla; denemeler kullanıcıyla birlikte tarayıcıdan yapılır.

- [ ] **Step 4: Kullanıcıyla elle deneme listesi**

Kullanıcıya şu listeyi ver ve her maddenin sonucunu bekle (ön izleme canlı veritabanını kullandığı için deneme randevusu gerçek bir randevudur; iş bitince iptal edilir):

1. Admin girişi (doktor ve sekreter hesabıyla).
2. Randevu listesi → "Yazdır": liste eskisi gibi görünüyor.
3. Hasta detayında bilgi değiştir, kaydet.
4. Haftalık program ekranı açılıyor; "aya uygula" çalışıyor.
5. Hızlı blok ekleme çalışıyor.
6. Geçici hasta kaydını tamamlama (SMS kodu ile) çalışıyor.
7. Herkese açık sayfadan deneme randevusu: SMS geliyor, kod kabul ediliyor, onay SMS'i geliyor.
8. Aynı randevuyu adminden iptal et.

- [ ] **Step 5: Ana planda durumu işaretle ve commit**

G2, G4, G5, G6, G7, G8, G9 satırlarına `**Kod tamam (Plan 1); canlıya alındı: <tarih>**` ya da henüz alınmadıysa `ön izlemede denendi` yaz.

```bash
git add docs/superpowers
git commit -m "docs: mark phase 0 plan 1 findings as fixed"
```

- [ ] **Step 6: Canlıya alma**

Kullanıcı elle deneme listesini onayladıktan sonra `main`'e birleştirme için ayrıca onay iste; onaysız birleştirme ya da canlıya alma yapılmaz.
