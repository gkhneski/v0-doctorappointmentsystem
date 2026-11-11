# Faz 0 — Plan 3: Veritabanı Kuralları ve Dosyalar (G20–G27) Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Görev 2–9 canlı veritabanını değiştirir: her biri için kullanıcının o adıma özel onayı şarttır. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canlı veritabanında girişsiz ya da "giriş yapmış herkes" koşuluyla erişilebilen tabloları, işlevleri ve dosya klasörünü personele kısıtlamak; zengin metin düzenleyicilerine süzgeç eklemek.

**Architecture:** Her veritabanı değişikliği `scripts/rls/NN_*.sql` dosyasında tek bir işlem (`begin … commit`) olarak durur ve yanında birebir geri alma dosyası (`NN_geri_al.sql`) vardır. Adımlar en risksizden en riskliye sıralıdır; her adım uygulanır, dışarıdan (girişsiz istekle) doğrulanır, ilgili admin ekranı denenir, sonra bir sonrakine geçilir. Ön izleme yoktur: değişiklik uygulandığı anda canlıdadır, geri alma da aynı hızdadır.

**Tech Stack:** Supabase Postgres (RLS), Supabase CLI (`db query --remote`), DOMPurify, Vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-11-11-hasta-uygulamasi-ana-plan.md` — bölüm 7, Adım 0.6.

## Global Constraints

- Çalışan hiçbir şey bozulmaz. Bir adımdan sonra herhangi bir admin ekranı hata verirse o adımın `_geri_al.sql` dosyası hemen çalıştırılır, sonra neden aranır.
- Canlı veritabanına yazan her komut yalnızca kullanıcının o adım için verdiği onaydan sonra çalışır. Onay bir sonraki adıma taşınmaz.
- Adımlar klinik kapalıyken uygulanır (akşam ya da hafta sonu).
- Personel koşulu her yerde aynıdır: `exists (select 1 from public.admin_users au where au.id = (select auth.uid()))`.
- Veri silinmez, tablo ya da sütun değişmez; yalnızca erişim kuralları, bir klasörün "herkese açık" işareti ve dört işlevin çağırma izni değişir.
- Uygulama komutu (depo dışında, `$TEMP` içinden): `npx --yes supabase@latest db query --remote=wchkcpxxllwpvluxkzgu --file "<depo>/scripts/rls/NN_….sql"`; CLI `--file` desteklemiyorsa dosya içeriği tek argüman olarak verilir.
- Dal: `fix/kritik-guvenlik-3`. Commit iletileri `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` ile biter.
- Gizli anahtarlar ve hasta verisi çıktıya yazılmaz; doğrulama sorguları yalnızca satır sayısı ya da durum kodu okur.

## Bugünkü durum (11.11.2026, canlıdan okundu)

| Nesne | Bugün | Kodda kullanan |
|---|---|---|
| `hormone_tests`, `hsg_results`, `spermiogram_results`, `ultrasound_results`, `genetic_tests`, `treatments`, `medications`, `procedures` | Girişsiz okuma ve yazma; hepsi boş | Yok |
| `appointment_access_tokens` | Geçerli belirteçler girişsiz listelenebilir (şu an geçerli belirteç yok) | Yalnızca sunucu (servis rolü) |
| `appointments` ekleme | Girişsiz satır eklenebilir | Sunucu (servis rolü) |
| `patient-photos` klasörü | Herkese açık, 3 dosya; hiçbir kayıt bağlantı vermiyor | Yok |
| `find_patient_by_name`, `search_patients_tr`, `tr_fold`, `prevent_appointment_audit_mutation` | Girişsiz çağrılabilir | Sunucu |
| `pregnancy_episodes`, `pregnancy_visits`, `pregnancy_outcomes` | Girişsiz okunur (3 + 1 + 0 satır) | Admin gebelik ekranı (personel oturumu) |
| `doctor_notes` | Girişsiz okuma, yazma, silme; boş | Hasta detay ekranı (personel oturumu) |
| `patients` | Girişsiz ekleme ve güncelleme kuralı; **personelin güncelleme yetkisi de yalnızca bu açık kuraldan geliyor** | Hasta detay ve fotoğraf ekranı (personel oturumu) |
| `patient_documents`, `message_templates`, `sent_messages`, `sms_verifications`, `references`, dosya deposu | "Giriş yapmış herkes" (`references` girişsiz de) | Admin ekranları |

## Review Focus

1. `patients` için yeni personel güncelleme kuralı eklenmeden eski açık kural kaldırılırsa hasta düzenleme ve fotoğraf yükleme durur — 07 dosyasında önce ekleme, sonra kaldırma; aynı işlemde.
2. Herkese açık randevu akışı (`/randevu` → kod → onay) hiçbir adımdan etkilenmemeli: yalnızca `doctors` ve `doctor_schedules` okumasını girişsiz yapar, gerisini servis rolüyle.
3. Hasta belgelerinin imzalı bağlantıları (hasta listesi ve detay) 08. adımdan sonra açılmaya devam etmeli.
4. Canlı liste (realtime) `appointments` okuma kuralına bağlıdır; o kurala dokunulmaz.
5. Kayıtlı zengin metin (gebelik vizitesi, infertilite formu): araç çubuğunun ürettiği biçimler (kalın, italik, altı çizili, renk, vurgu, liste) süzgeçten sonra aynen görünmeli.

---

### Task 1: Zengin metin süzgeci (G27) — kod, ön izlemede denenir

**Files:**
- Create: `lib/sanitize-rich-text.ts`, `tests/sanitize-rich-text.test.ts`
- Modify: `components/ui/rich-text-editor.tsx:30-31`, `components/admin/infertility/RichTextEditor.tsx:48-49`, `package.json` (`dompurify`; geliştirme için `jsdom`)

**Interfaces:**
- Produces: `sanitizeRichText(html: string | null | undefined): string` — izinli etiketler `b strong i em u span font div p br ul ol li`; izinli öznitelikler `style color`; tarayıcı dışında (`window` yokken) boş metin döner.

- [ ] **Step 1: Testi yaz** (`// @vitest-environment jsdom`): `<script>`, `<img onerror>`, `<a href="javascript:…">`, `onclick` özniteliği çıktıda yok; `<b>`, `<i>`, `<u>`, `<ul><li>`, `<font color="#ff0000">`, `<span style="background-color: yellow">` aynen kalır; `null` → `""`.
- [ ] **Step 2:** `pnpm test tests/sanitize-rich-text.test.ts` → Expected: FAIL (modül yok).
- [ ] **Step 3:** Bağımlılıkları ekle, işlevi yaz; iki düzenleyicide `innerHTML = value || ""` satırı `innerHTML = sanitizeRichText(value)` olur.
- [ ] **Step 4:** `pnpm test` → PASS; derleme başarılı; `tsc` sayısı ≤ 52.
- [ ] **Step 5:** Commit: `fix(security): sanitize stored HTML before loading it into rich text editors`

