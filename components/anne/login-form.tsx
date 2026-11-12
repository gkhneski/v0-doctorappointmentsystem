"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

async function post(url: string, body: unknown) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, data }
  } catch {
    return { ok: false, data: { error: "Bağlantı kurulamadı. İnternetinizi kontrol edip yeniden deneyin." } }
  }
}

const RESEND_SECONDS = 60

/** Telefon numarası, ardından SMS ile gelen 6 haneli kod. */
export function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(0)
  const codeInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  useEffect(() => {
    if (step === "code") codeInput.current?.focus()
  }, [step])

  async function requestCode() {
    setBusy(true)
    setError("")
    const result = await post("/api/anne/giris/kod", { phone })
    setBusy(false)
    if (!result.ok) {
      setError(result.data.error ?? "Kod gönderilemedi. Lütfen yeniden deneyin.")
      return false
    }
    // Yalnızca geliştirme bilgisayarında, SMS ayarı yokken kod yanıtta gelir.
    setCode(typeof result.data.devCode === "string" ? result.data.devCode : "")
    setWait(RESEND_SECONDS)
    setStep("code")
    return true
  }

  async function verify(value: string) {
    setBusy(true)
    setError("")
    const result = await post("/api/anne/giris/dogrula", { phone, code: value })
    if (!result.ok) {
      setBusy(false)
      setCode("")
      setError(result.data.error ?? "Giriş yapılamadı. Lütfen yeniden deneyin.")
      codeInput.current?.focus()
      return
    }
    router.replace(result.data.profile?.onboarded ? "/anne/ana" : "/anne/baslangic")
    router.refresh()
  }

  if (step === "phone") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void requestCode()
        }}
      >
        <label className="anne-field">
          <span>Cep telefonu numaranız</span>
          <input
            className="anne-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05__ ___ __ __"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <small>Bu numaraya SMS ile 6 haneli bir giriş kodu göndereceğiz.</small>
        </label>
        {error && (
          <p className="anne-error" role="alert">
            {error}
          </p>
        )}
        <button className="anne-button" type="submit" disabled={busy || phone.replace(/\D/g, "").length < 10}>
          <span>{busy ? "Gönderiliyor" : "Kod gönder"}</span>
        </button>
      </form>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (code.length === 6) void verify(code)
      }}
    >
      <label className="anne-field">
        <span>Giriş kodu</span>
        <input
          ref={codeInput}
          className="anne-input anne-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 6)
            setCode(next)
            if (next.length === 6 && !busy) void verify(next)
          }}
          required
        />
        <small>{phone} numarasına gönderildi. Kod 5 dakika geçerlidir.</small>
      </label>
      {error && (
        <p className="anne-error" role="alert">
          {error}
        </p>
      )}
      <button className="anne-button" type="submit" disabled={busy || code.length !== 6}>
        <span>{busy ? "Kontrol ediliyor" : "Giriş yap"}</span>
      </button>
      <p className="anne-note" style={{ marginTop: 20 }}>
        <button className="anne-linkbutton" type="button" disabled={busy || wait > 0} onClick={() => void requestCode()}>
          {wait > 0 ? `Yeni kod ${wait} saniye sonra istenebilir` : "Yeni kod gönder"}
        </button>
        {" · "}
        <button
          className="anne-linkbutton"
          type="button"
          disabled={busy}
          onClick={() => {
            setStep("phone")
            setCode("")
            setError("")
          }}
        >
          Numarayı değiştir
        </button>
      </p>
    </form>
  )
}
