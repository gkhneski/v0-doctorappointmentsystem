"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { send } from "@/components/anne/api"

/**
 * Tekme sayacı. Her dokunuş bir hareket sayar; "Kaydet" oturumu saklar.
 * Uygulama sayıyı değerlendirmez ve bir hedef göstermez.
 */
export function KickGame({ baby }: { baby: ReactNode }) {
  const router = useRouter()
  const [count, setCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const startedAt = useRef<number | null>(null)

  function add() {
    if (startedAt.current === null) startedAt.current = Date.now()
    setCount((n) => Math.min(n + 1, 500))
  }

  async function save() {
    setBusy(true)
    setError("")
    const seconds = startedAt.current === null ? 0 : Math.round((Date.now() - startedAt.current) / 1000)
    const result = await send("/api/anne/tekme", "POST", { count, seconds }, "Kaydedilemedi. Lütfen yeniden deneyin.")
    if (!result.ok) {
      setBusy(false)
      setError(result.error)
      return
    }
    router.replace("/anne/ana")
    router.refresh()
  }

  return (
    <>
      <button className="nb-kick" type="button" onClick={add} aria-label="Hareket hissettim, bir ekle">
        {baby}
      </button>
      <p className="nb-count" aria-live="polite">
        {count}
      </p>
      <p className="nb-note" style={{ fontSize: 15 }}>
        tekme
      </p>
      <div className="nb-dots" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="nb-dot" data-on={i < count ? "" : undefined} />
        ))}
      </div>
      <div className="nb-grow" />
      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}
      <button className="nb-btn" type="button" disabled={busy || count === 0} onClick={() => void save()}>
        {busy ? "Kaydediliyor" : "Kaydet"}
      </button>
      <p className="nb-note" style={{ marginTop: 12, fontSize: 13 }}>
        Uygulama sayıyı yorumlamaz. Hareketler azaldıysa bekleme, doktoruna başvur.{" "}
        <Link href="/anne/tehlike-isaretleri">Tehlike işaretleri</Link>
      </p>
    </>
  )
}
