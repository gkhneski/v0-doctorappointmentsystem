"use client"

import { useState } from "react"
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
import { createPregnancyEpisode, calculateEDD } from "@/lib/pregnancy"

interface StartPregnancyModalProps {
  open: boolean
  onClose: () => void
  patientId: string
  patientData?: {
    blood_group?: string
    spouse_blood_group?: string
  }
  onSuccess: () => void
}

export function StartPregnancyModal({
  open,
  onClose,
  patientId,
  patientData,
  onSuccess,
}: StartPregnancyModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    sat_date: "",
    edd_date: "",
    conception_type: "",
    blood_group: patientData?.blood_group || "",
    rh: "",
    spouse_blood_group: patientData?.spouse_blood_group || "",
    height_cm: "",
    pre_pregnancy_weight: "",
    important_notes: "",
  })

  // patientData gelince formu güncelle
  useState(() => {
    if (patientData) {
      setFormData((prev) => ({
        ...prev,
        blood_group: patientData.blood_group || "",
        spouse_blood_group: patientData.spouse_blood_group || "",
      }))
    }
  })

  const handleSATChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      sat_date: value,
      edd_date: value ? calculateEDD(value) : "",
    }))
  }

  const handleSubmit = async () => {
    if (!formData.sat_date) {
      toast({
        title: "Uyarı",
        description: "SAT tarihi gereklidir",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      
      // Calculate BMI if height and weight provided
      const bmi = formData.height_cm && formData.pre_pregnancy_weight
        ? (Number(formData.pre_pregnancy_weight) / Math.pow(Number(formData.height_cm) / 100, 2)).toFixed(2)
        : null

      await createPregnancyEpisode(patientId, {
        sat_date: formData.sat_date,
        edd_date: formData.edd_date,
        conception_type: formData.conception_type || null,
        blood_group: formData.blood_group || null,
        rh: formData.rh || null,
        spouse_blood_group: formData.spouse_blood_group || null,
        height_cm: formData.height_cm ? Number(formData.height_cm) : null,
        pre_pregnancy_weight: formData.pre_pregnancy_weight ? Number(formData.pre_pregnancy_weight) : null,
        bmi: bmi ? Number(bmi) : null,
        important_notes: formData.important_notes || null,
      } as any)

      toast({
        title: "Başarılı",
        description: "Gebelik kaydı oluşturuldu",
      })

      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        sat_date: "",
        edd_date: "",
        conception_type: "",
        blood_group: patientData?.blood_group || "",
        rh: "",
        spouse_blood_group: patientData?.spouse_blood_group || "",
        height_cm: "",
        pre_pregnancy_weight: "",
        important_notes: "",
      })
    } catch (error: any) {
      console.error("[v0] Create pregnancy error:", error)
      toast({
        title: "Hata",
        description: error.message || "Gebelik kaydı oluşturulamadı",
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
          <DialogTitle>Gebelik Başlat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sat_date">SAT (Son Adet Tarihi) *</Label>
              <Input
                id="sat_date"
                type="date"
                value={formData.sat_date}
                onChange={(e) => handleSATChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edd_date">TDT (Tahmini Doğum Tarihi)</Label>
              <Input
                id="edd_date"
                type="date"
                value={formData.edd_date}
                onChange={(e) => setFormData({ ...formData, edd_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="conception_type">Oluşum Tipi</Label>
            <Select
              value={formData.conception_type}
              onValueChange={(value) => setFormData({ ...formData, conception_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spontan">Spontan</SelectItem>
                <SelectItem value="ART">ART</SelectItem>
                <SelectItem value="IUI">IUI</SelectItem>
                <SelectItem value="operasyon">Operasyon</SelectItem>
                <SelectItem value="diger">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="blood_group">Kan Grubu</Label>
                {patientData?.blood_group && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Hasta kartından</span>
                )}
              </div>
              <Select
                value={formData.blood_group}
                onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={patientData?.blood_group ? patientData.blood_group : "Seçiniz"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A Rh+</SelectItem>
                  <SelectItem value="A-">A Rh-</SelectItem>
                  <SelectItem value="B+">B Rh+</SelectItem>
                  <SelectItem value="B-">B Rh-</SelectItem>
                  <SelectItem value="AB+">AB Rh+</SelectItem>
                  <SelectItem value="AB-">AB Rh-</SelectItem>
                  <SelectItem value="0+">0 Rh+</SelectItem>
                  <SelectItem value="0-">0 Rh-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="spouse_blood_group">Eş Kan Grubu</Label>
                {patientData?.spouse_blood_group && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Hasta kartından</span>
                )}
              </div>
              <Select
                value={formData.spouse_blood_group}
                onValueChange={(value) => setFormData({ ...formData, spouse_blood_group: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={patientData?.spouse_blood_group ? patientData.spouse_blood_group : "Seçiniz"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A Rh+</SelectItem>
                  <SelectItem value="A-">A Rh-</SelectItem>
                  <SelectItem value="B+">B Rh+</SelectItem>
                  <SelectItem value="B-">B Rh-</SelectItem>
                  <SelectItem value="AB+">AB Rh+</SelectItem>
                  <SelectItem value="AB-">AB Rh-</SelectItem>
                  <SelectItem value="0+">0 Rh+</SelectItem>
                  <SelectItem value="0-">0 Rh-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height_cm">Boy (cm)</Label>
              <Input
                id="height_cm"
                type="number"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                placeholder="örn. 165"
              />
            </div>
            <div>
              <Label htmlFor="pre_weight_kg">Gebelik Öncesi Kilo (kg)</Label>
              <Input
                id="pre_weight_kg"
                type="number"
                step="0.1"
                value={formData.pre_weight_kg}
                onChange={(e) => setFormData({ ...formData, pre_weight_kg: e.target.value })}
                placeholder="örn. 65.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="important_notes">Önemli Notlar</Label>
            <Textarea
              id="important_notes"
              value={formData.important_notes}
              onChange={(e) => setFormData({ ...formData, important_notes: e.target.value })}
              placeholder="Önemli notlar, uyarılar vb."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
