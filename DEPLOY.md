# Vercel'e Deploy Rehberi

## v0 Üzerinden Deploy

1. v0 arayüzünde **Settings** > **Git** > GitHub bağlantısını koparın
2. **Share** butonuna tıklayın
3. **Deploy to Vercel** seçeneğini seçin
4. Vercel hesabınızı bağlayın ve deploy edin

## Manuel Deploy (Eğer v0 çalışmazsa)

### Gereksinimler
```bash
npm install -g vercel
```

### Deploy Adımları

1. **Vercel'e giriş yapın:**
```bash
vercel login
```

2. **Projeyi deploy edin:**
```bash
vercel --prod
```

3. **Environment variables ekleyin:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NETGSM_USER_CODE
vercel env add NETGSM_PASSWORD
```

## Mevcut Vercel Project ID

Proje ID: `prj_nhQ4GHX3aVTcvfioQYFWpzpzHTxR`
Team: `gkhneskis-projects`

Bu ID ile zaten bir Vercel projesi var. Doğrudan bu projeye deploy edebilirsiniz.

## Önemli Notlar

- GitHub bağlantısı kesildiğinde otomatik deployment durur
- Her değişiklik için manuel deploy yapmanız gerekir
- Environment variables Vercel dashboard'dan kontrol edilmeli
