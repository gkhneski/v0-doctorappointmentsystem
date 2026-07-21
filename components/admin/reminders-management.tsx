"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Plus, Send, Eye, Loader2, MessageCircle, Search } from "lucide-react"

type Recipient = {
  id: string
  full_name: string
  telegram_chat_id: string
  phone: string | null
  role: string
  receive_evening: boolean
  receive_morning: boolean
  is_active: boolean
}

const ROLE_LABELS: Record<string, string> = {
  doktor: "Doktor",
  hemsire: "Hemşire",
  sekreter: "Sekreter",
}

export default function RemindersManagement({ initialRecipients }: { initialRecipients: Recipient[] }) {
  const { toast } = useToast()
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<{ which: string; text: string; count: number } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [sendingWhich, setSendingWhich] = useState<string | null>(null)
  const [chatLookup, setChatLookup] = useState<{ chatId: string; name: string; username?: string }[] | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  async function findChats() {
    setLookupLoading(true)
    try {
      const res = await fetch("/api/admin/reminders/telegram-chats")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setChatLookup(data.chats)
      if (!data.chats?.length) {
        toast({
          title: "Kimse bulunamadı",
          description: "Önce personel Telegram'da botunuza /start yazmalı.",
        })
      }
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" })
    } finally {
      setLookupLoading(false)
    }
  }

  // Yeni alici formu
  const [form, setForm] = useState({
    full_name: "",
    telegram_chat_id: "",
    role: "hemsire",
    receive_evening: true,
    receive_morning: false,
  })

  async function addRecipient() {
    if (!form.full_name || !form.telegram_chat_id) {
      toast({ title: "Eksik bilgi", description: "Ad ve Telegram Chat ID zorunludur.", variant: "destructive" })
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
      setForm({ full_name: "", telegram_chat_id: "", role: "hemsire", receive_evening: true, receive_morning: false })
      toast({ title: "Eklendi", description: `${data.recipient.full_name} eklendi.` })
    } catch (e: any) {
      toast({ title: "Hata", description: e.message || "Eklenemedi", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function updateRecipient(id: string, patch: Partial<Recipient>) {
    // Optimistik guncelleme
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

  async function loadPreview(which: "evening" | "morning") {
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/admin/reminders/test?which=${which}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data)
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" })
    } finally {
      setPreviewLoading(false)
    }
  }

  async function sendNow(which: "evening" | "morning") {
    setSendingWhich(which)
    try {
      const res = await fetch("/api/admin/reminders/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ which }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({
        title: "Gönderildi",
        description: `${data.sent || 0} kişiye iletildi${data.failed ? `, ${data.failed} başarısız` : ""}.`,
      })
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" })
    } finally {
      setSendingWhich(null)
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
            Her akşam <strong>19:00</strong>&apos;da yarınki randevu listesi (akşam alıcılarına), her sabah{" "}
            <strong>08:00</strong>&apos;de bugünkü liste (sabah alıcılarına) Telegram ile otomatik gönderilir.
            Alıcının Chat ID&apos;sini almak için: kişi Telegram&apos;da botunuza <strong>/start</strong> yazar,
            ardından <strong>@userinfobot</strong>&apos;a yazarak kendi numeric ID&apos;sini öğrenip buraya girersiniz.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Yeni alici ekle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni Alıcı Ekle</CardTitle>
          <CardDescription>Hatırlatmaları alacak personelin Telegram Chat ID&apos;si (örn. 123456789).</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="flex items-end">
              <Button onClick={addRecipient} disabled={saving} className="w-full gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Ekle
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.receive_evening}
                onCheckedChange={(v) => setForm({ ...form, receive_evening: v })}
              />
              Akşam (yarınki liste)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.receive_morning}
                onCheckedChange={(v) => setForm({ ...form, receive_morning: v })}
              />
              Sabah (bugünkü liste)
            </label>
          </div>

          {/* Chat ID bulma yardimcisi */}
          <div className="mt-4 border-t pt-4">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={findChats} disabled={lookupLoading}>
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Chat ID&apos;leri Bul
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Personel botunuza <strong>/start</strong> yazdıktan sonra bu butona basın; aşağıda çıkan ID&apos;yi
              &quot;Telegram Chat ID&quot; alanına yazın.
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
                      onClick={() => setForm((f) => ({ ...f, full_name: f.full_name || c.name, telegram_chat_id: c.chatId }))}
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
          <CardDescription>Her alıcının hangi hatırlatmaları alacağını buradan aç/kapat.</CardDescription>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Henüz alıcı eklenmedi.</p>
          ) : (
            <div className="space-y-3">
              {recipients.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${r.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{r.full_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {ROLE_LABELS[r.role] || r.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">Chat ID: {r.telegram_chat_id}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs">
                      <Switch
                        checked={r.receive_evening}
                        onCheckedChange={(v) => updateRecipient(r.id, { receive_evening: v })}
                      />
                      Akşam
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <Switch
                        checked={r.receive_morning}
                        onCheckedChange={(v) => updateRecipient(r.id, { receive_morning: v })}
                      />
                      Sabah
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <Switch
                        checked={r.is_active}
                        onCheckedChange={(v) => updateRecipient(r.id, { is_active: v })}
                      />
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onizleme ve manuel gonderim */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Önizle ve Şimdi Gönder</CardTitle>
          <CardDescription>Otomatik gönderimi beklemeden mesajı önizleyebilir veya hemen gönderebilirsin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => loadPreview("evening")} disabled={previewLoading}>
              <Eye className="h-4 w-4" />
              Akşam mesajını önizle
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => loadPreview("morning")} disabled={previewLoading}>
              <Eye className="h-4 w-4" />
              Sabah mesajını önizle
            </Button>
          </div>

          {preview && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                {preview.which === "evening" ? "Akşam (yarın)" : "Sabah (bugün)"} · {preview.count} randevu
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {preview.text.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button size="sm" className="gap-1.5" onClick={() => sendNow("evening")} disabled={sendingWhich !== null}>
              {sendingWhich === "evening" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Akşam listesini şimdi gönder
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => sendNow("morning")} disabled={sendingWhich !== null}>
              {sendingWhich === "morning" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Sabah listesini şimdi gönder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
