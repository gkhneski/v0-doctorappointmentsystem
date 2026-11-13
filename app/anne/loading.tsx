// Bir ekrandan ötekine geçerken hemen görünen bekleme ekranı. Düğmeye dokunulduğu anda
// açılır; asıl ekran sunucudan gelince yerini ona bırakır.
export default function AnneLoading() {
  return (
    <div className="nb-screen" aria-busy="true">
      <header className="nb-top">
        <span className="nb-brand">NeoBreed</span>
      </header>
      <main className="nb-main" aria-hidden="true">
        <div className="nb-wait" style={{ height: 78, marginTop: 16 }} />
        <div className="nb-wait" style={{ height: "min(432px, 56dvh)", marginTop: 16, borderRadius: 30 }} />
        <div className="nb-wait" style={{ height: 76, marginTop: 12 }} />
        <div className="nb-wait" style={{ height: 76, marginTop: 12 }} />
      </main>
      <span className="nb-visually-hidden" role="status">
        Yükleniyor
      </span>
    </div>
  )
}
