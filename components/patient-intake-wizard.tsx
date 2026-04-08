"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createPatientIntakeFlow } from "@/app/actions/patient-intake"

type PatientIntakeWizardProps = {
  isOpen: boolean
  onClose: () => void
  selectedSlot: {
    date: string
    time: string
    doctorId: string
  } | null
  doctorName: string
  appointmentType: string
  onSuccess: () => void
}

type Step = "sms_verification" | "appointment_summary" | "intake_form" | "document_upload" | "completed"

export default function PatientIntakeWizard({
  isOpen,
  onClose,
  selectedSlot,
  doctorName,
  appointmentType,
  onSuccess,
}: PatientIntakeWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("sms_verification")
  const [phone, setPhone] = useState("")
  const [smsCode, setSmsCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Patient data from backend
  const [patientId, setPatientId] = useState<string | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [needsIntakeForm, setNeedsIntakeForm] = useState(false)

  // Intake form data
  const [femaleData, setFemaleData] = useState({
    previousPregnancy: "",
    ivfAttempts: "",
    miscarriages: "",
    liveBirths: "",
    cesarean: "",
    normalBirth: "",
    lastMenstrualDate: "",
    menstrualCycle: "",
    chronicDiseases: "",
    previousSurgeries: "",
    medications: "",
    allergies: "",
    familyHistory: "",
  })

  const [maleData, setMaleData] = useState({
    spermAnalysis: "",
    spermAnalysisDate: "",
    varicocele: "",
    previousSurgeries: "",
    chronicDiseases: "",
    medications: "",
    smokingStatus: "",
    alcoholConsumption: "",
    occupation: "",
    familyHistory: "",
  })

  // Document upload
  const [documents, setDocuments] = useState<File[]>([])
  const [documentDescriptions, setDocumentDescriptions] = useState<Record<string, string>>({})

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentStep("sms_verification")
        setPhone("")
        setSmsCode("")
        setError(null)
        setPatientId(null)
        setAppointmentId(null)
        setNeedsIntakeForm(false)
        setFemaleData({
          previousPregnancy: "",
          ivfAttempts: "",
          miscarriages: "",
          liveBirths: "",
          cesarean: "",
          normalBirth: "",
          lastMenstrualDate: "",
          menstrualCycle: "",
          chronicDiseases: "",
          previousSurgeries: "",
          medications: "",
          allergies: "",
          familyHistory: "",
        })
        setMaleData({
          spermAnalysis: "",
          spermAnalysisDate: "",
          varicocele: "",
          previousSurgeries: "",
          chronicDiseases: "",
          medications: "",
          smokingStatus: "",
          alcoholConsumption: "",
          occupation: "",
          familyHistory: "",
        })
        setDocuments([])
        setDocumentDescriptions({})
      }, 300)
    }
  }, [isOpen])

  const handleSmsVerification = async () => {
    if (!smsCode || smsCode.length !== 6) {
      setError("Lütfen 6 haneli SMS kodunu girin")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createPatientIntakeFlow({
        action: "verify_sms",
        phone,
        smsCode,
        appointmentData: {
          doctor_id: selectedSlot!.doctorId,
          appointment_date: selectedSlot!.date,
          appointment_time: selectedSlot!.time,
          appointment_type: appointmentType,
        },
      })

      if (!result.success) {
        setError(result.error || "SMS doğrulama başarısız")
        return
      }

      // Set patient and appointment data
      setPatientId(result.data.patient_id)
      setAppointmentId(result.data.appointment_id)
      setNeedsIntakeForm(!result.data.has_completed_intake_form)

      // Move to next step
      setCurrentStep("appointment_summary")
    } catch (err: any) {
      console.error("[v0] SMS verification error:", err)
      setError("Doğrulama hatası oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleIntakeFormSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createPatientIntakeFlow({
        action: "save_intake_form",
        patientId: patientId!,
        intakeData: {
          female: femaleData,
          male: maleData,
        },
      })

      if (!result.success) {
        setError(result.error || "Form kaydedilemedi")
        return
      }

      setCurrentStep("document_upload")
    } catch (err: any) {
      console.error("[v0] Intake form error:", err)
      setError("Form kaydetme hatası")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDocumentUpload = async (skipUpload = false) => {
    if (skipUpload || documents.length === 0) {
      setCurrentStep("completed")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createPatientIntakeFlow({
        action: "upload_documents",
        patientId: patientId!,
        appointmentId: appointmentId!,
        documents: documents.map((file, idx) => ({
          file,
          description: documentDescriptions[idx] || "",
        })),
      })

      if (!result.success) {
        setError(result.error || "Belgeler yüklenemedi")
        return
      }

      setCurrentStep("completed")
    } catch (err: any) {
      console.error("[v0] Document upload error:", err)
      setError("Belge yükleme hatası")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files))
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case "sms_verification":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">SMS Doğrulama</h2>
              <p className="text-sm text-muted-foreground">Telefonunuza gelen 6 haneli kodu girin</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Telefon Numarası</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXXX"
                  maxLength={11}
                />
              </div>

              <div>
                <Label htmlFor="sms-code">SMS Kodu</Label>
                <Input
                  id="sms-code"
                  type="text"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  placeholder="6 haneli kod"
                  maxLength={6}
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

              <Button onClick={handleSmsVerification} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Doğrulanıyor..." : "Doğrula"}
              </Button>
            </div>
          </div>
        )

      case "appointment_summary":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Randevu Bilgileri</h2>
              <p className="text-sm text-muted-foreground">Randevu bilgilerinizi kontrol edin</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Randevu Tipi:</span>
                <span className="text-sm">{appointmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Tarih:</span>
                <span className="text-sm">{selectedSlot?.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Saat:</span>
                <span className="text-sm">{selectedSlot?.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Doktor:</span>
                <span className="text-sm">{doctorName}</span>
              </div>
            </div>

            <Button
              onClick={() => {
                if (needsIntakeForm) {
                  setCurrentStep("intake_form")
                } else {
                  setCurrentStep("document_upload")
                }
              }}
              className="w-full"
            >
              Devam
            </Button>
          </div>
        )

      case "intake_form":
        return (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div>
              <h2 className="text-xl font-semibold mb-2">Hasta Bilgilendirme Formu</h2>
              <p className="text-sm text-muted-foreground">Bu formu sadece bir kez doldurmanız yeterlidir</p>
            </div>

            {/* Female Patient Section */}
            <div className="space-y-4 border-l-4 border-pink-400 pl-4">
              <h3 className="font-semibold text-lg">Kadın Hasta Bilgileri</h3>

              <div>
                <Label>Daha önce hamile kaldınız mı?</Label>
                <RadioGroup
                  value={femaleData.previousPregnancy}
                  onValueChange={(val) => setFemaleData({ ...femaleData, previousPregnancy: val })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="preg-yes" />
                    <Label htmlFor="preg-yes" className="font-normal">
                      Evet
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="preg-no" />
                    <Label htmlFor="preg-no" className="font-normal">
                      Hayır
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="ivf-attempts">Kaç kez IVF (tüp bebek) denemesi yaptınız?</Label>
                <Input
                  id="ivf-attempts"
                  value={femaleData.ivfAttempts}
                  onChange={(e) => setFemaleData({ ...femaleData, ivfAttempts: e.target.value })}
                  placeholder="Örn: 2 kez"
                />
              </div>

              <div>
                <Label htmlFor="miscarriages">Düşük sayısı</Label>
                <Input
                  id="miscarriages"
                  type="number"
                  value={femaleData.miscarriages}
                  onChange={(e) => setFemaleData({ ...femaleData, miscarriages: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="live-births">Canlı doğum sayısı</Label>
                <Input
                  id="live-births"
                  type="number"
                  value={femaleData.liveBirths}
                  onChange={(e) => setFemaleData({ ...femaleData, liveBirths: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="last-menstrual">Son adet tarihi</Label>
                <Input
                  id="last-menstrual"
                  type="date"
                  value={femaleData.lastMenstrualDate}
                  onChange={(e) => setFemaleData({ ...femaleData, lastMenstrualDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="chronic-diseases-f">Kronik hastalıklar (varsa)</Label>
                <Textarea
                  id="chronic-diseases-f"
                  value={femaleData.chronicDiseases}
                  onChange={(e) => setFemaleData({ ...femaleData, chronicDiseases: e.target.value })}
                  placeholder="Diyabet, hipertansiyon vb."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="medications-f">Kullandığınız ilaçlar</Label>
                <Textarea
                  id="medications-f"
                  value={femaleData.medications}
                  onChange={(e) => setFemaleData({ ...femaleData, medications: e.target.value })}
                  placeholder="Düzenli kullandığınız ilaçları yazın"
                  rows={2}
                />
              </div>
            </div>

              {/* Male Patient Section - Only for IVF */}
              {appointmentType === "asilama-tup-bebek" && (
                <div className="space-y-4 border-l-4 border-blue-400 pl-4">
                  <h3 className="font-semibold text-lg">Erkek Hasta Bilgileri</h3>

              <div>
                <Label>Sperm analizi yaptırıldı mı?</Label>
                <RadioGroup
                  value={maleData.spermAnalysis}
                  onValueChange={(val) => setMaleData({ ...maleData, spermAnalysis: val })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="sperm-yes" />
                    <Label htmlFor="sperm-yes" className="font-normal">
                      Evet
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="sperm-no" />
                    <Label htmlFor="sperm-no" className="font-normal">
                      Hayır
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {maleData.spermAnalysis === "yes" && (
                <div>
                  <Label htmlFor="sperm-date">Analiz tarihi</Label>
                  <Input
                    id="sperm-date"
                    type="date"
                    value={maleData.spermAnalysisDate}
                    onChange={(e) => setMaleData({ ...maleData, spermAnalysisDate: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label>Varikosel tanısı var mı?</Label>
                <RadioGroup
                  value={maleData.varicocele}
                  onValueChange={(val) => setMaleData({ ...maleData, varicocele: val })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="varicocele-yes" />
                    <Label htmlFor="varicocele-yes" className="font-normal">
                      Evet
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="varicocele-no" />
                    <Label htmlFor="varicocele-no" className="font-normal">
                      Hayır
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="chronic-diseases-m">Kronik hastalıklar (varsa)</Label>
                <Textarea
                  id="chronic-diseases-m"
                  value={maleData.chronicDiseases}
                  onChange={(e) => setMaleData({ ...maleData, chronicDiseases: e.target.value })}
                  placeholder="Diyabet, hipertansiyon vb."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="smoking">Sigara kullanımı</Label>
                <Input
                  id="smoking"
                  value={maleData.smokingStatus}
                  onChange={(e) => setMaleData({ ...maleData, smokingStatus: e.target.value })}
                  placeholder="Örn: Günde 1 paket"
                />
              </div>

              <div>
                <Label htmlFor="alcohol">Alkol tüketimi</Label>
                <Input
                  id="alcohol"
                  value={maleData.alcoholConsumption}
                  onChange={(e) => setMaleData({ ...maleData, alcoholConsumption: e.target.value })}
                  placeholder="Örn: Haftada 1-2 kadeh"
                />
              </div>
                </div>
              )}

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

            <Button onClick={handleIntakeFormSubmit} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Kaydediliyor..." : "Devam"}
            </Button>
          </div>
        )

      case "document_upload":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Varsa Belgelerinizi Yükleyebilirsiniz</h2>
              <p className="text-sm text-muted-foreground">
                Elinizde mevcut olan tahlil, rapor veya sonuçları buradan yükleyebilirsiniz. Yüklemezseniz randevu günü
                yanınızda getirebilirsiniz.
              </p>
            </div>

            <div>
              <Label htmlFor="documents">Belgeler (PDF veya Resim)</Label>
              <Input
                id="documents"
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="bg-muted/30 p-2 rounded text-sm">
                      <div className="font-medium">{doc.name}</div>
                      <Input
                        placeholder="Açıklama (opsiyonel)"
                        value={documentDescriptions[idx] || ""}
                        onChange={(e) => setDocumentDescriptions({ ...documentDescriptions, [idx]: e.target.value })}
                        className="mt-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleDocumentUpload(true)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Atla
              </Button>
              <Button
                onClick={() => handleDocumentUpload(false)}
                disabled={isSubmitting || documents.length === 0}
                className="flex-1"
              >
                {isSubmitting ? "Yükleniyor..." : "Tamamla"}
              </Button>
            </div>
          </div>
        )

      case "completed":
        return (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Randevu Süreciniz Tamamlandı</h2>
              <p className="text-sm text-muted-foreground">
                Randevunuz başarıyla oluşturuldu. SMS ile bilgilendirme mesajı gönderilecektir.
              </p>
            </div>
            <Button
              onClick={() => {
                onSuccess()
                onClose()
              }}
              className="w-full"
            >
              Kapat
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Hasta Kayıt ve Randevu Süreci</DialogTitle>
        {renderStep()}
      </DialogContent>
    </Dialog>
  )
}
