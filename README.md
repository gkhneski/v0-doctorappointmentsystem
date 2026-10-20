# Prof. Dr. Eray Çalışkan — Randevu Sistemi

dreraycaliskan.com sitesi ve klinik yönetim paneli (randevu, hasta dosyası, SMS/Telegram hatırlatmaları).

## Teknoloji

- Next.js 16 (App Router), React 19, Tailwind CSS, shadcn/ui
- Supabase (veritabanı, auth, storage)
- NETGSM (SMS), Telegram (personel bildirimleri)
- Vercel (hosting, cron, AI Gateway)

## Geliştirme

```bash
pnpm install
pnpm dev
```

Gerekli ortam değişkenleri `.env.local` içinde tanımlanmalıdır (Supabase, NETGSM, Telegram, `CRON_SECRET`).

## Yayına alma

`main` dalına yapılan her push Vercel tarafından otomatik olarak yayına alınır.

## Veritabanı

SQL migration dosyaları `scripts/` klasöründedir ve Supabase SQL Editor üzerinden elle çalıştırılır.
