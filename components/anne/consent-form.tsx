"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { send } from "@/components/anne/api"

type State = { aydinlatma: boolean; saglik_verisi: boolean; bildirim: boolean }

/**
 * Onay kutuları. İlk girişte "Kabul et ve başla" ile, Hesap ekranında "Kaydet" ile kullanılır.
 * Metinlerin kendisi hukuki onaydan sonra eklenecek; şimdilik yerleri köşeli parantezle belli.
 */
export function ConsentForm({ initial, submitLabel, next }: { initial: State; submitLabel: string; next: string }) {
  const router = useRouter()
  const [state, setState] = useState<State>(initial)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const ready = state.aydinlatma && state.saglik_verisi

  async function save() {
    setBusy(true)
    setError("")
    const result = await send("/api/anne/onay", "POST", state, "Onaylar kaydedilemedi. Lütfen yeniden deneyin.")
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

  function toggle(key: keyof State) {
    setState((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <form
      style={{ display: "flex", flex: 1, flexDirection: "column" }}
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <label className="nb-check" htmlFor="anne-onay-aydinlatma" style={{ marginTop: 22 }}>
        <input id="anne-onay-aydinlatma" type="checkbox" checked={state.aydinlatma} onChange={() => toggle("aydinlatma")} />
        <span>
          <b>Aydınlatma metnini okudum.</b> Zorunlu. [KVKK aydınlatma metni]
        </span>
      </label>
      <label className="nb-check" htmlFor="anne-onay-saglik">
        <input id="anne-onay-saglik" type="checkbox" checked={state.saglik_verisi} onChange={() => toggle("saglik_verisi")} />
        <span>
          <b>Sağlık verilerimin işlenmesine açık rıza veriyorum.</b> Hafta ve kayıtlarını saklayabilmemiz için zorunlu.
          [Açık rıza metni]
        </span>
      </label>
      <label className="nb-check" htmlFor="anne-onay-bildirim">
        <input id="anne-onay-bildirim" type="checkbox" checked={state.bildirim} onChange={() => toggle("bildirim")} />
        <span>
          <b>Hatırlatma bildirimi istiyorum.</b> İsteğe bağlı.
        </span>
      </label>

      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}
      <div className="nb-grow" />
      <p className="nb-note" style={{ textAlign: "center", fontSize: 13 }}>
        Bu uygulama tanı koymaz ve doktorunun yerini tutmaz.
      </p>
      <button className="nb-btn" type="submit" disabled={busy || !ready}>
        {busy ? "Kaydediliyor" : submitLabel}
      </button>
    </form>
  )
}
