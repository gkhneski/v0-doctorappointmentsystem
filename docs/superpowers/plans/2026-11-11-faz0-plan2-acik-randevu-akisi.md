# Faz 0 — Plan 2: Herkese Açık Randevu Akışı (G10–G19) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Herkese açık randevu, doğrulama, onay bağlantısı ve sohbet yollarındaki G10–G19 bulgularını, personel akışlarını ve SMS metinlerini değiştirmeden kapatmak.

**Architecture:** Kararlar küçük, saf `lib/` işlevlerine çıkarılır ve Vitest ile sınanır; yol dosyaları bu işlevleri çağırır. Veritabanı şeması **değişmez**: doğrulanmamış herkese açık randevu, kısıtın zaten izin verdiği ama canlıda hiç kullanılmayan `status = 'pending'` değeriyle işaretlenir (canlıda 0 satır; hatırlatma görevleri yalnızca `scheduled`/`confirmed` seçtiği için kendiliğinden atlar). Bekleyen hasta güncellemesi `appointment_forms.form_data._pending_patient` içinde tutulur.

**Tech Stack:** Next.js 16.4.6 (App Router), Supabase (servis rolü), Vitest 3, Node `crypto`, AI SDK 6.

**Spec:** `docs/superpowers/specs/2026-11-11-hasta-uygulamasi-ana-plan.md` — bölüm 7, Adım 0.4 ve 0.5.

## Global Constraints

- Çalışan hiçbir şey bozulmaz: personelin açtığı randevular (`created_by_admin: true`) bugünkü gibi `scheduled` doğar, hatırlatma alır, SMS gitmezse kod ekranda görünür.
- SMS metinleri değişmez.
- Veritabanı şeması ve canlı veri değişmez; depoya eklenen SQL yalnızca kayıttır, çalıştırılmaz.
- Dal: `fix/kritik-guvenlik-2` (`fix/kritik-guvenlik-1` üzerinden). `main`'e birleştirme ve gönderme (push) yalnızca kullanıcının onayıyla.
- Derleme: `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder pnpm build`; ardından `git checkout -q next-env.d.ts`.
- Tip hatası tabanı: `pnpm exec tsc --noEmit` en çok 52.
- Commit iletileri `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` ile biter.
- Gizli değerler ve hasta adları çıktıya yazılmaz.

## Review Focus

1. Personel sihirbazında SMS gitmezse: randevu `scheduled` kalır, kod yanıtta döner (bugünkü davranış).
2. Kayıtlı TC + yeni telefonla herkese açık randevu: kod yazılan telefona gider; hasta kaydı ancak doğrulamadan sonra güncellenir; doğrulanmazsa kayıt hiç değişmez.
3. 15 dakikayı geçmiş doğrulanmamış randevu: saat boşalır; geç gelen kod denemesi anlaşılır bir hata alır, 500 almaz.
4. Eski biçimde üretilmiş onay bağlantıları (gelecek tarihli randevular) çalışmaya devam eder.
5. Sohbet: AI SDK istemcisinin gönderdiği araç çağrısı geçmişi süzgeçten sonra da geçerli kalır; `system` rolü atılır.

Bilinen kalan risk (plan dışı, kullanıcı kararı): TC'yi bilen biri kendi telefonuyla randevu alıp kodu doğrularsa hasta kaydındaki telefon yine değişir. Tam kapatmak, telefonu değişen hastayı sekretere yönlendirmeyi gerektirir.

---

### Task 1: Güvenli rastgele üretim (G12, G17)

**Files:**
- Create: `lib/secure-random.ts`, `tests/secure-random.test.ts`, `tests/guards/no-math-random.test.ts`
- Modify: `app/api/appointments/route.ts:190,224`, `app/api/admin/patients/complete-info/route.ts:59`, `app/api/cron/send-reminders/route.ts:8-10`, `app/api/test-reminder-sms/route.ts:31`

**Interfaces:**
- Produces: `generateVerificationCode(): string` (6 hane, `crypto.randomInt(100000, 1000000)`), `generateUrlToken(): string` (`crypto.randomBytes(24).toString("base64url")`, 32 karakter).

