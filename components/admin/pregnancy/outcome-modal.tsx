"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import {
  upsertPregnancyOutcome,
  closePregnancy,
  type PregnancyEpisode,
  type PregnancyOutcome,
} from "@/lib/pregnancy"

interface OutcomeModalProps {
  open: boolean
  onClose: () => void
  episode: PregnancyEpisode
  existingOutcome: PregnancyOutcome | null
  onSuccess: () => void
}

export function OutcomeModal({
  open,
  onClose,
  episode,
  existingOutcome,
  onSuccess,
}: OutcomeModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    result: "",
    result_date: "",
    delivery_week: "",
    delivery_day: "",
    delivery_type: "",
    baby_count: "",
    hospital: "",
    delivery_doctor: "",
    notes: "",
  })

  useEffect(() => {
    if (existingOutcome) {
      setFormData({
        result: existingOutcome.result || "",
        result_date: existingOutcome.result_date || "",
        delivery_week: existingOutcome.delivery_week?.toString() || "",
        delivery_day: existingOutcome.delivery_day?.toString() || "",
        delivery_type: existingOutcome.delivery_type || "",
        baby_count: existingOutcome.baby_count?.toString() || "",
        hospital: existingOutcome.hospital || "",
        delivery_doctor: existingOutcome.delivery_doctor || "",
        notes: existingOutcome.notes || "",
      })
    } else {
      setFormData({
        result: "",
        result_date: new Date().toISOString().split("T")[0],
        delivery_week: "",
        delivery_day: "",
        delivery_type: "",
        baby_count: "",
        hospital: "",
        delivery_doctor: "",
        notes: "",
      })
    }
  }, [existingOutcome, open])

  const handleSubmit = async () => {
    if (!formData.result) {
      toast({
        title: "Uyarı",
        description: "Sonuç seçimi gereklidir",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Save outcome
      await upsertPregnancyOutcome({
        episode_id: episode.id,
        result: formData.result,
        result_date: formData.result_date || null,
        delivery_week: formData.delivery_week ? Number(formData.delivery_week) : null,
        delivery_day: formData.delivery_day ? Number(formData.delivery_day) : null,
        delivery_type: formData.delivery_type || null,
        baby_count: formData.baby_count ? Number(formData.baby_count) : null,
        hospital: formData.hospital || null,
        delivery_doctor: formData.delivery_doctor || null,
        notes: formData.notes || null,
      } as any)

      // Close the pregnancy episode
      await closePregnancy(episode.id)

      toast({
        title: "Başarılı",
        description: "Gebelik kapatıldı",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("[v0] Outcome save error:", error)
      toast({
        title: "Hata",
        description: error.message || "Gebelik kapatılamadı",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gebeliği Kapat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="result">Sonuç *</Label>
              <Select
                value={formData.result}
                onValueChange={(value) => setFormData({ ...formData, result: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dogum">Doğum</SelectItem>
                  <SelectItem value="devam">Devam Ediyor</SelectItem>
                  <SelectItem value="dusuk">Düşük</SelectItem>
                  <SelectItem value="sonlandirma">Sonlandırma</SelectItem>
                  <SelectItem value="ulasilamadi">Ulaşılamadı</SelectItem>
                  <SelectItem value="diger">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="result_date">Sonuç Tarihi</Label>
              <Input
                id="result_date"
                type="date"
                value={formData.result_date}
                onChange={(e) => setFormData({ ...formData, result_date: e.target.value })}
              />
            </div>
          </div>

          {formData.result === "dogum" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_week">Doğum Haftası</Label>
                  <Input
                    id="delivery_week"
                    type="number"
                    value={formData.delivery_week}
                    onChange={(e) => setFormData({ ...formData, delivery_week: e.target.value })}
                    placeholder="örn. 38"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_day">Doğum Günü</Label>
                  <Input
                    id="delivery_day"
                    type="number"
                    max="6"
                    value={formData.delivery_day}
                    onChange={(e) => setFormData({ ...formData, delivery_day: e.target.value })}
                    placeholder="0-6"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_type">Doğum Şekli</Label>
                  <Select
                    value={formData.delivery_type}
                    onValueChange={(value) => setFormData({ ...formData, delivery_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C/S">C/S (Sezaryen)</SelectItem>
                      <SelectItem value="N/D">N/D (Normal Doğum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="baby_count">Bebek Sayısı</Label>
                  <Input
                    id="baby_count"
                    type="number"
                    value={formData.baby_count}
                    onChange={(e) => setFormData({ ...formData, baby_count: e.target.value })}
                    placeholder="örn. 1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hospital">Hastane</Label>
                <Input
                  id="hospital"
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  placeholder="Hastane adı"
                />
              </div>

              <div>
                <Label htmlFor="delivery_doctor">Doğum Doktoru</Label>
                <Input
                  id="delivery_doctor"
                  value={formData.delivery_doctor}
                  onChange={(e) => setFormData({ ...formData, delivery_doctor: e.target.value })}
                  placeholder="Doktor adı"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="notes">Not</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ek açıklamalar ve notlar"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet ve Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
