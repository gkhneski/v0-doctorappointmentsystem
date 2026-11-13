"use client"

import { useMemo, useState } from "react"
import { QUESTION_CATEGORIES, QUESTIONS, searchQuestions, type QuestionCategory } from "@/lib/anne/content/questions"

/**
 * Soru bankası: Bakanlık kaynaklarına dayanan hazır sorular ve yanıtları. Anne arar ya da
 * konuya göre bakar; yanıtın altında kaynağı yazar. Uygulama burada yeni yanıt üretmez.
 */
export function QuestionBank({ sources }: { sources: Record<string, string> }) {
  const [category, setCategory] = useState<QuestionCategory | "hepsi">("hepsi")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState<string | null>(null)

  const results = useMemo(() => searchQuestions(query, category), [query, category])

  return (
    <>
      <label className="nb-visually-hidden" htmlFor="soru-ara">
        Sorularda ara
      </label>
      <input
        id="soru-ara"
        className="nb-field"
        type="search"
        placeholder="Sorularda ara: bulantı, aşı, uyku…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        style={{ marginTop: 14 }}
      />
      <div className="nb-foodtabs" role="group" aria-label="Konu" style={{ marginLeft: -22, marginRight: -22, paddingLeft: 22, paddingRight: 22 }}>
        <button className="nb-chip" type="button" data-on={category === "hepsi" ? "" : undefined} aria-pressed={category === "hepsi"} onClick={() => setCategory("hepsi")}>
          Hepsi ({QUESTIONS.length})
        </button>
        {QUESTION_CATEGORIES.map((item) => (
          <button key={item.id} className="nb-chip" type="button" data-on={category === item.id ? "" : undefined} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        {results.length === 0 ? (
          <p className="nb-empty">Bu aramaya uyan hazır soru yok. Aşağıdan vizite listene ekleyebilirsin.</p>
        ) : (
          results.map((item) => {
            const isOpen = open === item.id
            return (
              <div className="nb-qa" key={item.id} data-open={isOpen ? "" : undefined}>
                <button type="button" aria-expanded={isOpen} aria-controls={`yanit-${item.id}`} onClick={() => setOpen(isOpen ? null : item.id)}>
                  <span>{item.question}</span>
                  <svg className="nb-ico" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {isOpen && (
                  <div id={`yanit-${item.id}`} className="nb-qa-answer">
                    <p>{item.answer}</p>
                    <small>Kaynak: {sources[item.source]}.</small>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      <p className="nb-note" style={{ marginTop: 12, fontSize: 13 }}>
        Buradaki yanıtlar genel bilgidir; sana özel değerlendirmeyi doktorun yapar. Acil bir durumda beklemeden bir sağlık kuruluşuna başvur.
      </p>
    </>
  )
}
