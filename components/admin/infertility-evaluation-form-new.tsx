"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface InfertilityEvaluationFormProps {
  patientId: string
  appointmentId?: string
}

export function InfertilityEvaluationForm({ patientId, appointmentId }: InfertilityEvaluationFormProps) {
  // Basic Info
  const [doctorName, setDoctorName] = useState("")
  const [evaluationDate, setEvaluationDate] = useState("")
  const [fileNumber, setFileNumber] = useState("")

  // Infertility Status
  const [infertilityType, setInfertilityType] = useState<string[]>([])
  const [infertilityDuration, setInfertilityDuration] = useState("")
  const [frozenEmbryos, setFrozenEmbryos] = useState(0)
  const [pgdEmbryos, setPgdEmbryos] = useState(0)
  const [frozenSperm, setFrozenSperm] = useState(0)

  // Kadın Anamnez - GPYAE
  const [gValue, setGValue] = useState(0)
  const [pValue, setPValue] = useState(0)
  const [yValue, setYValue] = useState(0)
  const [aValue, setAValue] = useState(0)
  const [eValue, setEValue] = useState(0)

  // Symptoms
  const [symptomStatus, setSymptomStatus] = useState<Record<string, string>>({})
  const [symptomDetails, setSymptomDetails] = useState<Record<string, string>>({})

  // Female Lab & Life
  const [femaleAnamnesis, setFemaleAnamnesis] = useState<any>({})

  // Male Anamnez
  const [maleAnamnesis, setMaleAnamnesis] = useState<any>({})

  // Diagnoses
  const [femaleDiagnoses, setFemaleDiagnoses] = useState<string[]>([])
  const [maleDiagnoses, setMaleDiagnoses] = useState<string[]>([])

  // ART History
  const [artHistoryStatus, setArtHistoryStatus] = useState<Record<string, string>>({})
  const [artHistoryDetails, setArtHistoryDetails] = useState<Record<string, string>>({})

  // HSG Records
  const [hsgRows, setHsgRows] = useState([{ id: 1, date: "", location: "", notes: "" }])

  // Spermiogram
  const [spermiogramRows, setSpermiogramRows] = useState([{ id: 1 }])
  const [spermiogramData, setSpermiogramData] = useState<any[]>([])

  // USG
  const [usgNotes, setUsgNotes] = useState("")

  const [saving, setSaving] = useState(false)
  const [evaluationId, setEvaluationId] = useState<string | null>(null)

  useEffect(() => {
    loadLatestEvaluation()
  }, [patientId])

  const loadLatestEvaluation = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { data, error } = await supabase
        .from("infertility_evaluations")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        console.log("[v0] Loaded evaluation:", data)
        setEvaluationId(data.id)
        setDoctorName(data.doctor_name || "")
        setEvaluationDate(data.evaluation_date || "")
        setFileNumber(data.file_number || "")
        setInfertilityType(data.infertility_type ? data.infertility_type.split(",") : [])
        setInfertilityDuration(data.infertilityuration?.toString() || "")
        setFrozenEmbryos(data.frozen_embryos || 0)
        setPgdEmbryos(data.pgd_embryos || 0)
        setFrozenSperm(data.frozen_sperm || 0)
        setGValue(data.g_value || 0)
        setPValue(data.p_value || 0)
        setYValue(data.y_value || 0)
        setAValue(data.a_value || 0)
        setEValue(data.e_value || 0)
        
        if (data.symptoms) {
          setSymptomStatus(data.symptoms.status || {})
          setSymptomDetails(data.symptoms.details || {})
        }
        
        if (data.art_history) {
          setArtHistoryStatus(data.art_history.status || {})
          setArtHistoryDetails(data.art_history.details || {})
        }
        
        if (data.hsg_records && Array.isArray(data.hsg_records)) {
          setHsgRows(data.hsg_records.length > 0 ? data.hsg_records : [{ id: 1, date: "", location: "", notes: "" }])
        }
        
        setFemaleAnamnesis(data.female_anamnesis || {})
        setMaleAnamnesis(data.male_anamnesis || {})
        setFemaleDiagnoses(data.diagnoses?.female || [])
        setMaleDiagnoses(data.diagnoses?.male || [])
        setUsgNotes(data.usg_notes || "")
      }
    } catch (error: any) {
      console.error("[v0] Load evaluation error:", error)
    }
  }

  const addHsgRow = () => {
    setHsgRows([...hsgRows, { id: Date.now(), date: "", location: "", notes: "" }])
  }

  const removeHsgRow = (id: number) => {
    setHsgRows(hsgRows.filter((row) => row.id !== id))
  }

  const updateHsgRow = (id: number, field: string, value: string) => {
    setHsgRows(hsgRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const handleSymptomChange = (symptom: string, value: string) => {
    setSymptomStatus({ ...symptomStatus, [symptom]: value })
    if (value === "yok") {
      const newDetails = { ...symptomDetails }
      delete newDetails[symptom]
      setSymptomDetails(newDetails)
    }
  }

  const handleArtHistoryChange = (item: string, value: string) => {
    setArtHistoryStatus({ ...artHistoryStatus, [item]: value })
    if (value === "yok") {
      const newDetails = { ...artHistoryDetails }
      delete newDetails[item]
      setArtHistoryDetails(newDetails)
    }
  }

  const handleInfertilityTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setInfertilityType([...infertilityType, type])
    } else {
      setInfertilityType(infertilityType.filter((t) => t !== type))
    }
  }

  const handleFemaleDiagnosisChange = (diagnosis: string, checked: boolean) => {
    if (checked) {
      setFemaleDiagnoses([...femaleDiagnoses, diagnosis])
    } else {
      setFemaleDiagnoses(femaleDiagnoses.filter((d) => d !== diagnosis))
    }
  }

  const handleMaleDiagnosisChange = (diagnosis: string, checked: boolean) => {
    if (checked) {
      setMaleDiagnoses([...maleDiagnoses, diagnosis])
    } else {
      setMaleDiagnoses(maleDiagnoses.filter((d) => d !== diagnosis))
    }
  }

  const handleSaveForm = async () => {
    try {
      setSaving(true)
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const evaluationData = {
        patient_id: patientId,
        appointment_id: appointmentId,
        doctor_name: doctorName,
        evaluation_date: evaluationDate,
        file_number: fileNumber,
        infertility_type: infertilityType.join(","),
        infertility_duration: infertilityDuration ? parseInt(infertilityDuration) : null,
        frozen_embryos: frozenEmbryos,
        pgd_embryos: pgdEmbryos,
        frozen_sperm: frozenSperm,
        g_value: gValue,
        p_value: pValue,
        y_value: yValue,
        a_value: aValue,
        e_value: eValue,
        symptoms: { status: symptomStatus, details: symptomDetails },
        art_history: { status: artHistoryStatus, details: artHistoryDetails },
        hsg_records: hsgRows,
        female_anamnesis: femaleAnamnesis,
        male_anamnesis: maleAnamnesis,
        diagnoses: { female: femaleDiagnoses, male: maleDiagnoses },
        usg_notes: usgNotes,
        updated_at: new Date().toISOString(),
      }

      let error
      if (evaluationId) {
        // Update existing
        const result = await supabase
          .from("infertility_evaluations")
          .update(evaluationData)
          .eq("id", evaluationId)
        error = result.error
      } else {
        // Insert new
        const result = await supabase.from("infertility_evaluations").insert({
          ...evaluationData,
          created_at: new Date().toISOString(),
        })
        error = result.error
      }

      if (error) throw error

      alert("Form başarıyla kaydedildi!")
      await loadLatestEvaluation()
    } catch (error: any) {
      console.error("[v0] Form save error:", error)
      alert("Form kaydedilirken hata oluştu: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* GENEL BİLGİLER */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Doktor</Label>
              <Input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dosya No</Label>
              <Input type="text" value={fileNumber} onChange={(e) => setFileNumber(e.target.value)} />
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
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="primer"
                checked={infertilityType.includes("Primer")}
                onCheckedChange={(checked) => handleInfertilityTypeChange("Primer", checked as boolean)}
              />
              <Label htmlFor="primer">Primer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sekonder"
                checked={infertilityType.includes("Sekonder")}
                onCheckedChange={(checked) => handleInfertilityTypeChange("Sekonder", checked as boolean)}
              />
              <Label htmlFor="sekonder">Sekonder</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>İnfertilite Süresi (Yıl)</Label>
              <Input
                type="number"
                value={infertilityDuration}
                onChange={(e) => setInfertilityDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Frozen Material Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Donmuş Embriyo (Straw/Vial)</Label>
                <Input type="number" value={frozenEmbryos} onChange={(e) => setFrozenEmbryos(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>PGD Embriyo</Label>
                <Input type="number" value={pgdEmbryos} onChange={(e) => setPgdEmbryos(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Donmuş Sperm (Vial)</Label>
                <Input type="number" value={frozenSperm} onChange={(e) => setFrozenSperm(Number(e.target.value))} />
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
          <div>
            <h4 className="font-semibold mb-3">G P Y A E</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>G</Label>
                <Input type="number" value={gValue} onChange={(e) => setGValue(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>P</Label>
                <Input type="number" value={pValue} onChange={(e) => setPValue(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Y</Label>
                <Input type="number" value={yValue} onChange={(e) => setYValue(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>A</Label>
                <Input type="number" value={aValue} onChange={(e) => setAValue(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>E</Label>
                <Input type="number" value={eValue} onChange={(e) => setEValue(Number(e.target.value))} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEMPTOMLAR */}
      <Card>
        <CardHeader>
          <CardTitle>Semptomlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["Dismenore", "Disparoni", "Hirsutismus", "Galaktore", "TBC", "Sistemik Hastalık", "Akraba Evliliği", "Geçirilmiş Operasyon"].map((symptom) => (
              <div key={symptom} className="space-y-2">
                <div className="flex items-center justify-between border p-3 rounded">
                  <Label>{symptom}</Label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={symptom}
                        value="var"
                        checked={symptomStatus[symptom] === "var"}
                        onChange={() => handleSymptomChange(symptom, "var")}
                      />
                      <span className="text-sm">Var</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={symptom}
                        value="yok"
                        checked={!symptomStatus[symptom] || symptomStatus[symptom] === "yok"}
                        onChange={() => handleSymptomChange(symptom, "yok")}
                      />
                      <span className="text-sm">Yok</span>
                    </label>
                  </div>
                </div>
                {symptomStatus[symptom] === "var" && (
                  <div className="ml-4">
                    <Input
                      type="text"
                      placeholder="Açıklama yazınız..."
                      value={symptomDetails[symptom] || ""}
                      onChange={(e) => setSymptomDetails({ ...symptomDetails, [symptom]: e.target.value })}
                    />
                  </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              "Açıklanamayan",
              "Dış Doktor Hastası",
              "Endometrial Faktörler",
              "Endometriozis",
              "Hipo Hipo",
              "Kadında Genetik Bozukluk",
              "Konjenital Uterin Anomali",
              "Myoma",
              "Azalmış Over Rezervi",
              "Oosit Cryo – İsteğe Bağlı",
              "Oosit Cryo – Kemoterapi",
              "Ovülatör Faktör",
              "PCO",
              "Poor Responder",
              "Tek Gen Hastalığı",
              "Tekrarlayan Gebelik Kaybı",
              "Tubal Faktörler",
              "Vajinismus",
              "Yaş Faktörü",
            ].map((diagnosis) => (
              <div key={diagnosis} className="flex items-center space-x-2">
                <Checkbox
                  id={`female_${diagnosis}`}
                  checked={femaleDiagnoses.includes(diagnosis)}
                  onCheckedChange={(checked) => handleFemaleDiagnosisChange(diagnosis, checked as boolean)}
                />
                <Label htmlFor={`female_${diagnosis}`}>{diagnosis}</Label>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              "Astenospermi",
              "Azospermi",
              "Cinsel İşlev Bozukluğu",
              "Erkekte Genetik Bozukluk",
              "Globozoospermi",
              "Hipo Hipo",
              "Oligospermi",
              "Oligoastenoteratozoospermi",
              "Oligoteratozoospermi",
              "Retrograd Ejeküla syon",
              "Semen Cryo – İsteğe Bağlı",
              "Semen Cryo – Kemoterapi",
              "SSS",
              "Teratozoospermi",
            ].map((diagnosis) => (
              <div key={diagnosis} className="flex items-center space-x-2">
                <Checkbox
                  id={`male_${diagnosis}`}
                  checked={maleDiagnoses.includes(diagnosis)}
                  onCheckedChange={(checked) => handleMaleDiagnosisChange(diagnosis, checked as boolean)}
                />
                <Label htmlFor={`male_${diagnosis}`}>{diagnosis}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ART GEÇMİŞİ */}
      <Card>
        <CardHeader>
          <CardTitle>ART Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["IUI", "IVF"].map((item) => (
              <div key={item} className="space-y-2">
                <div className="flex items-center justify-between border p-3 rounded">
                  <Label>{item}</Label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={`art_${item}`}
                        value="var"
                        checked={artHistoryStatus[item] === "var"}
                        onChange={() => handleArtHistoryChange(item, "var")}
                      />
                      <span className="text-sm">Var</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={`art_${item}`}
                        value="yok"
                        checked={!artHistoryStatus[item] || artHistoryStatus[item] === "yok"}
                        onChange={() => handleArtHistoryChange(item, "yok")}
                      />
                      <span className="text-sm">Yok</span>
                    </label>
                  </div>
                </div>
                {artHistoryStatus[item] === "var" && (
                  <div className="ml-4">
                    <Textarea
                      rows={2}
                      placeholder="Açıklama yazınız..."
                      value={artHistoryDetails[item] || ""}
                      onChange={(e) => setArtHistoryDetails({ ...artHistoryDetails, [item]: e.target.value })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HSG */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>HSG</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addHsgRow}>
            <Plus className="h-4 w-4 mr-2" />
            Satır Ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {hsgRows.map((row) => (
            <div key={row.id} className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateHsgRow(row.id, "date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yer</Label>
                  <Input
                    type="text"
                    placeholder="Yapılan yer"
                    value={row.location}
                    onChange={(e) => updateHsgRow(row.id, "location", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    type="text"
                    placeholder="Açıklama"
                    value={row.notes}
                    onChange={(e) => updateHsgRow(row.id, "notes", e.target.value)}
                  />
                </div>
              </div>
              {hsgRows.length > 1 && (
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeHsgRow(row.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Kaldır
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* USG */}
      <Card>
        <CardHeader>
          <CardTitle>USG</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              rows={4}
              placeholder="USG açıklamasını buraya yazınız..."
              value={usgNotes}
              onChange={(e) => setUsgNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* KAYDET BUTONU */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSaveForm} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Formu Kaydet"}
        </Button>
      </div>
    </div>
  )
}