- [ ] **Step 1: Testleri yaz.** `tests/secure-random.test.ts`: 200 kodun hepsi `/^\d{6}$/`; 200 belirteç `/^[A-Za-z0-9_-]{32}$/` ve hepsi farklı. `tests/guards/no-math-random.test.ts`: `app/api` ve `lib` altındaki `.ts` dosyalarında `Math.random` geçmez.
- [ ] **Step 2:** `pnpm test` → Expected: iki dosya FAIL (modül yok; 4 dosyada `Math.random`).
- [ ] **Step 3:** `lib/secure-random.ts`'i yaz; beş `Math.random` satırını bu iki işlevle değiştir (`send-reminders` içindeki yerel `generateToken` silinir).
- [ ] **Step 4:** `pnpm test` → Expected: PASS.
- [ ] **Step 5:** Commit: `fix(security): generate codes and link tokens with crypto`

### Task 2: Hız sınırlayıcı — hata durumunda reddetme seçeneği ve SQL kaydı (G16)

**Files:**
- Modify: `lib/rate-limit.ts`
- Create: `tests/rate-limit.test.ts`, `scripts/rate-limit.sql`

**Interfaces:**
- Produces: `checkRateLimit(bucket: string, max: number, windowSeconds: number, options?: { failClosed?: boolean }): Promise<boolean>` — RPC hata döndürür ya da fırlatırsa `failClosed` ise `false`, değilse `true` (bugünkü davranış).

- [ ] **Step 1: Testi yaz.** `@/lib/supabase/service-role` taklit edilir (`vi.hoisted`). Durumlar: `data:true` → true; `data:false` → false; `error` + varsayılan → true; `error` + `failClosed` → false; fırlatma + varsayılan → true; fırlatma + `failClosed` → false.
- [ ] **Step 2:** `pnpm test tests/rate-limit.test.ts` → Expected: iki `failClosed` durumu FAIL.
- [ ] **Step 3:** Seçeneği uygula. `scripts/rate-limit.sql`: canlıdaki `rate_limit_events` tablosu (`id bigserial pk, bucket text not null, created_at timestamptz not null default now()`), `idx_rate_limit_events_bucket_time (bucket, created_at)`, RLS açık, ve `check_rate_limit` işlevinin canlıdaki gövdesi aynen; başlık: "Canlıda zaten var; bu dosya kayıttır."
- [ ] **Step 4:** `pnpm test` → Expected: PASS.
- [ ] **Step 5:** Commit: `fix(security): let rate limiter fail closed and record its SQL`

### Task 3: Hasta kaydı kod doğrulanmadan değişmez (G10)

**Files:**
- Modify: `lib/resolve-patient.ts`
- Create: `tests/helpers/fake-supabase.ts`, `tests/resolve-patient.test.ts`

**Interfaces:**
- Produces:
  - `type PendingPatient = { tc_no?: string; full_name?: string; phone?: string; date_of_birth?: string; kvkk_approved?: boolean }`
  - `resolvePatient(supabase, input: ResolvePatientInput, options: { defer: boolean }): Promise<{ id: string; created: boolean; pending: PendingPatient | null }>`
  - `resolvePatientId(supabase, input): Promise<string>` — aynen kalır (`defer: false` sarmalayıcısı).
  - `applyPendingPatient(supabase, appointmentId: string): Promise<void>` — `appointment_forms.form_data._pending_patient` ve `appointments.patient_id` okunur; varsa `patients` güncellenir, anahtar `form_data`'dan silinir; yoksa hiçbir şey yapmaz; güncelleme hatası fırlatılmaz (`console.error`).
- `tests/helpers/fake-supabase.ts`: bellek içi tablo taklidi; `from(t).select().eq().in().order().limit()`, `.maybeSingle()`, `.single()`, `update().eq()`, `insert().select().single()`, `delete().eq().lt()` desteği ve `tables` alanı.

- [ ] **Step 1: Testleri yaz.**
  - `defer:false`, TC eşleşir → kayıt hemen güncellenir (`full_name`, `phone`), `pending: null`, `created: false`.
  - `defer:true`, TC eşleşir → kayıt **değişmez**; `pending` = `{ full_name, phone, date_of_birth, kvkk_approved }`.
  - `defer:true`, TC yok, aynı telefonda geçici kayıt (`TEMP_…`) → kayıt değişmez; `id` geçici kaydın; `pending` = `{ tc_no, full_name, date_of_birth, kvkk_approved }`.
  - `defer:true`, hiç eşleşme yok → yeni kayıt, `created: true`, `pending: null`.
  - `applyPendingPatient`: bekleyen varsa hastaya uygular ve anahtarı siler, formun diğer alanları kalır; bekleyen yoksa hiçbir tablo değişmez.
