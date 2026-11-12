"use client"

import { useMemo, useState } from "react"
import { Minus, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AppAccount } from "@/lib/app-accounts"

function formatPhone(phone: string): string {
  return phone.replace(/^(\d{4})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4")
}

function formatDay(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date(iso))
}

function weekOf(lmp: string | null, today: string): string {
  if (!lmp) return "—"
  const days = Math.round((Date.parse(today) - Date.parse(lmp)) / 86_400_000)
  if (days < 0 || days > 308) return "—"
  return `${Math.floor(days / 7)}. hafta`
}

/** Hasta uygulaması hesapları ve bebek yüzü üretim hakları. */
export function AppAccounts({ initial, today }: { initial: AppAccount[]; today: string }) {
  const [accounts, setAccounts] = useState(initial)
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr")
    const digits = q.replace(/\D/g, "")
    if (!q) return accounts
    return accounts.filter((a) => (digits && a.phone.includes(digits)) || (a.name ?? "").toLocaleLowerCase("tr").includes(q))
  }, [accounts, query])

  async function change(account: AppAccount, delta: 1 | -1) {
    setBusy(account.id)
    setError("")
    try {
      const response = await fetch("/api/admin/uygulama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: account.id, delta }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Kaydedilemedi. Lütfen yeniden deneyin.")
        return
      }
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, allowance: data.allowance, remaining: Math.max(0, data.allowance - a.used) } : a)),
      )
    } catch {
      setError("Bağlantı kurulamadı. Lütfen yeniden deneyin.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Ad ya da telefon ara"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Hesap ara"
        />
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">{accounts.length === 0 ? "Henüz uygulamaya giren hasta yok." : "Aramaya uyan hesap yok."}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Hasta</th>
                <th className="px-4 py-2.5">Telefon</th>
                <th className="px-4 py-2.5">Hafta</th>
                <th className="px-4 py-2.5">Kayıt</th>
                <th className="px-4 py-2.5">Son giriş</th>
                <th className="px-4 py-2.5">Üretilen</th>
                <th className="px-4 py-2.5 text-right">Kalan hak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{a.name ?? "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-700">{formatPhone(a.phone)}</td>
                  <td className="px-4 py-2.5 text-gray-700">{weekOf(a.lmp, today)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-600">{formatDay(a.createdAt)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-600">{formatDay(a.lastLoginAt)}</td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {a.generated}
                    {a.failed > 0 && <span className="ml-1 text-xs text-gray-400">({a.failed} başarısız)</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={busy === a.id || a.remaining === 0}
                        onClick={() => void change(a, -1)}
                        aria-label={`${a.name ?? a.phone}: bir hakkı geri al`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center text-base font-semibold tabular-nums text-gray-900">{a.remaining}</span>
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        disabled={busy === a.id}
                        onClick={() => void change(a, 1)}
                        aria-label={`${a.name ?? a.phone}: bir hak ver`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
