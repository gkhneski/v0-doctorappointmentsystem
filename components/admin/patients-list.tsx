"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Phone, Calendar, Award as IdCard, AlertTriangle, Trash2, UserPlus, Map, Globe, CheckCircle2, Loader2, Search, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

type Patient = {
  id: string
  full_name: string
  tc_no: string
  phone: string
  date_of_birth: string
  kvkk_approved: boolean
  created_at: string
  profile_photo_url?: string | null
  is_blacklisted?: boolean
  blacklist_reason?: string
}

export default function PatientsList({ patients: initialPatients }: { patients: Patient[] }) {
  const router = useRouter()
  const [profilePhotos, setProfilePhotos] = useState<Record<string, string>>({})
  const [loadedPatients, setLoadedPatients] = useState<Set<string>>(new Set())
  const [blacklistDialog, setBlacklistDialog] = useState<{ open: boolean; patientId?: string; reason?: string }>({
    open: false,
  })
  const [manualBlacklistDialog, setManualBlacklistDialog] = useState<{
    open: boolean
    fullName?: string
    phone?: string
    reason?: string
  }>({ open: false })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [patients, setPatients] = useState(initialPatients)
  const [searchQuery, setSearchQuery] = useState("")
  const observerRef = useRef<IntersectionObserver | null>(null)
  const supabase = createClient()

  // Quick Add state
  const [quickAddDialog, setQuickAddDialog] = useState(false)
  const [quickAddName, setQuickAddName] = useState("")
  const [quickAddPhone, setQuickAddPhone] = useState("")
  const [quickAddLoading, setQuickAddLoading] = useState(false)
  const [quickAddResult, setQuickAddResult] = useState<{ success: boolean; message: string; smsSent: boolean } | null>(null)

  const handleQuickAdd = async () => {
    if (!quickAddName.trim() || !quickAddPhone.trim()) {
      toast({ title: "Hata", description: "Ad soyad ve telefon zorunludur", variant: "destructive" })
      return
    }
    setQuickAddLoading(true)
    setQuickAddResult(null)
    try {
      const res = await fetch("/api/admin/patients/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: quickAddName.trim(), phone: quickAddPhone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Hata")
      setQuickAddResult({ success: true, message: data.message, smsSent: data.smsSent })
      // Listeyi yenile
      const { data: updated } = await supabase
        .from("patients")
        .select("id, full_name, tc_no, phone, date_of_birth, kvkk_approved, created_at, profile_photo_url, is_blacklisted, blacklist_reason")
        .order("full_name")
      if (updated) setPatients(updated)
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" })
    } finally {
      setQuickAddLoading(false)
    }
  }

  const resetQuickAdd = () => {
    setQuickAddDialog(false)
    setQuickAddName("")
    setQuickAddPhone("")
    setQuickAddResult(null)
  }

  const handleAddManualBlacklist = async () => {
    if (!manualBlacklistDialog.fullName || !manualBlacklistDialog.phone || !manualBlacklistDialog.reason) {
      toast({ title: "Hata", description: "Tüm alanları doldurun", variant: "destructive" })
      return
    }

    try {
      const { data, error } = await supabase
        .from("patients")
        .insert({
          full_name: manualBlacklistDialog.fullName,
          phone: manualBlacklistDialog.phone,
          is_blacklisted: true,
          blacklist_reason: manualBlacklistDialog.reason,
          tc_no: "",
          date_of_birth: "1900-01-01", // Default date for manual blacklist entries
          kvkk_approved: false,
        })
        .select()

      if (error) throw error

      toast({ title: "Başarılı", description: "Black List'e eklendi" })
      setManualBlacklistDialog({ open: false, fullName: "", phone: "", reason: "" })

      const { data: updatedPatients } = await supabase
        .from("patients")
        .select("id, full_name, tc_no, phone, date_of_birth, kvkk_approved, created_at, profile_photo_url, is_blacklisted, blacklist_reason")
        .order("full_name")

      if (updatedPatients) setPatients(updatedPatients)
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Bilinmeyen hata", variant: "destructive" })
    }
  }

  const handleToggleBlacklist = async (patientId: string, reason?: string) => {
    const patient = patients.find((p) => p.id === patientId)
    if (!patient) return

    const newBlacklistStatus = !patient.is_blacklisted
    const { error } = await supabase
      .from("patients")
      .update({
        is_blacklisted: newBlacklistStatus,
        blacklist_reason: newBlacklistStatus ? reason : null,
      })
      .eq("id", patientId)

    if (error) throw error

    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              is_blacklisted: newBlacklistStatus,
              blacklist_reason: newBlacklistStatus ? reason : null,
            }
          : p
      )
    )

    toast({
      title: "Başarılı",
      description: newBlacklistStatus
        ? `${patient.full_name} kara listeye alındı`
        : `${patient.full_name} kara listeden çıkarıldı`,
    })
    setBlacklistDialog({ open: false })
  }

  const handleDeletePatient = async () => {
    if (!patientToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/patients/${patientToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Hasta silinemedi")
      }

      setPatients((prev) => prev.filter((p) => p.id !== patientToDelete.id))

      toast({
        title: "Başarılı",
        description: "Hasta başarıyla silindi",
      })

      setDeleteDialogOpen(false)
      setPatientToDelete(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting patient:", error)
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Hasta silinirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const loadProfilePhoto = useCallback(
    async (patientId: string, photoUrl: string) => {
      if (loadedPatients.has(patientId) || !photoUrl) return

      let storagePath = photoUrl

      if (storagePath.includes("supabase.co/storage/v1/object/")) {
        const match = storagePath.match(/\/storage\/v1\/object\/(?:public\/)?patient-documents\/(.+)/)
        if (match && match[1]) {
          storagePath = match[1]
        } else {
          return
        }
      } else if (storagePath.startsWith("patient-documents/")) {
        storagePath = storagePath.replace("patient-documents/", "")
      }

      const { data, error } = await supabase.storage.from("patient-documents").createSignedUrl(storagePath, 3600)

      if (!error && data?.signedUrl) {
        setProfilePhotos((prev) => ({
          ...prev,
          [patientId]: data.signedUrl,
        }))
        setLoadedPatients((prev) => new Set(prev).add(patientId))
      }
    },
    [loadedPatients, supabase]
  )

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    }

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const patientId = entry.target.getAttribute("data-patient-id")
          const photoUrl = entry.target.getAttribute("data-photo-url")
          if (patientId && photoUrl) {
            loadProfilePhoto(patientId, photoUrl)
            observerRef.current?.unobserve(entry.target)
          }
        }
      })
    }, observerOptions)

    return () => observerRef.current?.disconnect()
  }, [loadProfilePhoto])

  // Search filter - isim, TC, telefon ile arama
  const filteredPatients = patients.filter(p => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    return (
      p.full_name?.toLowerCase().includes(query) ||
      p.tc_no?.toLowerCase().includes(query) ||
      p.phone?.includes(query)
    )
  })

  const getInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b bg-gray-50 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Hasta ara (isim, TC, telefon)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {searchQuery ? `${filteredPatients.length} sonuç` : `Toplam: ${filteredPatients.length} hasta`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setQuickAddDialog(true)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            Hizli Hasta Ekle + SMS
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManualBlacklistDialog({ open: true })}
            className="gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Black List
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hasta Adı</TableHead>
              <TableHead>TC Kimlik No</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Doğum Tarihi</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow
                key={patient.id}
                onClick={() => router.push(`/admin/patients/${patient.id}`)}
                className="cursor-pointer hover:bg-muted/50"
                data-patient-id={patient.id}
                data-photo-url={patient.profile_photo_url || ""}
                ref={(el) => {
                  if (el && patient.profile_photo_url && observerRef.current) {
                    observerRef.current.observe(el)
                  }
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {profilePhotos[patient.id] && (
                        <AvatarImage src={profilePhotos[patient.id] || "/placeholder.svg"} alt={patient.full_name} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                        {getInitials(patient.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{patient.full_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <IdCard className="h-3 w-3 text-muted-foreground" />
                    {patient.tc_no}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {patient.phone}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {new Date(patient.date_of_birth).toLocaleDateString("tr-TR")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{new Date(patient.created_at).toLocaleDateString("tr-TR")}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {patient.is_blacklisted && (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Black List
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setBlacklistDialog({
                          open: true,
                          patientId: patient.id,
                          reason: patient.blacklist_reason || "",
                        })
                      }}
                      className={patient.is_blacklisted ? "border-red-300 bg-red-50" : ""}
                    >
                      {patient.is_blacklisted ? "Listeden Çıkar" : "Black List'e Al"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPatientToDelete(patient)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Quick Add Dialog */}
      <Dialog open={quickAddDialog} onOpenChange={(o) => { if (!o) resetQuickAdd() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Hizli Hasta Ekle
            </DialogTitle>
            <DialogDescription>
              Hasta kaydedilir ve otomatik olarak site linki ile konum bilgisi SMS ile gönderilir.
            </DialogDescription>
          </DialogHeader>

          {!quickAddResult ? (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">Ad Soyad <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Örn: Ayse Kaya"
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  className="mt-1.5"
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cep Numarasi <span className="text-red-500">*</span></label>
                <Input
                  placeholder="05XX XXX XX XX"
                  value={quickAddPhone}
                  onChange={(e) => setQuickAddPhone(e.target.value)}
                  className="mt-1.5"
                  onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                />
              </div>

              {/* SMS önizleme */}
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-medium text-primary">Gönderilecek SMS önizleme:</p>
                <div className="rounded bg-white/70 p-2.5 space-y-2 text-xs text-muted-foreground leading-relaxed font-mono">
                  <p>Sayin <span className="text-foreground font-semibold">{quickAddName ? quickAddName.split(" ")[0] : "[Ad]"}</span> Hanim, Prof. Dr. Eray Caliskan klinigine hosgeldiniz!</p>
                  <p className="border-t pt-2 flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-primary flex-shrink-0" />
                    Online randevu icin web sitemiz:<br />
                    <span className="text-primary">www.dreraycaliskan.com</span>
                  </p>
                  <p className="border-t pt-2 flex items-center gap-1.5">
                    <Map className="h-3 w-3 text-green-600 flex-shrink-0" />
                    Klinigimizin konumu icin:<br />
                    <span className="text-green-600">maps.google.com/...</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-800">{quickAddResult.message}</p>
                  <p className="text-xs text-green-600">
                    SMS durumu: {quickAddResult.smsSent ? "Gönderildi" : "Gönderilemedi (log kaydedildi)"}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Gönderilen SMS içerigi:</p>
                <p className="text-xs font-medium">{quickAddName.split(" ")[0]} Hanim — site linki + Google Maps konum</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {!quickAddResult ? (
              <>
                <Button variant="outline" onClick={resetQuickAdd} disabled={quickAddLoading}>
                  Iptal
                </Button>
                <Button onClick={handleQuickAdd} disabled={quickAddLoading || !quickAddName.trim() || !quickAddPhone.trim()}>
                  {quickAddLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Kaydediliyor...</>
                  ) : (
                    <><UserPlus className="h-4 w-4 mr-2" />Kaydet ve SMS Gönder</>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setQuickAddResult(null); setQuickAddName(""); setQuickAddPhone("") }}>
                  Yeni Hasta Ekle
                </Button>
                <Button onClick={resetQuickAdd}>
                  Kapat
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blacklist Dialog */}
      <Dialog open={blacklistDialog.open} onOpenChange={(open) => setBlacklistDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {patients.find((p) => p.id === blacklistDialog.patientId)?.is_blacklisted
                ? "Black List'ten Çıkar"
                : "Black List'e Al"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!patients.find((p) => p.id === blacklistDialog.patientId)?.is_blacklisted && (
              <div>
                <label className="text-sm font-medium">Sebep</label>
                <Textarea
                  placeholder="Black List'e alınma sebebini yazın..."
                  value={blacklistDialog.reason || ""}
                  onChange={(e) => setBlacklistDialog({ ...blacklistDialog, reason: e.target.value })}
                  className="mt-2"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlacklistDialog({ open: false })}>
              İptal
            </Button>
            <Button
              onClick={() =>
                blacklistDialog.patientId &&
                handleToggleBlacklist(blacklistDialog.patientId, blacklistDialog.reason || "")
              }
              className={
                patients.find((p) => p.id === blacklistDialog.patientId)?.is_blacklisted
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {patients.find((p) => p.id === blacklistDialog.patientId)?.is_blacklisted
                ? "Çıkar"
                : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Blacklist Dialog */}
      <Dialog open={manualBlacklistDialog.open} onOpenChange={(open) => setManualBlacklistDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Black List'e Manuel Ekle</DialogTitle>
            <DialogDescription>
              Sistemde kaydı olmayan kişiyi Black List'e ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Adı Soyadı</label>
              <Input
                placeholder="Örn: Ahmet Yılmaz"
                value={manualBlacklistDialog.fullName || ""}
                onChange={(e) => setManualBlacklistDialog({ ...manualBlacklistDialog, fullName: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefon Numarası</label>
              <Input
                placeholder="05XX XXX XX XX"
                value={manualBlacklistDialog.phone || ""}
                onChange={(e) => setManualBlacklistDialog({ ...manualBlacklistDialog, phone: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sebep</label>
              <Textarea
                placeholder="Black List'e alınma sebebini yazın..."
                value={manualBlacklistDialog.reason || ""}
                onChange={(e) => setManualBlacklistDialog({ ...manualBlacklistDialog, reason: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualBlacklistDialog({ open: false })}>
              İptal
            </Button>
            <Button onClick={handleAddManualBlacklist} className="bg-red-600 hover:bg-red-700">
              Black List'e Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Patient Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hastayı Sil</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Bu hastayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve hasta ile ilgili tüm
                veriler (randevular, notlar, evraklar) silinecektir.
                {patientToDelete && (
                  <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="font-semibold text-sm">Hasta Bilgileri:</div>
                    <div className="text-sm">
                      <strong>Ad Soyad:</strong> {patientToDelete.full_name}
                    </div>
                    <div className="text-sm">
                      <strong>TC Kimlik No:</strong> {patientToDelete.tc_no}
                    </div>
                    <div className="text-sm">
                      <strong>Telefon:</strong> {patientToDelete.phone}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
