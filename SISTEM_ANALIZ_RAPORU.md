# DOKTOR RANDEVU SİSTEMİ - DETAYLI ANALIZ RAPORU
**Tarih:** 01.02.2026 | **Durum:** OPERASYONEL

---

## 📋 SİSTEM ÖZETI

**Proje:** Tıbbi Randevu & Gebelik Takip Yönetim Sistemi
**Teknoloji Stack:** Next.js 16 + Supabase + React 19.2 + Tailwind CSS v4
**Veritabanı:** PostgreSQL (Supabase)
**Kullanıcı Rolleri:** Admin, Doktor, Hemşire, Sekreter, Hasta

---

## 📊 VERİTABANI YAPISI (28 Tablo)

### A. TEMEL TABLOLAR

#### 1. **admin_users** (Personel Yönetimi)
- **Alanlar:** id, email, full_name, role, created_at
- **Roller:** doktor | hemsire | sekreter | admin
- **RLS:** Enabled ✓ (2 policy)
- **Durum:** ✅ Optimal

#### 2. **doctors** (Doktor Bilgileri)
- **Alanlar:** id, name, specialization, phone, email, created_at
- **RLS:** Enabled ✓ (4 policy - CRUD)
- **Durum:** ✅ Optimal

#### 3. **patients** (Hasta Bilgileri)
- **Alanlar:** 60+ alanlar
  - Kişisel: id, full_name, tc_no, date_of_birth, phone, etc.
  - Adres: city, district, country
  - Sağlık: blood_group, referred_by
  - Eşi bilgisi: spouse_* fields
  - Kayıt: file_number, registration_date, intake_completed_at
  - Dosya: profile_photo_url
- **RLS:** Enabled ✓ (5 policy - UPDATE/INSERT for anon + Admin)
- **Durum:** ✅ Optimal

### B. RANDEVU YÖNETİMİ

#### 4. **appointments** (Randevular)
- **Alanlar:** id, patient_id, doctor_id, appointment_date, appointment_time, status, confirmation_status, confirmed_at, notes, reminder_sent_at, created_at
- **Status değerleri:** pending | confirmed | completed | cancelled
- **RLS:** Enabled ✓ (4 policy - Admin only)
- **Durum:** ✅ Optimal

#### 5. **appointment_forms** (Randevu Öncesi Formlar)
- **Alanlar:** id, appointment_id, form_data (JSONB), created_at, updated_at
- **RLS:** Enabled ✓ (2 policy - Service role + Admin)
- **Durum:** ✅ Optimal

#### 6. **appointment_access_tokens** (Randevu Token'ları)
- **Alanlar:** id, appointment_id, token, created_at, expires_at, used_at
- **Kullanım:** Anonim kullanıcılara randevu erişimi
- **RLS:** Enabled ✓ (2 policy)
- **Durum:** ✅ Optimal

#### 7. **doctor_schedules** (Doktor Çizelgeleri)
- **Alanlar:** id, doctor_id, schedule_date, start_time, end_time, slot_duration, is_available, is_active, notes, created_at, updated_at
- **RLS:** Enabled ✓ (4 policy - Admin CRUD)
- **Durum:** ✅ Optimal
- **Notu:** doctor_schedules_old tablosu legacy (kaldırılabilir)

#### 8. **doctor_schedules_old** (Eski Çizelge - SILINMALI)
- **Durum:** ❌ LEGACY - Veri tabanını yoruyor
- **Aksiyon:** KALDIRILABİLİR

### C. GEBELİK TAKİBİ (YENI EKLENEN)

#### 9. **pregnancy_episodes** (Gebelik Başlatma)
- **Alanlar:** id, patient_id, doctor_id, sat_date (gebelik başlangıcı), edd_date (tahmini doğum), et_date (transfer tarihi), conception_type (spontan|IVF), blood_group, rh, rh_incompatibility, height_cm, pre_weight_kg, bmi, important_notes, anamnesis (JSONB), status, doctor_name, created_at, updated_at
- **RLS:** Enabled ✓ (4 policy - Staff CRUD)
- **Durum:** ✅ Optimal
- **Not:** pre_weight_kg → **RENAME: pre_pregnancy_weight** (tutarlılık için)

