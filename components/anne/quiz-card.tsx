"use client"

import { useState } from "react"
import type { QuizQuestion } from "@/lib/anne/content/quiz"

/** Günün sorusu: üç şık, seçince doğru yanıt ve kısa açıklama görünür. */
export function QuizCard({ question, sourceTitle }: { question: QuizQuestion; sourceTitle: string }) {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null

  return (
    <>
      <p style={{ marginTop: 26, fontSize: 15 }}>Günün sorusu</p>
      <h1 style={{ marginTop: 6 }}>
        <b>{question.lead}</b> {question.rest}
      </h1>
      <div style={{ marginTop: 18 }}>
        {question.options.map((label, i) => (
          <button
            key={label}
            className="nb-opt"
            type="button"
            disabled={answered}
            data-state={!answered ? undefined : i === question.answer ? "ok" : i === picked ? "no" : undefined}
            onClick={() => setPicked(i)}
          >
            {label}
          </button>
        ))}
      </div>
      <p style={{ marginTop: 14, fontSize: 15, minHeight: 44 }} aria-live="polite">
        {answered && (
          <>
            <b>{picked === question.answer ? "Bildin!" : "Bu sefer olmadı."}</b> {question.explanation}
          </>
        )}
      </p>
      <p style={{ marginTop: 6, fontSize: 12 }}>Kaynak: {sourceTitle}.</p>
    </>
  )
}
