"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Props = {
  isOpen: boolean
  onClose: () => void
  phone: string
  appointmentId: string
  onSuccess: () => void
}

export default function SmsVerificationDialog({ isOpen, onClose, phone, appointmentId, onSuccess }: Props) {
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Lütfen 6 haneli kodu girin")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch("/api/sms/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code,
          appointmentId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.message || "Kod doğrulanamadı")
      }
    } catch (err) {
      console.error("[v0] Doğrulama hatası:", err)
      setError("Bir hata oluştu, lütfen tekrar deneyin")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError(null)

    try {
      const response = await fetch("/api/sms/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          appointmentId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Yeni kod gönderildi")
        setCode("")
      } else {
        setError("SMS gönderilemedi")
      }
    } catch (err) {
      console.error("[v0] SMS gönderme hatası:", err)
      setError("SMS gönderilemedi")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>SMS Doğrulama</DialogTitle>
          <DialogDescription>{phone} numarasına gönderilen 6 haneli doğrulama kodunu girin.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Doğrulama Kodu</Label>
            <Input
              id="code"
              type="text"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest"
            />
            <p className="text-xs text-muted-foreground text-center">Kod 5 dakika içinde geçerlidir</p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">{error}</div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleVerify} disabled={isVerifying || code.length !== 6} className="w-full">
              {isVerifying ? "Doğrulanıyor..." : "Kodu Doğrula"}
            </Button>

            <Button variant="outline" onClick={handleResend} disabled={isResending} className="w-full bg-transparent">
              {isResending ? "Gönderiliyor..." : "Yeni Kod Gönder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