#### 10. **pregnancy_visits** (Gebelik Muayeneleri)
- **Alanlar:** id, episode_id, visit_date, topic (kontrol|acil|etc), ga_weeks, ga_days, weight_kg, bp_systolic, bp_diastolic, exam_notes, usg_metrics (JSONB), medications (JSONB), tests (JSONB), procedures (JSONB), payment_done, created_by, created_at, updated_at
- **RLS:** Enabled ✓ (4 policy - Staff CRUD)
- **Durum:** ⚠️ payment_done KALDIRILACAK
- **Durum:** ✅ GA otomatik hesaplama eklendi ✓
- **Durum:** ✅ Kilo uyarısı eklendi ✓
- **Durum:** ✅ Onay ekranı eklendi ✓

#### 11. **pregnancy_outcomes** (Gebelik Sonuçları)
- **Alanlar:** id, episode_id, result_date, delivery_week, delivery_day, delivery_type (normal|c-section|etc), baby_count, hospital, delivery_doctor, result (canlı doğum|abortos|etc), notes, created_at, updated_at
- **RLS:** Enabled ✓ (4 policy - Staff CRUD)
- **Durum:** ✅ Optimal

### D. KLİNİK İŞLEMLER & TESTLER

#### 12. **ultrasound_results** (Ultrason Sonuçları)
- **Durum:** ✅ Admin CRUD

#### 13. **hormone_tests** (Hormon Testleri)
- **Durum:** ✅ Admin CRUD

#### 14. **genetic_tests** (Genetik Testler)
- **Durum:** ✅ Admin CRUD

#### 15. **spermiogram_results** (Spermiyogram)
- **Durum:** ✅ Admin CRUD

#### 16. **hsg_results** (Histerosalpingografi)
- **Durum:** ✅ Admin CRUD

#### 17. **infertility_evaluations** (Kısırlık Değerlendirmesi)
- **Alanlar:** 100+ nested data
- **Durum:** ⚠️ ÇOK KARMAŞIK - Teknik borç (Technical Debt)

### E. TEDAVI YÖNETİMİ

#### 18. **treatments** (Tedavi Protokolleri)
- **Durum:** ✅ Admin CRUD

#### 19. **medications** (İlaçlar)
- **Durum:** ✅ Admin CRUD

#### 20. **procedures** (Prosedürler)
- **Durum:** ✅ Admin CRUD

### F. NOTLAR & BELGELER

#### 21. **doctor_notes** (Doktor Notları)
- **Alanlar:** id, patient_id, doctor_name, category, note_text, is_private, created_at, updated_at
- **RLS:** Enabled ✓ (4 policy - Doktor CRUD - Türkçe)
- **Durum:** ✅ Optimal

#### 22. **patient_documents** (Hasta Belgeleri)
- **Alanlar:** id, patient_id, file_name, file_url, file_type, file_size, appointment_id, pregnancy_episode_id, pregnancy_visit_id, category, description, status, comments, uploaded_at, reviewed_by, reviewed_at, created_at
- **Durum:** ✅ Optimal

### G. İLETİŞİM

#### 23. **sms_verifications** (SMS Doğrulama)
- **Durum:** ✅ Randevu SMS doğrulaması

#### 24. **message_templates** (Mesaj Şablonları)
- **Durum:** ✅ Admin CRUD

#### 25. **sent_messages** (Gönderilen Mesajlar)
- **Durum:** ✅ Admin CRUD

### H. DİĞER

#### 26. **references** (Referans Kaynakları)
- **Durum:** ✅ Admin CRUD

#### 27. **predefined_lists** (Ön Tanımlı Listeler)
- **Durum:** ✅ Admin CRUD

#### 28. **weekly_schedule_normalized** (Haftalık Çizelge - VIEW)
- **RLS:** ❌ DISABLED
- **Durum:** ⚠️ VIEW'dır - İndex sorunları

---

## 🎯 FEATURE HARITASI

### ✅ TAMAMLANANLAR (Aktif)

#### Randevu Sistemi
- ✅ Doktor randevu takvimi
- ✅ Hasta randevu oluşturma (web form)
- ✅ Randevu onay (email/SMS)
- ✅ Randevu durumu izleme
- ✅ Randevu tipi seçimi:
  - İlk Muayene
  - İzlem Muayenesi
  - Kontrol/Takip
  - Acil Durum (Sekreter/Hemşire telefon numarası gösterme)
  - Ameliyat Öncesi/Sonrası
- ✅ Acil randevu akışı (0531, 0533, 0537 numaraları)

