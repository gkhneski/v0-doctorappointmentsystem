"use client"

import type React from "react"
import { Suspense } from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import { Calendar, Shield } from "lucide-react"

function AdminLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const searchParams = useSearchParams()

  // Sadece gizli linkten gelenler erisebilir
  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref === "ec25") {
      setAuthorized(true)
    } else {
      // router henüz hazır olmayabilir, window.location kullan
      if (typeof window !== "undefined") {
        window.location.replace("/")
      }
    }
  }, [searchParams])
  
  // Use singleton client - do NOT create new client on each render/submit
  const supabase = useMemo(() => createClient(), [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) throw signInError

      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (adminError || !adminUser) {
        await supabase.auth.signOut()
        throw new Error("Yönetici erişiminiz bulunmamaktadır")
      }

      // Full page reload ensures session cookie is recognized server-side
      window.location.href = "/admin"
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  if (!authorized) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-secondary to-background p-6">

      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Calendar className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-semibold">Eray ÇALIŞKAN Randevu Sistemi </span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Shield className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-center text-2xl">Yönetici Girişi</CardTitle>
          <CardDescription className="text-center">Yönetim paneline erişin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sagliksistemi.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </Button>
            </div>


          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  )
}