- [ ] **Step 2:** `pnpm test tests/resolve-patient.test.ts` → Expected: FAIL (`resolvePatient` yok).
- [ ] **Step 3:** Uygula.
- [ ] **Step 4:** `pnpm test` → Expected: PASS.
- [ ] **Step 5:** Commit: `fix(security): defer patient record changes until the code is verified`

### Task 4: Randevu ve doğrulama yolları (G11, G12, G13, G14)

**Files:**
- Create: `lib/public-booking.ts`, `tests/public-booking.test.ts`, `tests/guards/public-booking-route.test.ts`
- Modify: `app/api/appointments/route.ts`, `app/api/appointments/verify/route.ts`, `app/randevu/page.tsx` (yalnızca temizlik çağrısı)

**Interfaces:**
- Consumes: Task 1–3'ün işlevleri.
- Produces (`lib/public-booking.ts`):
  - `PUBLIC_REFUSAL_MESSAGE = "Bu bilgilerle şu anda çevrim içi randevu oluşturulamıyor. Lütfen sekreterimizi arayın: 0531 080 47 20"`
  - `SMS_FAILED_MESSAGE = "Doğrulama SMS'i gönderilemedi. Lütfen telefon numaranızı kontrol edip tekrar deneyin."`
  - `UNVERIFIED_TTL_MINUTES = 15`
  - `initialStatus(isStaff: boolean): "scheduled" | "pending"`
  - `smsOutcome(isStaff: boolean, smsDelivered: boolean, code: string): { action: "continue"; devCode?: string } | { action: "rollback" }` — personel: her zaman `continue`, SMS gitmediyse `devCode: code`; herkese açık: gitti → `continue` (devCode yok), gitmedi → `rollback`.
  - `purgeStaleUnverified(supabase, now?: Date): Promise<void>` — `status = 'pending'` ve `created_at < now − 15 dk` randevuları siler; hata fırlatmaz.
  - `isUuid(value: unknown): value is string`

- [ ] **Step 1: Testleri yaz.** `initialStatus` iki durum; `smsOutcome` dört durum (herkese açık yanıtta hiçbir koşulda `devCode` yok); `purgeStaleUnverified` sahte veritabanında: 16 dakikalık `pending` silinir, 5 dakikalık `pending` ve 16 dakikalık `scheduled` kalır; `isUuid`. Bekçi testi (kaynak metni): `appointments/route.ts` içinde `duplicate_appointment` ve `existing_appointment` geçmez, `purgeStaleUnverified(` ve `smsOutcome(` geçer; `verify/route.ts` içinde `failClosed: true` ve `applyPendingPatient(` geçer.
- [ ] **Step 2:** `pnpm test` → Expected: yeni iki dosya FAIL.
- [ ] **Step 3: `lib/public-booking.ts`'i yaz.**
- [ ] **Step 4: `app/api/appointments/route.ts`'i değiştir.**
  - Herkese açık blokta, IP sınırından sonra: `checkRateLimit(\`appt:phone:${patient_phone}\`, 3, 3600)` (hata durumunda geçirir); aşılırsa mevcut 429 iletisi.
  - Ön kontrollerden önce `await purgeStaleUnverified(supabase)`.
  - Aynı hafta ve kara liste dalları (herkese açık): ikisi de `409 { error: PUBLIC_REFUSAL_MESSAGE }`. Personel için kara liste dalı bugünkü yanıtıyla kalır.
  - `resolvePatient(..., { defer: !isVerifiedAdmin })`; `status: initialStatus(isVerifiedAdmin)`; `pending` varsa `form_data._pending_patient` olarak eklenir.
  - SMS sonucu `smsOutcome` ile: `rollback` → randevu silinir, bu istekte hasta yeni açıldıysa (`created`) o da silinir, `502 { error: SMS_FAILED_MESSAGE }`. `continue` → bugünkü yanıt; `devCode` yalnızca işlev verdiyse.
