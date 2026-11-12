"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { send } from "@/components/anne/api"

/** Çıkış ve hesabı silme. Silme iki adımlıdır: önce sor, sonra sil. */
export function AccountActions() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function call(url: string, method: "POST" | "DELETE", failure: string) {
    setBusy(true)
    setError("")
    const result = await send(url, method, undefined, failure)
    if (!result.ok && result.status !== 401) {
      setBusy(false)
      setError(result.error)
      return
    }
    router.replace("/anne")
    router.refresh()
  }

  return (
    <div>
      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}

      <button
        className="nb-btn"
        data-kind="light"
        type="button"
        disabled={busy}
        onClick={() => void call("/api/anne/cikis", "POST", "Çıkış yapılamadı. Lütfen yeniden deneyin.")}
      >
        Çıkış yap
      </button>

      {!confirming ? (
        <p style={{ marginTop: 16, textAlign: "center", fontSize: 14 }}>
          <button className="nb-link" type="button" disabled={busy} onClick={() => setConfirming(true)}>
            Hesabımı ve tüm verilerimi sil
          </button>
        </p>
      ) : (
        <div className="nb-card" data-tone="pink" style={{ marginTop: 16 }}>
          <p>
            <b>Hesabın, kayıtların ve fotoğrafların kalıcı olarak silinecek.</b> Bu işlem geri alınamaz.
          </p>
          <button
            className="nb-btn"
            type="button"
            disabled={busy}
            onClick={() => void call("/api/anne/ben", "DELETE", "Hesap silinemedi. Lütfen yeniden deneyin.")}
          >
            {busy ? "Siliniyor" : "Evet, hesabımı sil"}
          </button>
          <button className="nb-btn" data-kind="light" type="button" disabled={busy} onClick={() => setConfirming(false)}>
            Vazgeç
          </button>
        </div>
      )}
    </div>
  )
}
