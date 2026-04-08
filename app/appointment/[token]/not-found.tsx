export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Link Geçersiz</h1>
        <p className="text-gray-600 mb-8">Bu link kullanılmış veya süresi dolmuş olabilir.</p>
        <a href="/randevu" className="text-blue-600 hover:underline">
          Yeni randevu oluştur
        </a>
      </div>
    </div>
  )
}
