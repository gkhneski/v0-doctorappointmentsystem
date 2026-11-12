"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { resolvePregnancyStart } from "@/lib/anne/pregnancy"
import { send } from "@/components/anne/api"

export type DateKind = "lmp" | "due"

/** Başlangıç formu; aynı form Hesap ekranında bilgileri düzeltmek için de kullanılır. */
export function StartForm({
  today,
  initial,
  submitLabel,
  next,
}: {
  today: string
  initial?: { displayName: string; kind: DateKind; value: string }
  submitLabel: string
  /** Kaydedince gidilecek ekran. */
  next: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.displayName ?? "")
  const [kind, setKind] = useState<DateKind>(initial?.kind ?? "lmp")
  const [value, setValue] = useState(initial?.value ?? "")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function save() {
    const check = resolvePregnancyStart(kind === "lmp" ? { lmp: value } : { dueDate: value }, today)
    if (!check.ok) {
      setError(check.error)
      return
    }
    setBusy(true)
    setError("")
    const result = await send(
      "/api/anne/ben",
      "PUT",
      { displayName: name, ...(kind === "lmp" ? { lmp: value } : { dueDate: value }) },
      "Kaydedilemedi. Lütfen yeniden deneyin.",
    )
    if (!result.ok) {
      if (result.status === 401) {
        router.replace("/anne/giris")
        return
      }
      setBusy(false)
      setError(result.error)
      return
    }
    router.replace(next)
    router.refresh()
  }

  function pick(nextKind: DateKind) {
    setKind(nextKind)
    setValue("")
    setError("")
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <label className="nb-label" htmlFor="anne-ad">
        Sana nasıl hitap edelim? (isteğe bağlı)
      </label>
      <input
        id="anne-ad"
        className="nb-field"
        type="text"
        autoComplete="given-name"
        maxLength={60}
        placeholder="Adın"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="nb-seg" role="group" aria-label="Hangi tarihi biliyorsun?">
        <button type="button" aria-pressed={kind === "lmp"} onClick={() => pick("lmp")}>
          Son adet tarihi
        </button>
        <button type="button" aria-pressed={kind === "due"} onClick={() => pick("due")}>
          Tahmini doğum
        </button>
      </div>

      <label className="nb-label" htmlFor="anne-tarih" style={{ marginTop: 16 }}>
        {kind === "lmp" ? "Son adetinin ilk günü" : "Sana söylenen tahmini doğum tarihi"}
      </label>
      <input
        id="anne-tarih"
        className="nb-field"
        type="date"
        value={value}
        max={kind === "lmp" ? today : undefined}
        min={kind === "due" ? today : undefined}
        onChange={(e) => {
          setValue(e.target.value)
          setError("")
        }}
        required
      />

      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}
      <button className="nb-btn" type="submit" disabled={busy || !value}>
        {busy ? "Kaydediliyor" : submitLabel}
      </button>
    </form>
  )
}
