"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Loader2, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { YesNoField } from "./infertility/YesNoField"
import { BloodGroupSelect, BLOOD_GROUPS } from "./infertility/BloodGroupSelect"
import { RichTextEditor } from "./infertility/RichTextEditor"

interface InfertilityEvaluationFormProps {
  patientId: string
  appointmentId?: string
}

export function InfertilityEvaluationForm({ patientId, appointmentId }: InfertilityEvaluationFormProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"unsaved" | "saving" | "saved">("unsaved")
  const [lastSavedTime, setLastSavedTime] = useState<string>("")
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)

  // Tek bir formData state'i - TÜM form verilerini içeriyor
  const [formData, setFormData] = useState<any>({
    general_info: { doctor: "", date: "", file_no: "" },
    infertility_status: { marriage_year: "", primer: false, sekonder: false, infertility_years: "" },
    female_anamnesis: { g: 0, p: 0, y: 0, a: 0, e: 0 },
    female_lab_life: {
      blood_group: "",
      karyotype: "",
      lifestyle: {
        medication: { has: "yok", note: "" },
        allergy: { has: "yok", note: "" },
        smoking_daily: 0,
        alcohol: "yok",
      },
      measurements: { weight_kg: "", height_cm: "", bmi: "" },
      lab_warning_notes: "",
      important_notes: "",
    },
    hsg: [{ id: 1, date: "", place: "", note: "" }],
    female_diagnosis: {},
    male_anamnesis: {
      systemic_disease: "yok",
      smoking_daily: 0,
      alcohol: "yok",
      allergy: "yok",
      past_surgery: "yok",
      medication: { has: "yok", note: "" },
      blood_group: "",
      karyotype: "",
      y_chromosome_deletion: "",
      lab_warning_notes: "",
    },
    spermiogram: [
      { id: 1, date: "", place: "", volume_ml: "", concentration: "", prog_motility_percent: "", morphology: "", tank_address: "", notes: "" },
    ],
    male_diagnosis: {},
    usg: { note: "", html: "" },
    symptoms: {},
    art_history: {},
  })

  // Use singleton client
  const supabase = createClient()

  useEffect(() => {
    loadLatestEvaluation()
  }, [patientId])

  // Watch for changes to mark as unsaved
  useEffect(() => {
    if (loaded) {
      setSaveStatus("unsaved")
    }
  }, [formData])

  const loadLatestEvaluation = async () => {
    try {
      console.log("[v0] Loading evaluation for patient:", patientId)

      const { data, error } = await supabase
        .from("infertility_evaluations")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("[v0] Load error:", error)
      } else if (data) {
        console.log("[v0] Loaded data:", data)
        // Deep merge function to preserve nested structure
        const deepMerge = (target: any, source: any) => {
          if (!source || typeof source !== "object") return target
          const result = { ...target }
          for (const key in source) {
            if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
              result[key] = deepMerge(target[key] || {}, source[key])
            } else {
              result[key] = source[key]
            }
          }
          return result
        }

        // Veritabanından gelen tüm JSONB alanlarını birleştir
        const loadedFormData = {
          general_info: {
            doctor: data.doctor_name || "",
            date: data.evaluation_date || "",
            file_no: data.file_number || "",
          },
          infertility_status: {
            marriage_year: data.female_anamnesis?.marriage_year?.toString() || "",
            primer: data.infertility_type === "primer",
            sekonder: data.infertility_type === "sekonder",
            infertility_years: data.infertility_duration?.toString() || "",
          },
          female_anamnesis: {
            g: data.g_value || 0,
            p: data.p_value || 0,
            y: data.y_value || 0,
            a: data.a_value || 0,
            e: data.e_value || 0,
          },
          female_lab_life: deepMerge(formData.female_lab_life, data.female_anamnesis || {}),
          hsg:
            Array.isArray(data.hsg_records) && data.hsg_records.length > 0
              ? data.hsg_records.map((row: any) => ({
                  date: row.date || "",
                  location: row.location || "",
                  description: row.description || "",
                }))
              : formData.hsg,
          female_diagnosis: data.diagnoses?.female || {},
          male_anamnesis: deepMerge(formData.male_anamnesis, data.male_anamnesis || {}),
          spermiogram:
            Array.isArray(data.spermiogram_data) && data.spermiogram_data.length > 0
              ? data.spermiogram_data.map((row: any) => ({
                  date: row.date || "",
                  location: row.location || "",
                  volume_ml: row.volume_ml || "",
                  concentration: row.concentration || "",
                  progressive_motility: row.progressive_motility || "",
                  morphology: row.morphology || "",
                  tank_address: row.tank_address || "",
                  notes: row.notes || "",
                }))
              : formData.spermiogram,
          male_diagnosis: data.diagnoses?.male || {},
          usg: {
            note: data.usg_notes || "",
            html: data.usg_notes || "", // HTML content is stored in usg_notes
          },
          symptoms: data.symptoms || {},
          art_history: data.art_history || {},
        }
        setLoaded(true) // Set loaded BEFORE setFormData to prevent triggering unsaved state
        setFormData(loadedFormData)
      } else {
        setLoaded(true) // Also set loaded if no data exists
      }
    } catch (error) {
      console.error("[v0] Load evaluation error:", error)
    }
  }

  const updateFormData = (path: string[], value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev }
      let current = newData
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] }
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      return newData
    })
  }

  const addHsgRow = () => {
    const newId = Math.max(...formData.hsg.map((r: any) => r.id), 0) + 1
    setFormData({
      ...formData,
      hsg: [...formData.hsg, { id: newId, date: "", place: "", note: "" }],
    })
  }

  const removeHsgRow = (id: number) => {
    setFormData({
      ...formData,
      hsg: formData.hsg.filter((r: any) => r.id !== id),
    })
  }

  const updateHsgRow = (id: number, field: string, value: any) => {
    setFormData({
      ...formData,
      hsg: formData.hsg.map((r: any) => (r.id === id ? { ...r, [field]: value } : r)),
    })
  }

  const addSpermiogramRow = () => {
    const newId = Math.max(...formData.spermiogram.map((r: any) => r.id), 0) + 1
    setFormData({
      ...formData,
      spermiogram: [
        ...formData.spermiogram,
        {
          id: newId,
          date: "",
          place: "",
          volume_ml: "",
          concentration: "",
          prog_motility_percent: "",
          morphology: "",
          tank_address: "",
          notes: "",
        },
      ],
    })
  }

  const removeSpermiogramRow = (id: number) => {
    setFormData({
      ...formData,
      spermiogram: formData.spermiogram.filter((r: any) => r.id !== id),
    })
  }

  const updateSpermiogramRow = (id: number, field: string, value: any) => {
    setFormData({
      ...formData,
      spermiogram: formData.spermiogram.map((r: any) => (r.id === id ? { ...r, [field]: value } : r)),
    })
  }

  const handleSaveForm = async () => {
    try {
      setSaving(true)
      setSaveStatus("saving")
      console.log("[v0] Saving infertility evaluation...")

      const evaluationData = {
        patient_id: patientId,
        appointment_id: appointmentId,
        evaluation_date: formData.general_info.date || new Date().toISOString().split("T")[0],
        doctor_name: formData.general_info.doctor,
        file_number: formData.general_info.file_no,
        infertility_type: formData.infertility_status.primer
          ? "primer"
          : formData.infertility_status.sekonder
            ? "sekonder"
            : null,
        infertility_duration: formData.infertility_status.infertility_years
          ? parseInt(formData.infertility_status.infertility_years)
          : null,
        g_value: formData.female_anamnesis.g,
        p_value: formData.female_anamnesis.p,
        y_value: formData.female_anamnesis.y,
        a_value: formData.female_anamnesis.a,
        e_value: formData.female_anamnesis.e,
        symptoms: formData.symptoms,
        female_anamnesis: {
          ...formData.female_lab_life,
          marriage_year: formData.infertility_status.marriage_year
            ? Number(formData.infertility_status.marriage_year)
            : null,
        },
        male_anamnesis: formData.male_anamnesis,
        diagnoses: {
          female: formData.female_diagnosis,
          male: formData.male_diagnosis,
        },
        spermiogram_data: formData.spermiogram,
        art_history: formData.art_history,
        hsg_records: formData.hsg,
        usg_notes: formData.usg.html || formData.usg.note,
        updated_at: new Date().toISOString(),
      }

      // Check if record exists for this patient
      const { data: existing } = await supabase
        .from("infertility_evaluations")
        .select("id")
        .eq("patient_id", patientId)
        .maybeSingle()

      let error
      if (existing) {
        // Update existing record
        const result = await supabase.from("infertility_evaluations").update(evaluationData).eq("patient_id", patientId)
        error = result.error
      } else {
        // Insert new record
        const result = await supabase.from("infertility_evaluations").insert(evaluationData)
        error = result.error
      }

      if (error) {
        console.error("[v0] Save error:", error)
        throw error
      }

      console.log("[v0] Form saved successfully")

      // Reload data from database to show persisted values
      await loadLatestEvaluation()

      // Set saved status with timestamp
      const now = new Date()
      const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      setLastSavedTime(timeString)
      setSaveStatus("saved")
      setShowSaveAnimation(true)
      setTimeout(() => setShowSaveAnimation(false), 2000)

      toast({
        title: "Değişiklikler kaydedildi",
        description: "Tüm form verileri başarıyla saklandı ve yüklendi.",
        duration: 4000,
      })
    } catch (error: any) {
      console.error("[v0] Form save error:", error)
      setSaveStatus("unsaved")
      toast({
        title: "Hata",
        description: error.message || "Form kaydedilemedi",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* GENEL BİLGİLER */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Doktor</Label>
              <Input
                type="text"
                value={formData.general_info.doctor}
                onChange={(e) => updateFormData(["general_info", "doctor"], e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input
                type="date"
                value={formData.general_info.date}
                onChange={(e) => updateFormData(["general_info", "date"], e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Dosya No</Label>
              <Input
                type="text"
                value={formData.general_info.file_no}
                onChange={(e) => updateFormData(["general_info", "file_no"], e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İNFERTİLİTE DURUMU */}
      <Card>
        <CardHeader>
          <CardTitle>İnfertilite Durumu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Evlilik Yılı</Label>
              <Input
                type="number"
                placeholder="Yıl giriniz"
                className="max-w-xs"
                value={formData.infertility_status?.marriage_year ?? ""}
                onChange={(e) => updateFormData(["infertility_status", "marriage_year"], e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>İnfertilite Süresi (Yıl)</Label>
              <Input
                type="number"
                value={formData.infertility_status.infertility_years}
                onChange={(e) => updateFormData(["infertility_status", "infertility_years"], e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>İnfertilite Tipi</Label>
              <div className="flex gap-4 items-center h-10">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="primer"
                    checked={formData.infertility_status.primer}
                    onCheckedChange={(checked) => updateFormData(["infertility_status", "primer"], checked)}
                  />
                  <label htmlFor="primer" className="text-sm cursor-pointer">
                    Primer
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sekonder"
                    checked={formData.infertility_status.sekonder}
                    onCheckedChange={(checked) => updateFormData(["infertility_status", "sekonder"], checked)}
                  />
                  <label htmlFor="sekonder" className="text-sm cursor-pointer">
                    Sekonder
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KADIN ANAMNEZ */}
      <Card>
        <CardHeader>
          <CardTitle>Kadın Anamnez</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {["g", "p", "y", "a", "e"].map((key) => (
              <div key={key} className="space-y-2">
                <Label className="uppercase">{key}</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={formData.female_anamnesis[key]}
                  onChange={(e) =>
                    updateFormData(["female_anamnesis", key], parseInt(e.target.value) || 0)
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEMPTOMLAR */}
      <Card>
        <CardHeader>
          <CardTitle>Semptomlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Dismenore",
            "Dismenore arttı",
            "Adet kanaması arttı",
            "Oligomenore",
            "Adet düzensizliği",
            "Adet gecikmesi",
            "Spotting",
            "Pelvik ağrı",
            "Dizüri",
            "Disparoni",
            "Barsak şikayetleri",
            "Hematüri",
            "Rektal kanama",
          ].map((symptom) => {
            const symptomKey = symptom.replace(/\s+/g, "_").toLowerCase()
            const symptomData = formData.symptoms[symptomKey] || { has: "yok", note: "" }
            return (
              <YesNoField
                key={symptom}
                label={symptom}
                value={symptomData.has}
                noteValue={symptomData.note}
                onValueChange={(value) => updateFormData(["symptoms", symptomKey, "has"], value)}
                onNoteChange={(note) => updateFormData(["symptoms", symptomKey, "note"], note)}
              />
            )
          })}
        </CardContent>
      </Card>

      {/* KADIN LAB & YAŞAM */}
      <Card>
        <CardHeader>
          <CardTitle>Kadın Lab & Yaşam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BloodGroupSelect
              value={formData.female_lab_life.blood_group}
              onValueChange={(value) => updateFormData(["female_lab_life", "blood_group"], value)}
            />
            <div className="space-y-2">
              <Label>Karyotip</Label>
              <Input
                type="text"
                value={formData.female_lab_life.karyotype}
                onChange={(e) => updateFormData(["female_lab_life", "karyotype"], e.target.value)}
              />
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Yaşam Tarzı</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sigara (Günlük Adet)</Label>
                <Input
                  type="number"
                  value={formData.female_lab_life.lifestyle.smoking_daily}
                  onChange={(e) =>
                    updateFormData(
                      ["female_lab_life", "lifestyle", "smoking_daily"],
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Alkol</Label>
                <Select
                  value={formData.female_lab_life.lifestyle.alcohol}
                  onValueChange={(value) => updateFormData(["female_lab_life", "lifestyle", "alcohol"], value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Yok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="var">Var</SelectItem>
                    <SelectItem value="yok">Yok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alerji</Label>
                <Select
                  value={formData.female_lab_life.lifestyle.allergy.has}
                  onValueChange={(value) =>
                    updateFormData(["female_lab_life", "lifestyle", "allergy", "has"], value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Yok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="var">Var</SelectItem>
                    <SelectItem value="yok">Yok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Ölçümler</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Kilo (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.female_lab_life.measurements.weight_kg}
                  onChange={(e) => {
                    const weight = parseFloat(e.target.value) || 0
                    const height = parseFloat(formData.female_lab_life.measurements.height_cm) || 0
                    const bmi = height > 0 ? (weight / ((height / 100) ** 2)).toFixed(1) : ""
                    updateFormData(["female_lab_life", "measurements", "weight_kg"], e.target.value)
                    updateFormData(["female_lab_life", "measurements", "bmi"], bmi)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Boy (cm)</Label>
                <Input
                  type="number"
                  value={formData.female_lab_life.measurements.height_cm}
                  onChange={(e) => {
                    const height = parseFloat(e.target.value) || 0
                    const weight = parseFloat(formData.female_lab_life.measurements.weight_kg) || 0
                    const bmi = height > 0 ? (weight / ((height / 100) ** 2)).toFixed(1) : ""
                    updateFormData(["female_lab_life", "measurements", "height_cm"], e.target.value)
                    updateFormData(["female_lab_life", "measurements", "bmi"], bmi)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>BMI (otomatik)</Label>
                <Input
                  type="text"
                  disabled
                  className="bg-gray-50"
                  value={formData.female_lab_life.measurements.bmi}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lab Uyarı Notları</Label>
            <Textarea
              rows={2}
              value={formData.female_lab_life.lab_warning_notes}
              onChange={(e) => updateFormData(["female_lab_life", "lab_warning_notes"], e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Önemli Notlar</Label>
            <Textarea
              rows={2}
              value={formData.female_lab_life.important_notes}
              onChange={(e) => updateFormData(["female_lab_life", "important_notes"], e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ERKEK ANAMNEZ */}
      <Card>
        <CardHeader>
          <CardTitle>Erkek Anamnez</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sistemik Hastalık</Label>
              <Select
                value={formData.male_anamnesis.systemic_disease}
                onValueChange={(value) => updateFormData(["male_anamnesis", "systemic_disease"], value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Yok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="var">Var</SelectItem>
                  <SelectItem value="yok">Yok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <YesNoField
              label="Kullanılan İlaç"
              value={formData.male_anamnesis.medication.has}
              noteValue={formData.male_anamnesis.medication.note}
              onValueChange={(value) => updateFormData(["male_anamnesis", "medication", "has"], value)}
              onNoteChange={(note) => updateFormData(["male_anamnesis", "medication", "note"], note)}
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3">Yaşam Tarzı</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sigara (Günlük Adet)</Label>
                <Input
                  type="number"
                  value={formData.male_anamnesis.smoking_daily}
                  onChange={(e) =>
                    updateFormData(["male_anamnesis", "smoking_daily"], parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Alkol</Label>
                <Select
                  value={formData.male_anamnesis.alcohol}
                  onValueChange={(value) => updateFormData(["male_anamnesis", "alcohol"], value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Yok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="var">Var</SelectItem>
                    <SelectItem value="yok">Yok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alerji</Label>
                <Select
                  value={formData.male_anamnesis.allergy}
                  onValueChange={(value) => updateFormData(["male_anamnesis", "allergy"], value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Yok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="var">Var</SelectItem>
                    <SelectItem value="yok">Yok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Geçirilmiş Operasyon</Label>
              <Select
                value={formData.male_anamnesis.past_surgery}
                onValueChange={(value) => updateFormData(["male_anamnesis", "past_surgery"], value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Yok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="var">Var</SelectItem>
                  <SelectItem value="yok">Yok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <BloodGroupSelect
              value={formData.male_anamnesis.blood_group}
              onValueChange={(value) => updateFormData(["male_anamnesis", "blood_group"], value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Karyotip</Label>
              <Input
                type="text"
                value={formData.male_anamnesis.karyotype}
                onChange={(e) => updateFormData(["male_anamnesis", "karyotype"], e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Y Kromozom Delesyonu</Label>
              <Input
                type="text"
                value={formData.male_anamnesis.y_chromosome_deletion}
                onChange={(e) => updateFormData(["male_anamnesis", "y_chromosome_deletion"], e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lab Uyarı Notları</Label>
            <Textarea
              rows={2}
              value={formData.male_anamnesis.lab_warning_notes}
              onChange={(e) => updateFormData(["male_anamnesis", "lab_warning_notes"], e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ART GEÇMİŞİ */}
      <Card>
        <CardHeader>
          <CardTitle>ART Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">IUI</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="iui"
                    checked={formData.art_history.iui?.has === "var"}
                    onChange={() => updateFormData(["art_history", "iui", "has"], "var")}
                  />
                  Var
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="iui"
                    checked={formData.art_history.iui?.has === "yok"}
                    onChange={() => updateFormData(["art_history", "iui", "has"], "yok")}
                  />
                  Yok
                </label>
              </div>
            </div>
            {formData.art_history.iui?.has === "var" && (
              <Textarea
                rows={3}
                placeholder="IUI detaylarını buraya yazınız..."
                value={formData.art_history.iui?.note || ""}
                onChange={(e) => updateFormData(["art_history", "iui", "note"], e.target.value)}
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">IVF</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="ivf"
                    checked={formData.art_history.ivf?.has === "var"}
                    onChange={() => updateFormData(["art_history", "ivf", "has"], "var")}
                  />
                  Var
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="ivf"
                    checked={formData.art_history.ivf?.has === "yok"}
                    onChange={() => updateFormData(["art_history", "ivf", "has"], "yok")}
                  />
                  Yok
                </label>
              </div>
            </div>
            {formData.art_history.ivf?.has === "var" && (
              <Textarea
                rows={3}
                placeholder="IVF detaylarını buraya yazınız..."
                value={formData.art_history.ivf?.note || ""}
                onChange={(e) => updateFormData(["art_history", "ivf", "note"], e.target.value)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* HSG */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>HSG</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newRow = { date: "", location: "", description: "" }
              updateFormData(["hsg"], [...formData.hsg, newRow])
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Satır Ekle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.hsg.map((row: any, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg relative">
                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={row.date || ""}
                    onChange={(e) => {
                      const updated = [...formData.hsg]
                      updated[index] = { ...updated[index], date: e.target.value }
                      updateFormData(["hsg"], updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yer</Label>
                  <Input
                    type="text"
                    placeholder="Yapılan yer"
                    value={row.location || ""}
                    onChange={(e) => {
                      const updated = [...formData.hsg]
                      updated[index] = { ...updated[index], location: e.target.value }
                      updateFormData(["hsg"], updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    type="text"
                    placeholder="Açıklama"
                    value={row.description || ""}
                    onChange={(e) => {
                      const updated = [...formData.hsg]
                      updated[index] = { ...updated[index], description: e.target.value }
                      updateFormData(["hsg"], updated)
                    }}
                  />
                </div>
                {formData.hsg.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      const updated = formData.hsg.filter((_: any, i: number) => i !== index)
                      updateFormData(["hsg"], updated)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KADIN TANI */}
      <Card>
        <CardHeader>
          <CardTitle>Kadın Tanı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              "Açıklanamayan",
              "Endometriozis",
              "Konjenital Uterin Anomali",
              "Oosit Cryo - İsteğe Bağlı",
              "PCO",
              "Tekrarlayan Gebelik Kaybı",
              "Yaş Faktörü",
              "Dış Doktor Hastası",
              "Hipo Hipo",
              "Myoma",
              "Oosit Cryo - Kemoterapi",
              "Poor Responder",
              "Tubal Faktörler",
              "Endometrial Faktörler",
              "Kadında Genetik Bozukluk",
              "Azalmış Over Rezervi",
              "Ovülatör Faktör",
              "Tek Gen Hastalığı",
              "Vajinismus",
            ].map((diagnosis) => {
              const key = diagnosis.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "")
              return (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`female_diagnosis_${key}`}
                    checked={formData.female_diagnosis[key] || false}
                    onCheckedChange={(checked) => updateFormData(["female_diagnosis", key], checked)}
                  />
                  <label htmlFor={`female_diagnosis_${key}`} className="text-sm cursor-pointer">
                    {diagnosis}
                  </label>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* SPERMİOGRAM */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Spermiogram</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newRow = {
                date: "",
                location: "",
                volume_ml: "",
                concentration: "",
                progressive_motility: "",
                morphology: "",
                tank_address: "",
                notes: "",
              }
              updateFormData(["spermiogram"], [...formData.spermiogram, newRow])
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Satır Ekle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.spermiogram.map((row: any, index: number) => (
              <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg relative">
                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={row.date || ""}
                    onChange={(e) => {
                      const updated = [...formData.spermiogram]
                      updated[index] = { ...updated[index], date: e.target.value }
                      updateFormData(["spermiogram"], updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yer</Label>
                  <Input
                    type="text"
                    value={row.location || ""}
                    onChange={(e) => {
                      const updated = [...formData.spermiogram]
                      updated[index] = { ...updated[index], location: e.target.value }
                      updateFormData(["spermiogram"], updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Volüm (ml)</Label>
                  <Input
                    type="text"
                    value={row.volume_ml || ""}
                    onChange={(e) => {
                      const updated = [...formData.spermiogram]
                      updated[index] = { ...updated[index], volume_ml: e.target.value }
                      updateFormData(["spermiogram"], updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konsantrasyon</Label>
                  <Input
                    type="text"
                    value={row.concentration || ""}
                    onChange={(e) => {
                      const updated = [...formData.spermiogram]
                      updated[index] = { ...updated[index], concentration: e.target.value }
                      updateFormData(["spermiogram"], updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prog. Motilite (%)</Label>
                  <Input
                    type="text"
                    value={row.progressive_motility || ""}
                    onChange={(e) => {
                      const updated = [...formData.spermiogram]
                      updated[index] = { ...updated[index], progressive_motility: e.target.value }
                      updateFormData(["spermiogram"], updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Morfoloji</Label>
                  <Input
                    type="text"
                    value={row.morphology || ""}
                    onChange={(e) => {
                      const updated = [...formData.spermiogram]
                      updated[index] = { ...updated[index], morphology: e.target.value }
                      updateFormData(["spermiogram"], updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tank Adresi</Label>
                  <Input
                    type="text"
                    value={row.tank_address || ""}
                    onChange={(e) => {
                      const updated = [...formData.spermiogram]
                      updated[index] = { ...updated[index], tank_address: e.target.value }
                      updateFormData(["spermiogram"], updated)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notlar</Label>
                  <Input
                    type="text"
                    value={row.notes || ""}
                    onChange={(e) => {
                      const updated = [...formData.spermiogram]
                      updated[index] = { ...updated[index], notes: e.target.value }
                      updateFormData(["spermiogram"], updated)
                    }}
                  />
                </div>
                {formData.spermiogram.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      const updated = formData.spermiogram.filter((_: any, i: number) => i !== index)
                      updateFormData(["spermiogram"], updated)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ERKEK TANI */}
      <Card>
        <CardHeader>
          <CardTitle>Erkek Tanı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              "Astenospermi",
              "Azospermi",
              "Cinsel İşlev Bozukluğu",
              "Erkekte Genetik Bozukluk",
              "Globozoospermi",
              "Hipo Hipo",
              "Oligospermi",
              "Oligoastenospermi",
              "Oligoastenotératozoospermi",
              "Oligoteratozoospermi",
              "Teratozoospermi",
              "Retrograd Ejekülasyon",
              "SSS",
              "Semen Cryo - İsteğe Bağlı",
              "Semen Cryo - Kemoterapi",
            ].map((diagnosis) => {
              const key = diagnosis.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "")
              return (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`male_diagnosis_${key}`}
                    checked={formData.male_diagnosis[key] || false}
                    onCheckedChange={(checked) => updateFormData(["male_diagnosis", key], checked)}
                  />
                  <label htmlFor={`male_diagnosis_${key}`} className="text-sm cursor-pointer">
                    {diagnosis}
                  </label>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* USG with Rich Text Editor */}
      <Card>
        <CardHeader>
          <CardTitle>USG</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            label="Açıklama"
            value={formData.usg.html}
            onChange={(html) => updateFormData(["usg", "html"], html)}
            placeholder="USG açıklamasını buraya yazınız..."
          />
        </CardContent>
      </Card>

      {/* STICKY SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            {saveStatus === "unsaved" && <span className="text-gray-600">Kaydedilmedi</span>}
            {saveStatus === "saving" && (
              <span className="text-blue-600 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-green-600 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Kaydedildi {lastSavedTime && `(${lastSavedTime})`}
              </span>
            )}
          </div>
          <Button
            size="lg"
            onClick={handleSaveForm}
            disabled={saving}
            className={`transition-all ${showSaveAnimation ? "scale-105 bg-green-600 hover:bg-green-700" : ""}`}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Formu Kaydet"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InfertilityEvaluationForm
