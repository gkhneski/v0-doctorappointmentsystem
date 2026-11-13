"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { send } from "@/components/anne/api"
import type { Theme } from "@/lib/anne/theme"

const OPTIONS: { value: Theme | null; label: string; swatch: string }[] = [
  { value: null, label: "Bebeğime göre", swatch: "linear-gradient(90deg, #f9bfd0 50%, #c4e0f7 50%)" },
  { value: "kiz", label: "Pembe", swatch: "#f9bfd0" },
  { value: "erkek", label: "Mavi", swatch: "#c4e0f7" },
  { value: "sade", label: "Sade", swatch: "#eadcf6" },
]

/** Uygulamanın renkleri: bebeğin cinsiyetine göre ya da annenin seçtiği tema. */
export function ThemePicker({ choice }: { choice: Theme | null }) {
  const router = useRouter()
  const [value, setValue] = useState(choice)
  const [error, setError] = useState("")

  async function choose(next: Theme | null) {
    const before = value
    setValue(next)
    setError("")
    const result = await send("/api/anne/tema", "PUT", { theme: next }, "Renk kaydedilemedi. Lütfen yeniden dene.")
    if (!result.ok) {
      setValue(before)
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <>
      <div className="nb-themes" role="group" aria-label="Uygulamanın renkleri">
        {OPTIONS.map((option) => (
          <button key={option.label} type="button" aria-pressed={value === option.value} onClick={() => void choose(option.value)}>
            <i style={{ background: option.swatch }} />
            {option.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
