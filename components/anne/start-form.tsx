"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { resolvePregnancyStart } from "@/lib/anne/pregnancy"
import { DateChoice, type DateKind } from "@/components/anne/date-choice"

/** Başlangıç formu; aynı form sonradan bilgileri düzeltmek için de kullanılır. */
export function StartForm({
  today,
  initial,
  submitLabel,
}: {
  today: string
  initial?: { displayName: string; kind: DateKind; value: string }
  submitLabel: string
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
    try {
      const response = await fetch("/api/anne/ben", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, ...(kind === "lmp" ? { lmp: value } : { dueDate: value }) }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.status === 401) {
        router.replace("/anne/giris")
        return
      }
      if (!response.ok) {
        setBusy(false)
        setError(data.error ?? "Kaydedilemedi. Lütfen yeniden deneyin.")
        return
      }
      router.replace("/anne/ana")
      router.refresh()
    } catch {
      setBusy(false)
      setError("Bağlantı kurulamadı. İnternetinizi kontrol edip yeniden deneyin.")
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <label className="anne-field">
        <span>Adınız</span>
        <input
          className="anne-input"
          type="text"
          autoComplete="given-name"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <small>İsteğe bağlı. Yalnızca size hitap etmek için kullanılır.</small>
      </label>

      <DateChoice
        kind={kind}
        value={value}
        today={today}
        onKind={(next) => {
          setKind(next)
          setValue("")
          setError("")
        }}
        onValue={(next) => {
          setValue(next)
          setError("")
        }}
      />

      {error && (
        <p className="anne-error" role="alert">
          {error}
        </p>
      )}
      <button className="anne-button" type="submit" disabled={busy || !value}>
        <span>{busy ? "Kaydediliyor" : submitLabel}</span>
      </button>
    </form>
  )
}
