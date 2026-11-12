"use client"

export type DateKind = "lmp" | "due"

/** "Son adet tarihi" / "Tahmini doğum tarihi" seçimi ve tek tarih alanı. */
export function DateChoice({
  kind,
  value,
  onKind,
  onValue,
  today,
}: {
  kind: DateKind
  value: string
  onKind: (kind: DateKind) => void
  onValue: (value: string) => void
  today: string
}) {
  return (
    <>
      <div className="anne-choice" role="group" aria-label="Hangi tarihi biliyorsunuz?">
        <button type="button" aria-pressed={kind === "lmp"} onClick={() => onKind("lmp")}>
          Son adet tarihi
        </button>
        <button type="button" aria-pressed={kind === "due"} onClick={() => onKind("due")}>
          Tahmini doğum tarihi
        </button>
      </div>

      <label className="anne-field">
        <span>{kind === "lmp" ? "Son adetinizin ilk günü" : "Size söylenen tahmini doğum tarihi"}</span>
        <input
          className="anne-input"
          type="date"
          value={value}
          max={kind === "lmp" ? today : undefined}
          min={kind === "due" ? today : undefined}
          onChange={(e) => onValue(e.target.value)}
          required
        />
      </label>
    </>
  )
}