- [ ] **Step 5: `app/api/appointments/verify/route.ts`'i değiştir.**
  - `isUuid(appointmentId)` ve `typeof code === "string"` değilse `400 { error: "Geçersiz doğrulama kodu" }`.
  - Kayıt bulunduktan sonra, kod karşılaştırılmadan önce: `checkRateLimit(\`verify:appt:${appointmentId}\`, 5, 900, { failClosed: true })`; reddedilirse kodun `expires_at` değeri şimdiye çekilir, `429 { error: "Çok fazla deneme yapıldı. Lütfen randevuyu yeniden oluşturun." }`.
  - Durum `confirmed` yapıldıktan sonra, SMS'lerden önce `await applyPendingPatient(supabase, appointmentId)`.
- [ ] **Step 6:** `app/randevu/page.tsx`: servis rolüyle randevular okunmadan önce `await purgeStaleUnverified(serviceSupabase)`.
- [ ] **Step 7:** `pnpm test` → Expected: PASS. Derleme → Expected: başarılı. `pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"` → Expected: ≤ 52.
- [ ] **Step 8:** `status === "pending"` randevunun personel ekranlarında nasıl göründüğünü oku (`components/admin/*`, `components/weekly-calendar.tsx`); bozuk görünüm yoksa değişiklik yapma, varsa "Doğrulanmadı" etiketi ekle ve deftere yaz.
- [ ] **Step 9:** Commit: `fix(security): harden public booking and code verification`

### Task 5: Herkese açık takvime randevu kimliği gitmez (G15)

**Files:**
- Create: `lib/public-slots.ts`, `tests/public-slots.test.ts`
- Modify: `app/randevu/page.tsx:41-65`

