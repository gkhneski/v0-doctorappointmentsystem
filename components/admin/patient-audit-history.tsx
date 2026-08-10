"use client"

import { useState } from "react"
import useSWR from "swr"
import { CheckCircle2, ExternalLink, MessageSquareText, Printer, Search, ShieldCheck, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type AuditEvent = {
  id: string
  event_type: "reminder_sent" | "link_opened" | "response_confirmed" | "response_cancelled"
  occurred_at: string
  patient_name_snapshot: string
  patient_phone_snapshot: string | null
  appointment_date_snapshot: string | null
  appointment_time_snapshot: string | null
  message_text: string | null
  ip_address: string | null
  user_agent: string | null
  event_hash: string
}

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Kayıtlar alınamadı")
  return data
})

const labels = {
  reminder_sent: { text: "SMS gönderildi", icon: MessageSquareText, className: "bg-blue-100 text-blue-800" },
  link_opened: { text: "Link açıldı", icon: ExternalLink, className: "bg-amber-100 text-amber-800" },
  response_confirmed: { text: "Hasta onayladı", icon: CheckCircle2, className: "bg-green-100 text-green-800" },
  response_cancelled: { text: "Hasta iptal etti", icon: XCircle, className: "bg-red-100 text-red-800" },
}

export default function PatientAuditHistory() {
  const [query, setQuery] = useState("")
  const search = query.trim().length >= 2 ? query.trim() : ""
  const { data, error, isLoading } = useSWR<{ events: AuditEvent[] }>(
    search ? `/api/admin/reminders/audit-history?q=${encodeURIComponent(search)}` : null,
    fetcher,
    { keepPreviousData: true },
  )
  const events = data?.events || []

  return (
    <Card className="print:border-0 print:shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5" />Hasta İşlem Geçmişi</CardTitle>
            <CardDescription>Hastaya gönderilen hatırlatma ile link açma, onay ve iptal kayıtlarını tarih-saat kanıtıyla görüntüleyin.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2 print:hidden" onClick={() => window.print()} disabled={!events.length}>
            <Printer className="h-4 w-4" /> Yazdır
          </Button>
        </div>
        <div className="relative max-w-xl print:hidden">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hasta adı veya telefon ile ara" className="pl-9" />
        </div>
      </CardHeader>
      <CardContent>
        {!search && <p className="py-12 text-center text-sm text-muted-foreground">İşlem geçmişini görmek için en az 2 karakter yazın.</p>}
        {isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Kayıtlar yükleniyor...</p>}
        {error && <p className="py-12 text-center text-sm text-destructive">{error.message}</p>}
        {search && !isLoading && !error && events.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Bu hasta için kayıt bulunamadı.</p>}
        {events.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="font-semibold">{events[0].patient_name_snapshot}</p>
              <p className="text-sm text-muted-foreground">{events[0].patient_phone_snapshot || "Telefon kaydı yok"} · {events.length} işlem</p>
            </div>
            {events.map((event) => {
              const meta = labels[event.event_type]
              const Icon = meta.icon
              return (
                <article key={event.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Badge className={meta.className}><Icon className="mr-1 h-3.5 w-3.5" />{meta.text}</Badge>
                    <time className="text-sm font-medium">{new Date(event.occurred_at).toLocaleString("tr-TR")}</time>
                  </div>
                  <p className="mt-3 text-sm"><strong>Randevu:</strong> {event.appointment_date_snapshot ? new Date(`${event.appointment_date_snapshot}T12:00:00`).toLocaleDateString("tr-TR") : "—"} {event.appointment_time_snapshot?.slice(0, 5) || ""}</p>
                  {event.message_text && <div className="mt-3 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">{event.message_text}</div>}
                  <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div><dt className="font-semibold text-foreground">IP adresi</dt><dd>{event.ip_address || "Bu kayıt için alınmadı"}</dd></div>
                    <div><dt className="font-semibold text-foreground">Cihaz / tarayıcı</dt><dd className="break-all">{event.user_agent || "Bu kayıt için alınmadı"}</dd></div>
                    <div className="sm:col-span-2"><dt className="font-semibold text-foreground">Kayıt doğrulama özeti</dt><dd className="break-all font-mono">{event.event_hash}</dd></div>
                  </dl>
                </article>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