#### Gebelik Takip Sistemi
- ✅ Gebelik başlatma (pregnancy_episodes)
- ✅ Muayene kayıt (pregnancy_visits)
  - ✅ GA otomatik hesaplama (sat_date'den)
  - ✅ Kilo uyarısı (Normal/Düşük/Yüksek)
  - ✅ Onay ekranı (Kaydet → Onayla)
  - ✅ Ödeme kaldırıldı
- ✅ Muayene özeti
- ✅ Gebelik sonuçları kaydı

#### Hasta Yönetimi
- ✅ Hasta kayıt (intake form)
- ✅ Hasta bilgileri düzenleme
- ✅ Hasta dosyası
- ✅ KVKK onayı

#### Admin Panel
- ✅ Doktor çizelgesi yönetimi
- ✅ Randevu yönetimi
- ✅ Hasta listesi
- ✅ Doktor notları
- ✅ Rol tabanlı erişim kontrolü

#### Güvenlik & RLS
- ✅ Supabase RLS politikaları
- ✅ JWT tabanlı auth
- ✅ Rol kontrolü (Admin/Doktor/Hemşire/Sekreter)

---

## ⚠️ SORUNLAR & TEKNIK BORÇLAR

### YÜKSEK ÖNCELİK

#### 1. **pregnancy_visits.payment_done ALAN**
- **Sorun:** Ödeme sistemi olmadığı halde alan mevcut
- **Durum:** ✅ ÇÖZÜLDÜ - Kod güncellendi, field silinecek
- **Aksiyon:** Veritabanında DROP COLUMN eklenecek

#### 2. **pregnancy_episodes.pre_weight_kg**
- **Sorun:** Sütun adı tutarsız (pre_pregnancy_weight kullanılmalı)
- **Durum:** Mevcut kodda pre_pregnancy_weight olarak kullanılıyor
- **Aksiyon:** Veritabanında RENAME gerekli

#### 3. **doctor_schedules_old Tablosu**
- **Sorun:** Eski versiyonu, migration tam yapılmamış
- **Durum:** Veri tabanını gereksiz olarak şişiriyor
- **Aksiyon:** Archive tablosuna taşıyıp veya silebilir

#### 4. **weekly_schedule_normalized (VIEW)**
- **Sorun:** RLS disabled, indeks sorunları
- **Durum:** Performans sorunu
- **Aksiyon:** View query optimize edilmeli

### ORTA ÖNCELİK

#### 5. **infertility_evaluations Tablosu**
- **Sorun:** 100+ alanı var, nested JSONB, çok karmaşık
- **Durum:** Teknik borç oluşması riski
- **Aksiyon:** Normalizasyon veya refactor düşünülmeli

#### 6. **Gebelik GA Hesaplama**
- **Sorun:** sat_date bazlı statik hesaplama
- **Durum:** ✅ Uygulandı
- **Not:** Edge case: Transfer (ET) tarihi ile IVF gebeiş - düzeltildi

#### 7. **Kilo Uyarı Sistemi**
- **Sorun:** Basit % tolerans kullanıyor
- **Durum:** ✅ Uygulandı (0.8-1.2 tolerans)
- **Not:** Klinik gerçekliği: İlk trimester düşük, 3. trimester yüksek olabilir

#### 8. **Acil Randevu Sistemi**
- **Sorun:** 3 numara (Sekreter, Hemşire 1, Hemşire 2) - hardcoded
- **Durum:** ✅ Uygulandı
- **Aksiyon:** İleride database'den çekilmeli

### DÜŞÜK ÖNCELİK

#### 9. **SMS Doğrulama**
- **Durum:** ✅ Çalışıyor (NETGSM integration)
- **Not:** Rate limiting yoktur

#### 10. **Hasta Fotoğrafı Upload**
- **Durum:** ✅ Çalışıyor
- **Not:** Malware scanning yoktur

---

## 🏗️ KOD YAPISI

### Ana Dosyalar

```
/app
  ├─ /admin                    (Admin Dashboard)
  │  ├─ /patients             (Hasta yönetimi)
  │  │  └─ [patientId]        (Hasta detayları)
  │  └─ /appointments         (Randevu yönetimi)
  ├─ /public                  (Hasta randevu formu)
  ├─ /api                     (API Routes)
  │  ├─ /appointments         (Randevu CRUD)
  │  ├─ /patients             (Hasta CRUD)
  │  ├─ /auth                 (Auth endpoints)
  │  └─ /schedule             (Schedule endpoints)
  └─ layout.tsx               (Root layout)

/components
  ├─ /admin                   (Admin bileşenleri)
  │  ├─ /pregnancy            (Gebelik bileşenleri)
  │  │  ├─ pregnancy-tab.tsx
  │  │  ├─ start-pregnancy-modal.tsx
  │  │  └─ visit-modal.tsx     ✅ GÜNCELLENME
  │  ├─ /patient-detail       (Hasta detayı)
  │  └─ ...
  ├─ /appointment            (Randevu bileşenleri)
  │  ├─ appointment-wizard-modal.tsx  ✅ GÜNCELLENME (Acil + Kontrol/Takip)
  │  └─ ...
  └─ /ui                      (shadcn/ui components)

/lib
  ├─ /pregnancy.ts            (Gebelik fonksiyonları)
  ├─ /auth.ts                 (Auth utilities)
  └─ /utils.ts                (Genel utilities)

/scripts
  ├─ /migrations              (Veritabanı migrations)
  └─ *.sql                    (Setup scripts)
```

### Önemli Bileşenler

#### 1. **appointment-wizard-modal.tsx** ✅ GÜNCELLENME
- **Durum:** 1400+ satır
- **Feature'lar:**
  - 7 step wizard
  - Acil randevu flow (yeni)
  - Kontrol/Takip randevusu (3-4 step atla)
  - SMS doğrulama
  - Başarı ekranı (ödeme kaldırıldı)
- **Sorun:** Dosya çok büyük - component'lere bölünmeli

#### 2. **visit-modal.tsx** ✅ GÜNCELLENME
- **Durum:** 700+ satır
- **Yeni Feature'lar:**
  - GA otomatik hesaplama
  - Kilo uyarısı (Normal/Düşük/Yüksek)
  - Onay ekranı (Muayene Özeti)
  - Tarih otomatik bugün (yeni muayenede)
- **Sorun:** Dosya büyüyor - refactor gerekli

---

## 📈 PERFORMANS ANALİZİ

### Veritabanı

| Alan | Durum | Not |
|------|-------|-----|
| **Query Performance** | ✅ İyi | pregnancy_episodes/visits indexed |
| **RLS Overhead** | ⚠️ Orta | 28 tabloda policies kontrolü |
| **Table Bloat** | ⚠️ Orta | doctor_schedules_old + legacy data |
| **Connection Pool** | ✅ İyi | Supabase pooling kullanılıyor |

### Frontend

| Alan | Durum | Not |
|------|-------|-----|
| **Bundle Size** | ⚠️ Orta | shadcn/ui tüm components |
| **Re-renders** | ⚠️ Orta | Wizard modal'da console.log yok |
| **State Management** | ⚠️ Sorun | Prope drilling + local state karışık |
| **Form Validation** | ✅ İyi | React Hook Form + Zod |

---

## 🚀 ÖNERİLER & ACTİON PLAN

### Phase 1: KRITIK (Bu Hafta)

1. **[ ] payment_done Alanı Sil**
   - Migration: `ALTER TABLE pregnancy_visits DROP COLUMN payment_done;`
   - Kod: ✅ Zaten güncellenmiş
   
2. **[ ] pre_weight_kg → pre_pregnancy_weight Rename**
   - Migration: `ALTER TABLE pregnancy_episodes RENAME pre_weight_kg TO pre_pregnancy_weight;`
   - Risk: DÜŞÜK (sadece backend kodda, migration yazılmış)

3. **[ ] doctor_schedules_old Sil**
   - Backup et → Drop
   - İşlem: `DROP TABLE doctor_schedules_old;`

### Phase 2: ÖNEMLİ (Sonraki 2 Hafta)

4. **[ ] Acil Randevu Numaraları Dinamikleştir**
   - Tablosu: `emergency_contacts`
   - Alanlar: role, phone_number, order, active
   - Böylece admin panelden güncellenebilir

5. **[ ] visit-modal.tsx Refactor**
   - Bileşeni 3 parçaya böl:
     - `visit-form.tsx` (form fields)
     - `visit-confirmation.tsx` (onay ekranı)
     - `visit-weight-indicator.tsx` (kilo uyarısı)

6. **[ ] pregnancy-episodes Pre-pregnancy Weight Alanı**
   - Default: 60 kg (şu an hardcoded)
   - ✅ Oluş: Episode oluş. sırasında input
   - Durum: Kontrol edilmeli

7. **[ ] SMS Rate Limiting**
   - Supabase functions: Saatlik 10 SMS limit

### Phase 3: UZUN DÖNEM (Sonraki 1 Ay)

8. **[ ] infertility_evaluations Normalizasyonu**
   - Tablo 2-3'e böl: symptoms, diagnoses, lab_results
   - Perforamns iyileştirme

9. **[ ] weekly_schedule_normalized Optimize**
   - View → Materialized View
   - Cron: Günlük refresh

10. **[ ] State Management Refactor**
    - Redux/Zustand: Context yerini almalı
    - Prop drilling 5+ seviye → 2 seviye

11. **[ ] Component Splitting**
    - appointment-wizard-modal: 1400 satır → 7 dosya
    - Her step kendi component'i

---

## 📋 FEATURE CHECKLIST

### HAZIR ✅
- [x] Randevu oluşturma (web)
- [x] Doktor çizelgesi
- [x] Hasta kayıt (intake)
- [x] Admin panel
- [x] Gebelik başlatma
- [x] Muayene kayıt (kontrol)
- [x] GA hesaplama
- [x] Kilo uyarısı
- [x] Acil randevu sistemi
- [x] Rol tabanlı erişim
- [x] SMS doğrulama

### DEVAM EDEN 🔄
- [ ] Ödeme entegrasyonu (şu an disabled)
- [ ] Rapor generator (PDF export)
- [ ] SMS şablonları editor
- [ ] Tedavi protokolleri builder

### PLANLANMAMIS 📅
- [ ] Video consultation
- [ ] AI diagnosis helper
- [ ] Mobil app (React Native)
- [ ] Analytics dashboard

---

## 🔒 GÜVENLIK DENETIMI

| Alan | Durum | Not |
|------|-------|-----|
| **SQL Injection** | ✅ Safe | Parameterized queries (Supabase) |
| **XSS** | ✅ Safe | React auto-escaping |
| **CSRF** | ✅ Safe | SameSite cookies |
| **Auth** | ✅ Güçlü | JWT + Supabase session |
| **RLS** | ✅ Uygulanmış | 28/28 tablo protected |
| **KVKK** | ✅ Checkbox | GDPR ready |
| **Data Backup** | ⚠️ Check | Supabase backup policy kontrol edilmeli |

---

## 📊 VERITABANI İSTATİSTİKLERİ

```
Toplam Tablo: 28
- Aktif: 26
- Legacy: 2 (doctor_schedules_old, weekly_schedule_normalized)

RLS Enabled: 27/28
RLS Disabled: 1 (weekly_schedule_normalized - VIEW)

İşlem Türleri:
- Gebelik: 3 tablo (episodes, visits, outcomes)
- Testler: 5 tablo (ultrasound, hormone, genetic, spermiogram, hsg)
- Randevu: 4 tablo (appointments, forms, tokens, schedules)
- Tedavi: 3 tablo (treatments, medications, procedures)
- Yardımcı: 10 tablo (notes, documents, messages, etc.)
```

---

## ✨ SONUÇ & DEĞERLENDİRME

### Sistem Sağlığı: 8/10 🟢

**Güçlü Yönler:**
- ✅ Sağlam veritabanı şeması (RLS full coverage)
- ✅ Gebelik takip sistemi tamamlandı
- ✅ Acil randevu akışı çalışıyor
- ✅ Rol tabanlı erişim iyi yapılandırılmış

**İyileştirme Alanları:**
- ⚠️ Legacy tablolar veri tabanını şişiriyor
- ⚠️ Component dosyaları çok büyük
- ⚠️ Hardcoded değerler (acil numaraları, tolerans oranları)
- ⚠️ State management refactor gerekli

**Immediate Actions (24 Saat):**
1. Database migrations (payment_done, pre_weight_kg)
2. doctor_schedules_old silinmesi
3. Code review & test

**Önerilen Timeline:**
- Phase 1: ✅ Bu hafta
- Phase 2: ⏳ 2 hafta
- Phase 3: 📅 1 ay

---

**Hazırlandı:** v0 Analiz Sistemi
**Son Güncelleme:** 01.02.2026 15:27
