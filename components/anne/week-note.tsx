import { SOURCES, type SourceKey } from "@/lib/anne/content/sources"
import { WEEKS_SOURCE, weekContent } from "@/lib/anne/content/weeks"

/** İçeriğin dayandığı resmî kaynak; her içerik bölümünün altında gösterilir. */
export function SourceLine({ sources }: { sources: readonly SourceKey[] }) {
  return (
    <p className="anne-source">
      Kaynak:{" "}
      {sources.map((key, i) => (
        <span key={key}>
          {i > 0 && "; "}
          <a href={SOURCES[key].url} target="_blank" rel="noopener noreferrer">
            {SOURCES[key].citation}
          </a>
        </span>
      ))}
      .
    </p>
  )
}

/** Verilen haftada bebeğin gelişimi. Sunucuda da tarayıcıda da çizilebilir. */
export function WeekNote({ week }: { week: number }) {
  const content = weekContent(week)

  if (!content) {
    return (
      <section className="anne-section">
        <h2>Bu hafta</h2>
        <p>
          Tahmini doğum tarihiniz geçti. Bu dönemde nasıl izleneceğinize doktorunuz karar verir; henüz görüşmediyseniz
          doktorunuzu arayın.
        </p>
      </section>
    )
  }

  return (
    <section className="anne-section">
      <h2>{week <= 4 ? "İlk dört hafta" : `${week}. haftada bebeğiniz`}</h2>
      <p>{content.text}</p>

      {(content.length || content.weight) && (
        <dl className="anne-facts" style={{ marginTop: 16 }}>
          {content.length && (
            <div>
              <dt>Boy</dt>
              <dd>{content.length}</dd>
            </div>
          )}
          {content.weight && (
            <div>
              <dt>Ağırlık</dt>
              <dd>{content.weight}</dd>
            </div>
          )}
        </dl>
      )}

      <p className="anne-note" style={{ marginTop: 12 }}>
        Boy ve ağırlık kaynaktaki ortalama değerlerdir; her bebek farklı gelişir. Bebeğinizin ölçülerini doktorunuz
        değerlendirir.
      </p>
      <SourceLine sources={[WEEKS_SOURCE]} />
    </section>
  )
}
