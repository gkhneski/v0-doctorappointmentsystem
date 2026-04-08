export const metadata = {
  robots: "noindex, nofollow",
  title: "404 - Sayfa Bulunamadı",
}

// Gizli giris: /ec-sistem-2025 sayfasi kullanicilari
// /auth/admin/login?ref=ec25 adresine yonlendirir
// Login sayfasi bu ref parametresi olmadan giris kabul etmez
export default function GizliGirisPage() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.location.replace('/auth/admin/login?ref=ec25')`,
      }}
    />
  )
}