### Görev 2–9 için ortak akış (her veritabanı adımı)

- [ ] **A — Önce durumu kaydet:** aşağıdaki "Doğrulama" sorgusunu çalıştır, sonucu not et (değişiklikten önceki hâl).
- [ ] **B — Onay al:** kullanıcıya adımın ne yaptığını tek cümleyle söyle; "evet" gelmeden devam etme.
- [ ] **C — Uygula:** `scripts/rls/NN_….sql`. Hata verirse işlem geri sarılır; hiçbir şey değişmemiştir, dur ve nedenini bul.
- [ ] **D — Doğrula:** aynı sorgu artık "Beklenen"i veriyor.
- [ ] **E — Ekranı dene (kullanıcı):** adımın "Denenecek ekran" satırı. Hata varsa `scripts/rls/NN_geri_al.sql`.
- [ ] **F — Kaydet:** ana planda ilgili G satırına "Uygulandı (tarih)" yaz; commit.

Doğrulama iki yoldan yapılır:
- **Kural listesi:** `select tablename, policyname, cmd, roles from pg_policies where tablename = '…'` (salt okunur).
- **Dışarıdan:** girişsiz istek, site anahtarıyla (herkese açık anahtar; `supabase projects api-keys --project-ref wchkcpxxllwpvluxkzgu` ile alınır, çıktıya yazılmaz): `curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/<tablo>?select=id&limit=1" -H "apikey: $ANON" -H "Prefer: count=exact" -I` ve `content-range` başlığı.

### Task 2: Kullanılmayan tablolar (G21) — `01_kullanilmayan_tablolar.sql`
- Doğrulama: sekiz tabloda kural sayısı. Önce 13, **Beklenen: 0**. Girişsiz `POST /rest/v1/hormone_tests` → Beklenen: 401/403.
- Denenecek ekran: yok (kod kullanmıyor); admin ana sayfası açılıyor mu, bir bakış.