**Interfaces:**
- Produces: `toPublicSlots(rows: { doctor_id: string; appointment_date: string; appointment_time: string; status: string }[]): { id: string; doctor_id: string; appointment_date: string; appointment_time: string; status: string }[]` — `id` = `` `${appointment_date}_${appointment_time}` `` (bileşenler `id`'yi yalnızca anahtar olarak kullanır).

- [ ] **Step 1: Testi yaz.** Girdide gerçek `id` alanı olsa bile çıktıda UUID yok; `id` tarih_saat; diğer dört alan aynen.
- [ ] **Step 2:** `pnpm test tests/public-slots.test.ts` → Expected: FAIL.
- [ ] **Step 3:** Uygula; sayfadaki iki sorguda `select("doctor_id, appointment_date, appointment_time, status")`, sonuç `toPublicSlots` ile dönüştürülür.
- [ ] **Step 4:** `pnpm test` + derleme → Expected: PASS, başarılı.
- [ ] **Step 5:** Commit: `fix(security): stop sending appointment ids to the public calendar`

### Task 6: Onay sayfası — yalnızca gereken alanlar, geçmiş randevuda kapalı (G17)

**Files:**
- Create: `lib/confirmation-view.ts`, `tests/confirmation-view.test.ts`
- Modify: `app/confirm/[token]/page.tsx`, `app/api/confirm-appointment/route.ts`, gerekiyorsa `components/appointment-confirmation.tsx` (yalnızca prop tipi)

**Interfaces:**
- Produces:
  - `toConfirmationView(a): { confirmation_status: string; appointment_date: string; appointment_time: string; patients: { full_name: string } | null; doctors: { name: string } | null }` — bileşenin okuduğu alanlar; telefon, not, ödeme, kimlik yok.
  - `isConfirmationExpired(appointmentDate: string, now?: Date): boolean` — randevu günü İstanbul saatiyle dünden eskiyse `true`.

- [ ] **Step 1: Testleri yaz.** Tam satır verilince çıktının anahtarları tam olarak yukarıdaki beş alan, `patients` içinde yalnızca `full_name`; `isConfirmationExpired`: bugün → false, dün → false, iki gün önce → true, yarın → false.
- [ ] **Step 2:** `pnpm test tests/confirmation-view.test.ts` → Expected: FAIL.
- [ ] **Step 3:** Uygula. Sayfa: süresi dolmuşsa mevcut "Gecersiz Link" görünümü; istemci bileşenine `toConfirmationView(appointment)` gider (denetim kaydı sunucuda tam satırla yapılmaya devam eder). Yol: RPC'den önce belirteçle `appointment_date` okunur; yoksa bugünkü 404, süresi dolmuşsa `410 { error: "Bu bağlantının süresi dolmuş" }`.
- [ ] **Step 4:** `pnpm test` + derleme → Expected: PASS, başarılı.
- [ ] **Step 5:** Commit: `fix(security): trim confirmation page data and expire old links`

### Task 7: `/patient` ön eki `/patient-form`'u yakalamaz (G18)

**Files:**
- Create: `lib/path-prefix.ts`, `tests/path-prefix.test.ts`
- Modify: `lib/supabase/proxy.ts:74`

**Interfaces:**
- Produces: `isUnderPath(pathname: string, base: string): boolean` — `pathname === base || pathname.startsWith(base + "/")`.

- [ ] **Step 1: Testi yaz.** `("/patient", "/patient")` true; `("/patient/x", "/patient")` true; `("/patient-form", "/patient")` false; `("/patients", "/patient")` false.
- [ ] **Step 2:** `pnpm test tests/path-prefix.test.ts` → Expected: FAIL.
- [ ] **Step 3:** Uygula; `proxy.ts:74` koşulu `isUnderPath(path, "/patient") && !user` olur. `/admin` satırına dokunulmaz.
- [ ] **Step 4:** `pnpm test` → Expected: PASS.
- [ ] **Step 5:** Commit: `fix: stop /patient guard from catching /patient-form`

### Task 8: Sohbet sınırları (G19)

**Files:**
- Create: `lib/ai-chat-guard.ts`, `tests/ai-chat-guard.test.ts`
- Modify: `app/api/ai-randevu/route.ts:99-109`, `app/api/ai-randevu/slots/route.ts:47-49`

**Interfaces:**
- Produces:
  - `MAX_CHAT_MESSAGES = 30`, `MAX_USER_TEXT = 1000`
  - `sanitizeChatMessages(raw: unknown): UIMessage[]` — dizi değilse `[]`; yalnızca `role` `user` ya da `assistant` olanlar; `user` iletilerinde yalnızca `type: "text"` parçaları, metin 1000 karaktere kısaltılır; parçası kalmayan ileti atılır; son 30 ileti.

- [ ] **Step 1: Testleri yaz.** `system` rolü atılır; 5000 karakterlik kullanıcı metni 1000'e iner; 50 iletiden son 30 kalır; kullanıcı iletisindeki `text` dışı parça atılır; asistan iletisindeki araç parçası korunur; dizi olmayan girdi → `[]`.
- [ ] **Step 2:** `pnpm test tests/ai-chat-guard.test.ts` → Expected: FAIL.
- [ ] **Step 3:** Uygula. `ai-randevu/route.ts`: dakikalık sınır `{ failClosed: true }`; ek günlük sınır `checkRateLimit(\`ai:day:ip:${ip}\`, 200, 86400, { failClosed: true })`; `messages = sanitizeChatMessages(body.messages)`; boşsa `400`. `slots/route.ts`: `checkRateLimit(\`ai:slots:ip:${ip}\`, 30, 60, { failClosed: true })` → `429 { slots: [], hasMore: false }`.
- [ ] **Step 4:** `pnpm test` + derleme + `tsc` sayımı → Expected: PASS, başarılı, ≤ 52.
- [ ] **Step 5:** Commit: `fix(security): bound the AI chat by role, length, and daily use`

### Task 9: Ön izleme denemesi ve kayıt (kullanıcıyla)

- [ ] **Step 1:** Ana planda G10–G19 satırlarına "Kod tamam (Plan 2, 11.11.2026); ön izleme denemesi bekliyor." yaz; commit.
- [ ] **Step 2 (kullanıcı onayı):** dalı gönder; Vercel ön izleme adresini al.
- [ ] **Step 3:** Ön izlemede: `/randevu` kaynağında UUID biçiminde randevu kimliği yok; `/patient-form?t=x` 404 verir (yönlendirme yok); `POST /api/appointments/verify` geçersiz kimlikle 400.
- [ ] **Step 4 (kullanıcıyla, gerçek SMS gider):** (a) herkese açık deneme randevusu: kod gelir, yanlış kod reddedilir, doğru kod onaylar, onay SMS'i gelir; (b) aynı TC ile aynı hafta ikinci deneme genel iletiyi verir; (c) kodu girmeden bırakılan randevu 15 dakika sonra takvimden kalkar; (d) personel sihirbazıyla randevu: bugünkü gibi; (e) hatırlatma bağlantısı açılır, onay/iptal çalışır; (f) sohbet yanıt verir.
- [ ] **Step 5:** Deneme randevularını iptal et/sil; ana planı işaretle; birleştirme yalnızca onayla.
