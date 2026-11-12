import Link from "next/link"
import { DANGER_ACTION, DANGER_SIGNS, DANGER_SOURCES } from "@/lib/anne/content/danger-signs"
import { SourceLine } from "@/components/anne/week-note"

// Girişsiz de açılır: acil bilgi kimseden saklanmaz.
export default function AnneTehlikeIsaretleriPage() {
  return (
    <main>
      <header className="anne-bar">
        <Link className="anne-brand" href="/anne">
          NeoBreed
        </Link>
        <Link href="/anne">Geri</Link>
      </header>

      <h1>Gebelikte tehlike işaretleri</h1>
      <p className="anne-lead anne-alert">{DANGER_ACTION}</p>

      <section className="anne-section">
        <h2>İşaretler</h2>
        <ol className="anne-signs">
          {DANGER_SIGNS.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ol>
        <p className="anne-note" style={{ marginTop: 16 }}>
          Bu uygulama belirtilerinizi değerlendirmez ve doktorunuzun yerini tutmaz. Emin olamadığınız her durumda sağlık
          kuruluşuna başvurun.
        </p>
        <SourceLine sources={DANGER_SOURCES} />
      </section>
    </main>
  )
}
