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
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Loader2, X } from "lucide-react"
import {
  upsertPregnancyVisit,
  deletePregnancyVisit,
  calculateGA,
  type PregnancyEpisode,
  type PregnancyVisit,
} from "@/lib/pregnancy"

interface VisitModalProps {
  open: boolean
  onClose: () => void
  episode: PregnancyEpisode
  visit: PregnancyVisit | null
  onSuccess: () => void
}

const MEDICATION_OPTIONS = [
  "Estrofem",
  "Progestan",
  "Crinone",
  "Coraspin",
  "Folbiol",
  "Elevit",
  "Clexane",
]

export function VisitModal({ open, onClose, episode, visit, onSuccess }: VisitModalProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const [formData, setFormData] = useState({
    visit_date: "",
    topic: "",
    ga_weeks: "",
    ga_days: "",
    weight_kg: "",
    bp_systolic: "",
    bp_diastolic: "",
    exam_notes: "",
  })

  const [usgMetrics, setUsgMetrics] = useState({
    crl: "",
    nt: "",
    bpd: "",
    hc: "",
    ac: "",
    fl: "",
    efw: "",
    fhr: "",
  })

  const [medications, setMedications] = useState<string[]>([])
  const [customMedication, setCustomMedication] = useState("")

  const [tests, setTests] = useState({
    ikili_test: false,
    ikili_test_sonuc: "",
    uclu_test: false,
    uclu_test_sonuc: "",
    dortlu_test: false,
    dortlu_test_sonuc: "",
    fetal_dna: false,
    fetal_dna_sonuc: "",
    ayrintili_usg: false,
    ayrintili_usg_sonuc: "",
    amniyosentez: false,
    amniyosentez_sonuc: "",
    seker_yukleme: false,
    seker_yukleme_sonuc: "",
    ailede_anomali: false,
    evcil_hayvan: false,
    cocukluk_asilari: false,
    alerji: false,
    tetanoz_asisi: false,
    ameliyatlar: "",
    diger_testler: "",
  })

  const [procedures, setProcedures] = useState({
    serklaj: false,
    reduksiyon: false,
    parasentez: false,
    diger: "",
  })

  // Initialize form when visit changes or modal opens
  useEffect(() => {
    if (visit) {
      setFormData({
        visit_date: visit.visit_date,
        topic: visit.topic || "",
        ga_weeks: visit.ga_weeks?.toString() || "",
        ga_days: visit.ga_days?.toString() || "",
        weight_kg: visit.weight_kg?.toString() || "",
        bp_systolic: visit.bp_systolic?.toString() || "",
        bp_diastolic: visit.bp_diastolic?.toString() || "",
        exam_notes: visit.exam_notes || "",
      })
      setUsgMetrics(visit.usg_metrics as any || {})
      setMedications(visit.medications || [])
      setTests(visit.tests as any || {})
      setProcedures(visit.procedures as any || {})
    } else {
      // Yeni muayene: tarih otomatik bugün olsun
      const today = new Date().toISOString().split("T")[0]
      setFormData({
        visit_date: today,
        topic: "",
        ga_weeks: "",
        ga_days: "",
        weight_kg: "",
        bp_systolic: "",
        bp_diastolic: "",
        exam_notes: "",
      })
      setUsgMetrics({})
      setMedications([])
      setCustomMedication("")
      setTests({
        ikili_test: false,
        ikili_test_sonuc: "",
        uclu_test: false,
        uclu_test_sonuc: "",
        dortlu_test: false,
        dortlu_test_sonuc: "",
        fetal_dna: false,
        fetal_dna_sonuc: "",
        ayrintili_usg: false,
        ayrintili_usg_sonuc: "",
        amniyosentez: false,
        amniyosentez_sonuc: "",
        seker_yukleme: false,
        seker_yukleme_sonuc: "",
        ailede_anomali: false,
        ailede_anomali_aciklama: "",
        evcil_hayvan: false,
        evcil_hayvan_aciklama: "",
        cocukluk_asilari: false,
        cocukluk_asilari_aciklama: "",
        alerji: false,
        alerji_aciklama: "",
        tetanoz_asisi: false,
        tetanoz_asisi_aciklama: "",
        ameliyatlar: "",
        diger_testler: "",
      })
      setProcedures({
        serklaj: false,
        reduksiyon: false,
        parasentez: false,
        diger: "",
      })
    }
  }, [visit, open])

  // Auto-calculate GA when date changes
  useEffect(() => {
    if (formData.visit_date && episode.sat_date) {
      const ga = calculateGA(episode.sat_date, formData.visit_date)
      setFormData((prev) => ({
        ...prev,
        ga_weeks: ga.weeks.toString(),
        ga_days: ga.days.toString(),
      }))
    }
  }, [formData.visit_date, episode.sat_date])

  // Get weight status message
  const getWeightStatus = () => {
    if (!formData.weight_kg || !formData.ga_weeks) return null
    
    const currentWeight = Number(formData.weight_kg)
    const gaWeeks = Number(formData.ga_weeks)
    const prePregnancyWeight = episode.pre_pregnancy_weight || 60
    
    // Hesaplama: Gebelikte haftalık ortalama 0.5 kg ağırlık artışı beklenir
    // Formül:
    // - Beklenen minimum ağırlık = Gebelik öncesi ağırlık + (hafta sayısı × 0.5 × 0.8)
    // - Beklenen maksimum ağırlık = Gebelik öncesi ağırlık + (hafta sayısı × 0.5 × 1.2)
    // - %20 tolerans (0.8 = -20%, 1.2 = +20%)
    
    const expectedWeightGain = gaWeeks * 0.5
    const minNormalWeight = prePregnancyWeight + (expectedWeightGain * 0.8)
    const maxNormalWeight = prePregnancyWeight + (expectedWeightGain * 1.2)
    
    if (currentWeight < minNormalWeight) {
      return { 
        status: "Düşük", 
        color: "bg-orange-100 text-orange-800", 
        message: `Bu haftaya göre beklenenden daha düşük ağırlık saptanmıştır. Beklenen aralık: ${minNormalWeight.toFixed(1)}-${maxNormalWeight.toFixed(1)} kg` 
      }
    } else if (currentWeight > maxNormalWeight) {
      return { 
        status: "Yüksek", 
        color: "bg-red-100 text-red-800", 
        message: `Bu haftaya göre beklenenden daha yüksek ağırlık saptanmıştır. Beklenen aralık: ${minNormalWeight.toFixed(1)}-${maxNormalWeight.toFixed(1)} kg` 
      }
    } else {
      return { 
        status: "Normal", 
        color: "bg-green-100 text-green-800", 
        message: `Kilo artışı normal seyrinde (${minNormalWeight.toFixed(1)}-${maxNormalWeight.toFixed(1)} kg aralığında)` 
      }
    }
  }

  const weightStatus = getWeightStatus()

  const handleAddMedication = () => {
    if (customMedication.trim() && !medications.includes(customMedication.trim())) {
      setMedications([...medications, customMedication.trim()])
      setCustomMedication("")
    }
  }

  const handleRemoveMedication = (med: string) => {
    setMedications(medications.filter((m) => m !== med))
  }

  const handleToggleMedication = (med: string) => {
    if (medications.includes(med)) {
      handleRemoveMedication(med)
    } else {
      setMedications([...medications, med])
    }
  }

  const handleSubmit = async () => {
    if (!formData.visit_date) {
      toast({
        title: "Uyarı",
        description: "Muayene tarihi gereklidir",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const visitData: Partial<PregnancyVisit> = {
        episode_id: episode.id,
        visit_date: formData.visit_date,
        topic: formData.topic || null,
        ga_weeks: formData.ga_weeks ? Number(formData.ga_weeks) : null,
        ga_days: formData.ga_days ? Number(formData.ga_days) : null,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
        bp_systolic: formData.bp_systolic ? Number(formData.bp_systolic) : null,
        bp_diastolic: formData.bp_diastolic ? Number(formData.bp_diastolic) : null,
        exam_notes: formData.exam_notes || null,
        usg_metrics: usgMetrics,
        medications,
        tests,
        procedures,
      }

      if (visit) {
        visitData.id = visit.id
      }

      await upsertPregnancyVisit(visitData)

      toast({
        title: "Başarılı",
        description: visit ? "Muayene güncellendi" : "Muayene kaydedildi",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("[v0] Visit save error:", error)
      toast({
        title: "Hata",
        description: error.message || "Muayene kaydedilemedi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!visit || !confirm("Bu muayeneyi silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      setDeleting(true)
      await deletePregnancyVisit(visit.id)
      
      toast({
        title: "Başarılı",
        description: "Muayene silindi",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("[v0] Visit delete error:", error)
      toast({
        title: "Hata",
        description: error.message || "Muayene silinemedi",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{visit ? "Muayene Düzenle" : "Yeni Muayene"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Temel Bilgiler</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visit_date">Tarih *</Label>
                <Input
                  id="visit_date"
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="topic">Konu</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="örn. Kontrol muayenesi"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="ga_weeks">GA Hafta</Label>
                <Input
                  id="ga_weeks"
                  type="number"
                  value={formData.ga_weeks}
                  readOnly
                  className="bg-gray-50"
                  placeholder="Otomatik hesaplanır"
                />
              </div>
              <div>
                <Label htmlFor="ga_days">GA Gün</Label>
                <Input
                  id="ga_days"
                  type="number"
                  max="6"
                  value={formData.ga_days}
                  readOnly
                  className="bg-gray-50"
                  placeholder="Otomatik hesaplanır"
                />
              </div>
              <div>
                <Label htmlFor="weight_kg">Kilo (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  placeholder="örn. 68.5"
                />
                {weightStatus && (
                  <div className={`text-xs mt-1 p-2 rounded ${weightStatus.color}`}>
                    {weightStatus.message}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bp_systolic">Tansiyon (S)</Label>
                <Input
                  id="bp_systolic"
                  type="number"
                  value={formData.bp_systolic}
                  onChange={(e) => setFormData({ ...formData, bp_systolic: e.target.value })}
                  placeholder="örn. 120"
                />
              </div>
              <div>
                <Label htmlFor="bp_diastolic">Tansiyon (D)</Label>
                <Input
                  id="bp_diastolic"
                  type="number"
                  value={formData.bp_diastolic}
                  onChange={(e) => setFormData({ ...formData, bp_diastolic: e.target.value })}
                  placeholder="örn. 80"
                />
              </div>
            </div>
          </div>

          {/* USG Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">USG Ölçümleri</h3>
            <div className="grid grid-cols-4 gap-4">
              {Object.keys(usgMetrics).map((key) => (
                <div key={key}>
                  <Label htmlFor={key}>{key.toUpperCase()}</Label>
                  <Input
                    id={key}
                    type="number"
                    step="0.1"
                    value={usgMetrics[key as keyof typeof usgMetrics]}
                    onChange={(e) => setUsgMetrics({ ...usgMetrics, [key]: e.target.value })}
                    placeholder="-"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">İlaçlar</h3>
            <div className="flex flex-wrap gap-2">
              {MEDICATION_OPTIONS.map((med) => (
                <Badge
                  key={med}
                  variant={medications.includes(med) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleToggleMedication(med)}
                >
                  {med}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customMedication}
                onChange={(e) => setCustomMedication(e.target.value)}
                placeholder="Özel ilaç ekle"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddMedication()
                  }
                }}
              />
              <Button type="button" onClick={handleAddMedication} variant="outline">
                Ekle
              </Button>
            </div>
            {medications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {medications.map((med) => (
                  <Badge key={med} variant="secondary" className="gap-1">
                    {med}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveMedication(med)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tests */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Testler</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ikili_test"
                    checked={tests.ikili_test}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, ikili_test: checked as boolean })
                    }
                  />
                  <Label htmlFor="ikili_test" className="cursor-pointer">
                    İkili Test
                  </Label>
                </div>
                {tests.ikili_test && (
                  <Input
                    placeholder="Test sonucu"
                    value={tests.ikili_test_sonuc || ""}
                    onChange={(e) => setTests({ ...tests, ikili_test_sonuc: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="uclu_test"
                    checked={tests.uclu_test}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, uclu_test: checked as boolean })
                    }
                  />
                  <Label htmlFor="uclu_test" className="cursor-pointer">
                    Üçlü Test
                  </Label>
                </div>
                {tests.uclu_test && (
                  <Input
                    placeholder="Test sonucu"
                    value={tests.uclu_test_sonuc || ""}
                    onChange={(e) => setTests({ ...tests, uclu_test_sonuc: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dortlu_test"
                    checked={tests.dortlu_test}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, dortlu_test: checked as boolean })
                    }
                  />
                  <Label htmlFor="dortlu_test" className="cursor-pointer">
                    Dörtlü Test
                  </Label>
                </div>
                {tests.dortlu_test && (
                  <Input
                    placeholder="Test sonucu"
                    value={tests.dortlu_test_sonuc || ""}
                    onChange={(e) => setTests({ ...tests, dortlu_test_sonuc: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="fetal_dna"
                    checked={tests.fetal_dna}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, fetal_dna: checked as boolean })
                    }
                  />
                  <Label htmlFor="fetal_dna" className="cursor-pointer">
                    Fetal DNA / Prenatal
                  </Label>
                </div>
                {tests.fetal_dna && (
                  <Input
                    placeholder="Test sonucu"
                    value={tests.fetal_dna_sonuc || ""}
                    onChange={(e) => setTests({ ...tests, fetal_dna_sonuc: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ayrintili_usg"
                    checked={tests.ayrintili_usg}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, ayrintili_usg: checked as boolean })
                    }
                  />
                  <Label htmlFor="ayrintili_usg" className="cursor-pointer">
                    Ayrıntılı USG
                  </Label>
                </div>
                {tests.ayrintili_usg && (
                  <Input
                    placeholder="Test sonucu"
                    value={tests.ayrintili_usg_sonuc || ""}
                    onChange={(e) => setTests({ ...tests, ayrintili_usg_sonuc: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="amniyosentez"
                    checked={tests.amniyosentez}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, amniyosentez: checked as boolean })
                    }
                  />
                  <Label htmlFor="amniyosentez" className="cursor-pointer">
                    Amniyosentez
                  </Label>
                </div>
                {tests.amniyosentez && (
                  <Input
                    placeholder="Test sonucu"
                    value={tests.amniyosentez_sonuc || ""}
                    onChange={(e) => setTests({ ...tests, amniyosentez_sonuc: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="seker_yukleme"
                    checked={tests.seker_yukleme}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, seker_yukleme: checked as boolean })
                    }
                  />
                  <Label htmlFor="seker_yukleme" className="cursor-pointer">
                    Şeker Yükleme
                  </Label>
                </div>
                {tests.seker_yukleme && (
                  <Input
                    placeholder="Test sonucu"
                    value={tests.seker_yukleme_sonuc || ""}
                    onChange={(e) => setTests({ ...tests, seker_yukleme_sonuc: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="diger_testler">Diğer Testler</Label>
              <Input
                id="diger_testler"
                value={tests.diger_testler}
                onChange={(e) => setTests({ ...tests, diger_testler: e.target.value })}
                placeholder="Diğer test açıklamaları"
              />
            </div>
          </div>

          {/* Medical History / Anamnez */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Tıbbi Geçmiş / Anamnez</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ailede_anomali"
                    checked={tests.ailede_anomali}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, ailede_anomali: checked as boolean })
                    }
                  />
                  <Label htmlFor="ailede_anomali" className="cursor-pointer text-sm">
                    Soygeçmiş: Ailede anomali var mı?
                  </Label>
                </div>
                {tests.ailede_anomali && (
                  <Input
                    placeholder="Açıklama"
                    value={tests.ailede_anomali_aciklama || ""}
                    onChange={(e) => setTests({ ...tests, ailede_anomali_aciklama: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="evcil_hayvan"
                    checked={tests.evcil_hayvan}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, evcil_hayvan: checked as boolean })
                    }
                  />
                  <Label htmlFor="evcil_hayvan" className="cursor-pointer text-sm">
                    Evcil hayvan besliyor musunuz?
                  </Label>
                </div>
                {tests.evcil_hayvan && (
                  <Input
                    placeholder="Açıklama"
                    value={tests.evcil_hayvan_aciklama || ""}
                    onChange={(e) => setTests({ ...tests, evcil_hayvan_aciklama: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cocukluk_asilari"
                    checked={tests.cocukluk_asilari}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, cocukluk_asilari: checked as boolean })
                    }
                  />
                  <Label htmlFor="cocukluk_asilari" className="cursor-pointer text-sm">
                    Çocukluk aşılarınız tam mı?
                  </Label>
                </div>
                {tests.cocukluk_asilari && (
                  <Input
                    placeholder="Açıklama"
                    value={tests.cocukluk_asilari_aciklama || ""}
                    onChange={(e) => setTests({ ...tests, cocukluk_asilari_aciklama: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="alerji"
                    checked={tests.alerji}
                    onCheckedChange={(checked) =>
                      setTests({ ...tests, alerji: checked as boolean })
                    }
                  />
                  <Label htmlFor="alerji" className="cursor-pointer text-sm">
                    Alerji var mı?
                  </Label>
                </div>
                {tests.alerji && (
                  <Input
                    placeholder="Açıklama"
                    value={tests.alerji_aciklama || ""}
                    onChange={(e) => setTests({ ...tests, alerji_aciklama: e.target.value })}
                    className="ml-6"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Vaccinations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Aşılar</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tetanoz_asisi"
                  checked={tests.tetanoz_asisi}
                  onCheckedChange={(checked) =>
                    setTests({ ...tests, tetanoz_asisi: checked as boolean })
                  }
                />
                <Label htmlFor="tetanoz_asisi" className="cursor-pointer">
                  Gebelikte Tetanoz aşısı olundu mu?
                </Label>
              </div>
              {tests.tetanoz_asisi && (
                <Input
                  placeholder="Tarih ve açıklama"
                  value={tests.tetanoz_asisi_aciklama || ""}
                  onChange={(e) => setTests({ ...tests, tetanoz_asisi_aciklama: e.target.value })}
                  className="ml-6"
                />
              )}
            </div>
          </div>

          {/* Surgeries */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Ameliyatlar</h3>
            <Textarea
              placeholder="Geçirilmiş ameliyatlar, işlemler (serklaj, redüksiyon, parasentez vb.) ve tarihleri"
              value={tests.ameliyatlar}
              onChange={(e) => setTests({ ...tests, ameliyatlar: e.target.value })}
              rows={3}
            />
          </div>

          {/* Procedures */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">İşlemler</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="serklaj"
                  checked={procedures.serklaj}
                  onCheckedChange={(checked) =>
                    setProcedures({ ...procedures, serklaj: checked as boolean })
                  }
                />
                <Label htmlFor="serklaj" className="cursor-pointer">
                  Serklaj
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="reduksiyon"
                  checked={procedures.reduksiyon}
                  onCheckedChange={(checked) =>
                    setProcedures({ ...procedures, reduksiyon: checked as boolean })
                  }
                />
                <Label htmlFor="reduksiyon" className="cursor-pointer">
                  Redüksiyon
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="parasentez"
                  checked={procedures.parasentez}
                  onCheckedChange={(checked) =>
                    setProcedures({ ...procedures, parasentez: checked as boolean })
                  }
                />
                <Label htmlFor="parasentez" className="cursor-pointer">
                  Parasentez
                </Label>
              </div>
            </div>
            <div>
              <Label htmlFor="diger_procedures">Diğer İşlemler</Label>
              <Input
                id="diger_procedures"
                value={procedures.diger}
                onChange={(e) => setProcedures({ ...procedures, diger: e.target.value })}
                placeholder="Diğer işlem açıklamaları"
              />
            </div>
          </div>

          {/* Exam Notes */}
          <div>
            <Label>Muayene Notu</Label>
            <RichTextEditor
              value={formData.exam_notes}
              onChange={(val) => setFormData({ ...formData, exam_notes: val })}
              placeholder="Genel muayene bulguları ve notlar"
              rows={5}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {visit && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || deleting || showConfirmation}
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sil
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (showConfirmation) {
                  setShowConfirmation(false)
                } else {
                  onClose()
                }
              }} 
              disabled={loading || deleting}
            >
              {showConfirmation ? "Geri" : "İptal"}
            </Button>
            {!showConfirmation ? (
              <Button onClick={() => setShowConfirmation(true)} disabled={loading || deleting}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading || deleting}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Onayla
              </Button>
            )}
          </div>
        </DialogFooter>

        {showConfirmation && (
          <div className="border-t pt-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Muayene Özeti</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div><span className="font-medium">Tarih:</span> {new Date(formData.visit_date).toLocaleDateString("tr-TR")}</div>
                <div><span className="font-medium">GA:</span> {formData.ga_weeks} hafta {formData.ga_days} gün</div>
                {formData.weight_kg && <div><span className="font-medium">Kilo:</span> {formData.weight_kg} kg</div>}
                {formData.bp_systolic && <div><span className="font-medium">Tansiyon:</span> {formData.bp_systolic}/{formData.bp_diastolic}</div>}
                <div><span className="font-medium">Konu:</span> {formData.topic || "Kontrol"}</div>
              </div>
              <p className="text-xs text-blue-600 mt-3 italic">Bu bilgileri onayladıktan sonra kaydedilecektir.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
