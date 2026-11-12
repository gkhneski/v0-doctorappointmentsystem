"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { send } from "@/components/anne/api"

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
    const result = await send<{ devCode?: string }>("/api/anne/giris/kod", "POST", { phone }, "Kod gönderilemedi. Lütfen yeniden deneyin.")
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    // Yalnızca geliştirme bilgisayarında, SMS ayarı yokken kod yanıtta gelir.
    setCode(typeof result.data.devCode === "string" ? result.data.devCode : "")
    setWait(RESEND_SECONDS)
    setStep("code")
  }

  async function verify(value: string) {
    setBusy(true)
    setError("")
    const result = await send<{ profile?: { onboarded?: boolean } }>(
      "/api/anne/giris/dogrula",
      "POST",
      { phone, code: value },
      "Giriş yapılamadı. Lütfen yeniden deneyin.",
    )
    if (!result.ok) {
      setBusy(false)
      setCode("")
      setError(result.error)
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
        <h1 style={{ marginTop: 70 }}>
          Telefon
          <br />
          <b>numaran</b>
        </h1>
        <p className="nb-note" style={{ marginTop: 12, fontSize: 15 }}>
          6 haneli bir giriş kodu göndereceğiz. Şifre yok.
        </p>
        <label className="nb-label" htmlFor="anne-telefon">
          Cep telefonu
        </label>
        <input
          id="anne-telefon"
          className="nb-field"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="05__ ___ __ __"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        {error && (
          <p className="nb-error" role="alert">
            {error}
          </p>
        )}
        <button className="nb-btn" type="submit" disabled={busy || phone.replace(/\D/g, "").length < 10}>
          {busy ? "Gönderiliyor" : "Kod gönder"}
        </button>
        <p className="nb-note" style={{ marginTop: 14, textAlign: "center" }}>
          Numaran yalnızca giriş için kullanılır.
        </p>
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
      <h1 style={{ marginTop: 70 }}>
        Kodu
        <br />
        <b>gir</b>
      </h1>
      <p className="nb-note" style={{ marginTop: 12, fontSize: 15 }}>
        {phone} numarasına gönderdik. Kod 5 dakika geçerli.
      </p>
      <label className="nb-label" htmlFor="anne-kod">
        Giriş kodu
      </label>
      <input
        id="anne-kod"
        ref={codeInput}
        className="nb-field"
        data-code=""
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="······"
        value={code}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").slice(0, 6)
          setCode(next)
          if (next.length === 6 && !busy) void verify(next)
        }}
        required
      />
      {error && (
        <p className="nb-error" role="alert">
          {error}
        </p>
      )}
      <button className="nb-btn" type="submit" disabled={busy || code.length !== 6}>
        {busy ? "Kontrol ediliyor" : "Giriş yap"}
      </button>
      <p className="nb-note" style={{ marginTop: 16, textAlign: "center" }}>
        <button className="nb-link" type="button" disabled={busy || wait > 0} onClick={() => void requestCode()}>
          {wait > 0 ? `Yeni kod ${wait} saniye sonra` : "Yeni kod gönder"}
        </button>
        {" · "}
        <button
          className="nb-link"
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
