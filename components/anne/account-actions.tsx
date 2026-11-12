"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

/** Çıkış ve hesabı silme. Silme iki adımlıdır: önce sor, sonra sil. */
export function AccountActions() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function call(url: string, method: "POST" | "DELETE", failure: string) {
    setBusy(true)
    setError("")
    try {
      const response = await fetch(url, { method })
      if (!response.ok && response.status !== 401) {
        const data = await response.json().catch(() => ({}))
        setBusy(false)
        setError(data.error ?? failure)
        return
      }
      router.replace("/anne")
      router.refresh()
    } catch {
      setBusy(false)
      setError("Bağlantı kurulamadı. İnternetinizi kontrol edip yeniden deneyin.")
    }
  }

  return (
    <div>
      {error && (
        <p className="anne-error" role="alert">
          {error}
        </p>
      )}

      <button
        className="anne-button"
        data-kind="plain"
        type="button"
        disabled={busy}
        onClick={() => void call("/api/anne/cikis", "POST", "Çıkış yapılamadı. Lütfen yeniden deneyin.")}
      >
        <span>Çıkış yap</span>
      </button>

      {!confirming ? (
        <p className="anne-note" style={{ marginTop: 28 }}>
          <button className="anne-linkbutton" type="button" disabled={busy} onClick={() => setConfirming(true)}>
            Hesabımı sil
          </button>
        </p>
      ) : (
        <div style={{ marginTop: 28 }}>
          <p>
            <strong>Hesabınız ve girdiğiniz bütün bilgiler kalıcı olarak silinecek.</strong> Bu işlem geri alınamaz.
          </p>
          <button
            className="anne-button"
            data-kind="signal"
            type="button"
            disabled={busy}
            onClick={() => void call("/api/anne/ben", "DELETE", "Hesap silinemedi. Lütfen yeniden deneyin.")}
          >
            <span>{busy ? "Siliniyor" : "Evet, hesabımı sil"}</span>
          </button>
          <button
            className="anne-button"
            data-kind="plain"
            style={{ marginTop: 12 }}
            type="button"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            <span>Vazgeç</span>
          </button>
        </div>
      )}
    </div>
  )
}