### Task 3: Form belirteçleri ve randevu ekleme — `02_baglanti_ve_randevu_ekleme.sql`
- Doğrulama: `appointment_access_tokens` üzerinde yalnızca servis rolü kuralı kalır; `appointments` ekleme kuralı `appointments_insert_admin`. Girişsiz `POST /rest/v1/appointments` → Beklenen: 401/403.
- Denenecek ekran: `/randevu` üzerinden deneme randevusu (kod → onay) ve admin sihirbazıyla bir randevu.

### Task 4: Fotoğraf klasörü (G25) — `03_fotograf_klasoru.sql`
- Ön koşul (salt okunur): `patients.profile_photo_url`, `patients.spouse_photo_url`, `patient_documents.file_url` içinde `patient-photos` geçen satır sayısı 0 olmalı (ilk ikisi 11.11.2026'da 0; `spouse_photo_url` uygulamadan önce kontrol edilir). 0 değilse dur.
- Doğrulama: `storage.buckets.public = false`; klasördeki bir dosyanın herkese açık adresi → Beklenen: 400/404.
- Denenecek ekran: hasta listesinde ve detayında fotoğraflar görünüyor (bunlar `patient-documents` klasöründen imzalı bağlantıyla gelir).

### Task 5: İşlevler (G26) — `04_islevler.sql`
- Doğrulama: `select proname, has_function_privilege('anon', oid, 'EXECUTE') from pg_proc where proname in (…)` → Beklenen: dördü de `false`; `authenticated` için `true`.
- Denenecek ekran: admin hasta araması (üst arama kutusu) ve hızlı blok.

### Task 6: Gebelik tabloları (G20) — `05_gebelik.sql`
- Doğrulama: girişsiz `GET /rest/v1/pregnancy_episodes?select=id` → önce 3 satır sayısı, **Beklenen: 0**.
- Denenecek ekran: bir hastanın gebelik sekmesi: kayıtlar listeleniyor, vizite açılıyor, yeni vizite kaydediliyor.

### Task 7: Doktor notları (G22) — `06_doktor_notlari.sql`
- Doğrulama: kural listesinde yalnızca `doctor_notes_staff_all`; girişsiz `POST /rest/v1/doctor_notes` → 401/403.
- Denenecek ekran: hasta detayında not ekleme ve notların listelenmesi (doktor ve sekreter hesabıyla).

### Task 8: Hastalar (G23) — `07_hastalar.sql`
- Doğrulama: `patients` kuralları: `patients_select_admin`, `patients_update_admin`, `patients_insert_admin`; `anon` rolüne kural yok. Girişsiz `PATCH /rest/v1/patients?id=eq.<olmayan kimlik>` → 401/403 ya da 0 satır.
- Denenecek ekran: hasta detayında bilgi düzenleme ve kaydetme; hasta fotoğrafı yükleme; eş fotoğrafı; `/randevu` üzerinden **yeni** bir hastayla deneme randevusu (yeni kayıt açılmalı); admin hızlı hasta ekleme.

### Task 9: "Giriş yapmış herkes" kuralları (G24) — `08_giris_yapmis_herkes.sql`
- Doğrulama: altı tabloda ve `storage.objects` üzerinde `using (true)` içeren kural kalmadı: `select count(*) from pg_policies where (qual = 'true' or with_check = 'true') and tablename in (…)` → Beklenen: 0.
- Denenecek ekran: hasta belgesi yükleme, görüntüleme ve silme; SMS şablonları sayfası (listele, düzenle); serbest SMS gönderimi; hızlı hasta ekleme; geçici kaydı tamamlama (SMS kodu); hasta detayında "yönlendiren" listesi ve yeni yönlendiren ekleme; hasta listesinde fotoğraflar.

### Task 10: Kapanış
- [ ] Salt okunur son tarama: `anon` rolünün okuyabildiği tablolar yalnızca `doctors`, `doctor_schedules`, `doctor_weekly_patterns` (program okuması; bilinçli olarak açık bırakıldı).
- [ ] Ana planda G20–G27 "Tamamlandı"; `scripts/rls/` kayıt olarak depoda kalır.

## Bu planın kapsamadığı, bilerek bırakılanlar

- `doctor_weekly_patterns` girişsiz okunabilir kalır (haftalık çalışma saatleri; hassas değil, takvim okumasıyla aynı sınıf).
- `appointment_forms` personel kuralı e-posta eşleşmesiyle çalışıyor; doğru sonuç veriyor, biçim birliği için Plan 4'te ele alınabilir.
- Depoda dosya **güncelleme** kuralı bugün de yok (fotoğrafı aynı adla yeniden yükleme); davranış aynı kalır.
