"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Plus, Send, Eye, Loader2, MessageCircle, Search, Clock } from "lucide-react"

type ContentKey = "content_today" | "content_tomorrow" | "content_unconfirmed" | "content_cancelled"

type Recipient = {
  id: string
  full_name: string
  telegram_chat_id: string
  phone: string | null
  role: string
  send_hour: number
  content_today: boolean
  content_tomorrow: boolean
  content_unconfirmed: boolean
  content_cancelled: boolean
  is_active: boolean
}

const ROLE_LABELS: Record<string, string> = {
  doktor: "Doktor",
  hemsire: "Hemşire",
  sekreter: "Sekreter",
}

// Icerik turleri: anahtar + kisa etiket + aciklama
const CONTENT_TYPES: { key: ContentKey; type: string; label: string; desc: string }[] = [
  { key: "content_today", type: "today", label: "Bugünkü liste", desc: "O günün tüm randevuları" },
  { key: "content_tomorrow", type: "tomorrow", label: "Yarınki liste", desc: "Ertesi günün randevuları" },
  {
    key: "content_unconfirmed",
    type: "unconfirmed",
    label: "Onaylanmamış",
    desc: "Hasta teyit etmedi — arayıp teyit/iptal edin",
  },
  {
    key: "content_cancelled",
    type: "cancelled",
    label: "Boşalan slotlar",
    desc: "Hasta iptal etti — yeni hasta koyabilirsiniz",
  },
]

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function fmtHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`
}

function contentSummary(r: Recipient): string {
  const parts = CONTENT_TYPES.filter((c) => r[c.key]).map((c) => c.label)
  return parts.length ? parts.join(", ") : "İçerik seçilmemiş"
}

function selectedTypes(r: Pick<Recipient, ContentKey>): string[] {
  return CONTENT_TYPES.filter((c) => r[c.key]).map((c) => c.type)
}

export default function RemindersManagement({ initialRecipients }: { initialRecipients: Recipient[] }) {
  const { toast } = useToast()
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<{ text: string; count: number } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [chatLookup, setChatLookup] = useState<{ chatId: string; name: string; username?: string }[] | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  // Onizleme icin secili icerik turleri
  const [previewTypes, setPreviewTypes] = useState<Record<string, boolean>>({
    today: false,
    tomorrow: true,
    unconfirmed: false,
    cancelled: false,
  })

  // Yeni alici formu
  const [form, setForm] = useState({
    full_name: "",
    telegram_chat_id: "",
    role: "hemsire",
    send_hour: 19,
    content_today: false,
    content_tomorrow: true,
    content_unconfirmed: false,
    content_cancelled: false,
  })

  async function findChats() {
    setLookupLoading(true)
    try {
      const res = await fetch("/api/admin/reminders/telegram-chats")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setChatLookup(data.chats)
      if (!data.chats?.length) {
        toast({ title: "Kimse bulunamadı", description: "Önce personel Telegram'da botunuza /start yazmalı." })
      }
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" })
    } finally {
      setLookupLoading(false)
    }
  }

  async function addRecipient() {
    if (!form.full_name || !form.telegram_chat_id) {
      toast({ title: "Eksik bilgi", description: "Ad ve Telegram Chat ID zorunludur.", variant: "destructive" })
      return
    }
    if (!form.content_today && !form.content_tomorrow && !form.content_unconfirmed && !form.content_cancelled) {
      toast({ title: "İçerik seçin", description: "En az bir içerik türü işaretlenmeli.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/reminders/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecipients((prev) => [...prev, data.recipient])
      setForm({
        full_name: "",
        telegram_chat_id: "",
        role: "hemsire",
        send_hour: 19,
        content_today: false,
        content_tomorrow: true,
        content_unconfirmed: false,
        content_cancelled: false,
      })
      toast({ title: "Eklendi", description: `${data.recipient.full_name} eklendi.` })
    } catch (e: any) {
      toast({ title: "Hata", description: e.message || "Eklenemedi", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function updateRecipient(id: string, patch: Partial<Recipient>) {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    try {
      const res = await fetch(`/api/admin/reminders/recipients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ title: "Hata", description: e.message || "Güncellenemedi", variant: "destructive" })
    }
  }

  async function deleteRecipient(id: string) {
    const prev = recipients
    setRecipients((p) => p.filter((r) => r.id !== id))
    try {
      const res = await fetch(`/api/admin/reminders/recipients/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Silinemedi")
      toast({ title: "Silindi" })
    } catch (e: any) {
      setRecipients(prev)
      toast({ title: "Hata", description: e.message, variant: "destructive" })
    }
  }

  async function loadPreview() {
    const types = Object.keys(previewTypes).filter((k) => previewTypes[k])
    if (types.length === 0) {
      toast({ title: "İçerik seçin", description: "Önizlemek için en az bir tür seçin.", variant: "destructive" })
      return
    }
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/admin/reminders/test?types=${types.join(",")}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data)
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" })
    } finally {
      setPreviewLoading(false)
    }
  }

  // Bir aliciya, kendi ayarli icerigiyle test gonderimi
  async function sendTestTo(r: Recipient) {
    const types = selectedTypes(r)
    if (types.length === 0) {
      toast({ title: "İçerik yok", description: "Bu alıcıda içerik türü seçili değil.", variant: "destructive" })
      return
    }
    setTestingId(r.id)
    try {
      const res = await fetch("/api/admin/reminders/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_chat_id: r.telegram_chat_id, types }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) throw new Error(data.error || "Gönderilemedi")
      toast({ title: "Test gönderildi", description: `${r.full_name} adlı kişiye iletildi.` })
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" })
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Bilgilendirme */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-blue-900">
            <MessageCircle className="h-4 w-4" />
            Telegram Otomatik Hatırlatma
          </CardTitle>
          <CardDescription className="text-blue-800">
            Her alıcı için <strong>gönderim saatini</strong> ve <strong>hangi içeriği</strong> alacağını ayrı ayrı
            ayarlayabilirsiniz. Sistem her saat başı kontrol eder ve o saate ayarlı alıcılara seçtikleri içeriği
            Telegram&apos;dan gönderir. Chat ID almak için: kişi botunuza <strong>/start</strong> yazar, ardından
            aşağıdaki <strong>Chat ID&apos;leri Bul</strong> butonunu kullanırsınız.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Yeni alici ekle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni Alıcı Ekle</CardTitle>
          <CardDescription>Personel bilgisi, gönderim saati ve içerik türlerini seçin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Örn. Ayşe Hemşire"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="chatid">Telegram Chat ID</Label>
              <Input
                id="chatid"
                value={form.telegram_chat_id}
                onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
                placeholder="123456789"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doktor">Doktor</SelectItem>
                  <SelectItem value="hemsire">Hemşire</SelectItem>
                  <SelectItem value="sekreter">Sekreter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hour">Gönderim Saati</Label>
              <Select
                value={String(form.send_hour)}
                onValueChange={(v) => setForm({ ...form, send_hour: Number(v) })}
              >
                <SelectTrigger id="hour">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {fmtHour(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Icerik turleri */}
          <div className="space-y-2">
            <Label>Gönderilecek İçerik</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONTENT_TYPES.map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 hover:bg-muted/40"
                >
                  <Checkbox
                    checked={form[c.key]}
                    onCheckedChange={(v) => setForm({ ...form, [c.key]: Boolean(v) })}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={addRecipient} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Alıcı Ekle
          </Button>

          {/* Chat ID bulma yardimcisi */}
          <div className="border-t pt-4">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={findChats} disabled={lookupLoading}>
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Chat ID&apos;leri Bul
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Personel botunuza <strong>/start</strong> yazdıktan sonra bu butona basın; çıkan ID&apos;yi
              &quot;Kullan&quot; ile forma ekleyin.
            </p>
            {chatLookup && chatLookup.length > 0 && (
              <div className="mt-3 space-y-2">
                {chatLookup.map((c) => (
                  <div
                    key={c.chatId}
                    className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{c.name}</span>
                      {c.username && <span className="text-muted-foreground"> · @{c.username}</span>}
                      <span className="ml-2 text-muted-foreground">ID: {c.chatId}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        setForm((f) => ({ ...f, full_name: f.full_name || c.name, telegram_chat_id: c.chatId }))
                      }
                    >
                      Kullan
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alici listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alıcılar ({recipients.length})</CardTitle>
          <CardDescription>Gönderim saati, içerik ve durum her alıcı için ayrı ayarlanır.</CardDescription>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Henüz alıcı eklenmedi.</p>
          ) : (
            <div className="space-y-4">
              {recipients.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  {/* Ust satir: isim + rol + saat + sil */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${r.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{r.full_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {ROLE_LABELS[r.role] || r.role}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">Chat ID: {r.telegram_chat_id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={String(r.send_hour)}
                          onValueChange={(v) => updateRecipient(r.id, { send_hour: Number(v) })}
                        >
                          <SelectTrigger className="h-8 w-[90px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {HOURS.map((h) => (
                              <SelectItem key={h} value={String(h)}>
                                {fmtHour(h)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs">
                        <Switch checked={r.is_active} onCheckedChange={(v) => updateRecipient(r.id, { is_active: v })} />
                        Aktif
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => deleteRecipient(r.id)}
                        aria-label="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Icerik turleri */}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3">
                    {CONTENT_TYPES.map((c) => (
                      <label key={c.key} className="flex items-center gap-1.5 text-xs">
                        <Checkbox
                          checked={r[c.key]}
                          onCheckedChange={(v) => updateRecipient(r.id, { [c.key]: Boolean(v) } as Partial<Recipient>)}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>

                  {/* Alt: ozet + test butonu */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Her gün <strong>{fmtHour(r.send_hour)}</strong> → {contentSummary(r)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => sendTestTo(r)}
                      disabled={testingId !== null}
                    >
                      {testingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Test Gönder
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onizleme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">İçerik Önizleme</CardTitle>
          <CardDescription>Seçtiğin içerik türlerinin mesaj olarak nasıl görüneceğini gör.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {CONTENT_TYPES.map((c) => (
              <label key={c.type} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={previewTypes[c.type]}
                  onCheckedChange={(v) => setPreviewTypes((p) => ({ ...p, [c.type]: Boolean(v) }))}
                />
                {c.label}
              </label>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadPreview} disabled={previewLoading}>
            {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Önizle
          </Button>

          {preview && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Toplam {preview.count} randevu</div>
              <p className="whitespace-pre-wrap text-sm">
                {preview.text
                  .replace(/<[^>]+>/g, "")
                  .replace(/&amp;/g, "&")
                  .replace(/&lt;/g, "<")
                  .replace(/&gt;/g, ">")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
