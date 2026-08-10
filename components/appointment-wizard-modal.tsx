"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, MessageSquare, Check, FileText, User, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const KVKK_TEXT = `AYDINLATMA METNİ

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verilerinizin işlenmesi hakkında sizleri bilgilendirmek isteriz.

VERİ SORUMLUSU
Prof. Dr. Eray Çalışkan - Kadın Hastalıkları ve Doğum Uzmanı olarak kişisel verilerinizin veri sorumlusuyuz.

İŞLENEN KİŞİSEL VERİLERİNİZ
- TC Kimlik Numarası
- Ad Soyad
- Telefon Numarası
- Doğum Tarihi
- Randevu bilgileri (tarih, saat, randevu tipi)
- Tavsiye eden doktor bilgisi (opsiyonel)

İŞLEME AMAÇLARI
Kişisel verileriniz, sağlık hizmeti sunumu, randevu yönetimi, iletişim kurulması, yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.

İŞLEME HUKUKI DAYANAKLARI
- Açık rızanız (KVKK m.5/1)
- Sözleşmenin kurulması ve ifası (KVKK m.5/2-c)
- Hukuki yükümlülüklerin yerine getirilmesi (KVKK m.5/2-ç)
- Sağlık hizmeti sunumu (KVKK m.6/3)

AKTARIM
Kişisel verileriniz, yasal zorunluluklar saklı kalmak kaydıyla, üçüncü kişilerle paylaşılmayacaktır.

HAKLARINIZ
KVKK'nın 11. maddesi kapsamında:
- Kişisel verilerinizin işlenip işlenmediğini öğrenme
- İşlenmişse bilgi talep etme
- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
- Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme
- Eksik/yanlış işlenmişse düzeltilmesini isteme
- KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme
- Düzeltme, silme, yok edilme taleplerinin aktarıldığı üçüncü kişilere bildirilmesini isteme
- İşlenen verilerin münhasıran otomatik sistemler ile analiz edilmesi nedeniyle aleyhinize bir sonuç doğmasına itiraz etme
- Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme

haklarına sahipsiniz.

İLETİŞİM
Haklarınızı kullanmak için kliniğimizle iletişime geçebilirsiniz.`

type PatientSearchResult = {
  id: string
  full_name: string
  phone: string
  tc_no: string
  date_of_birth: string | null
}

type Props = {
  isOpen: boolean
  onClose: () => void
  selectedSlot: { date: string; time: string; doctorId: string } | null
  doctorName: string
  onSuccess: () => void
  preselectedType?: string
  prefilledName?: string
  fetalBebekSayisi?: string | null
  isAdmin?: boolean
  prefilledPatient?: {
    id?: string
    full_name: string
    phone: string
    tc_no: string
    date_of_birth?: string | null
  } | null
}

export default function AppointmentWizardModal({
  isOpen,
  onClose,
  selectedSlot,
  doctorName,
  onSuccess,
  preselectedType,
  prefilledName,
  fetalBebekSayisi = null,
  isAdmin = false,
  prefilledPatient = null,
}: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string | null>(preselectedType || null)
  const [kontrollTakipSubType, setKontrollTakipSubType] = useState<string | null>(null)
  const [localFetalBebekSayisi, setLocalFetalBebekSayisi] = useState<string | null>(fetalBebekSayisi)

  // Sync selectedType when preselectedType prop changes or modal opens
  useEffect(() => {
    if (isOpen && preselectedType) {
      setSelectedType(preselectedType)
    }
  }, [preselectedType, isOpen])
  const kontrollTakipRef = useRef<HTMLDivElement>(null)

  // Acil Randevu states
  const [showEmergencyFlow, setShowEmergencyFlow] = useState(false)
  const [emergencyStep, setEmergencyStep] = useState<"sekreter" | "hemsiresatır1" | "hemsiresatır2" | null>("sekreter")
  const emergencyRef = useRef<HTMLDivElement>(null)

  // Kontrol / Takip seçildiğinde otomatik scroll et
  useEffect(() => {
    if (selectedType === "kontrol-takip" && kontrollTakipRef.current) {
      setTimeout(() => {
        kontrollTakipRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
  }, [selectedType])

  // Acil Durum açıldığında otomatik scroll et
  useEffect(() => {
    if (showEmergencyFlow && emergencyRef.current) {
      setTimeout(() => {
        emergencyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
  }, [showEmergencyFlow])

  // Sync prefilledName when modal opens
  useEffect(() => {
    if (isOpen && prefilledName) {
      setFullName(prefilledName)
    }
  }, [prefilledName, isOpen])

  // Admin: kayıtlı hasta arama
  const [patientSearchQuery, setPatientSearchQuery] = useState("")
  const [patientSearchResults, setPatientSearchResults] = useState<PatientSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<PatientSearchResult | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchPatients = useCallback(async (q: string) => {
    if (q.length < 2) { setPatientSearchResults([]); return }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/admin/patients/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setPatientSearchResults(data.patients || [])
    } catch { setPatientSearchResults([]) }
    finally { setIsSearching(false) }
  }, [])

  const handlePatientSearchChange = (value: string) => {
    setPatientSearchQuery(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => searchPatients(value), 350)
  }

  const handleSelectExistingPatient = (patient: PatientSearchResult) => {
    setSelectedExistingPatient(patient)
    setTcNo(patient.tc_no || "")
    setFullName(patient.full_name || "")
    setPhone(patient.phone || "")
    setDateOfBirth(patient.date_of_birth?.split("T")[0] || "")
    setPatientSearchQuery("")
    setPatientSearchResults([])
  }

  const clearSelectedPatient = () => {
    setSelectedExistingPatient(null)
    setTcNo("")
    setFullName("")
    setPhone("")
    setDateOfBirth("")
  }

  // Step 2 form data
  const [tcNo, setTcNo] = useState("")
  const [isForeignCitizen, setIsForeignCitizen] = useState(false)
  const [fullName, setFullName] = useState(prefilledName || "")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [referralDoctor, setReferralDoctor] = useState("")

  // Step 5 KVKK
  const [kvkkScrolled, setKvkkScrolled] = useState(false)
  const [kvkkApproved, setKvkkApproved] = useState(false)
  const [nonFetalConfirmed, setNonFetalConfirmed] = useState(false)
  const kvkkScrollRef = useRef<HTMLDivElement>(null)

  // Step 7 Medical Documents
  const [medicalDocuments, setMedicalDocuments] = useState({
    hormonTests: false,
    uterineFilm: false,
    spermAnalysis: false,
    geneticTests: false,
    previousTreatments: false,
    surgeryNotes: false,
  })

  // Step 4 Patient History
  const [femaleHistory, setFemaleHistory] = useState({
    previousPregnancy: "",
    ivfAttempt: "",
    miscarriage: "",
    chronicDisease: "",
    medications: "",
    smoking: "",
    alcohol: "",
  })

  const [maleHistory, setMaleHistory] = useState({
    spermTest: "",
    varicocele: "",
    chronicDisease: "",
    smoking: "",
    alcohol: "",
  })

  const [smsCode, setSmsCode] = useState("")
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  // Reset wizard when closing
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentStep(1)
        setSelectedType(preselectedType || null)
        setTcNo(prefilledPatient?.tc_no || "")
        setIsForeignCitizen(false)
        setFullName(prefilledPatient?.full_name || prefilledName || "")
        setPhone(prefilledPatient?.phone || "")
        setDateOfBirth(prefilledPatient?.date_of_birth?.split("T")[0] || "")
        setReferralDoctor("")
        setKvkkScrolled(false)
        setKvkkApproved(false)
        setMedicalDocuments({
          hormonTests: false,
          uterineFilm: false,
          spermAnalysis: false,
          geneticTests: false,
          previousTreatments: false,
          surgeryNotes: false,
        })
        setFemaleHistory({
          previousPregnancy: "",
          ivfAttempt: "",
          miscarriage: "",
          chronicDisease: "",
          medications: "",
          smoking: "",
          alcohol: "",
        })
        setMaleHistory({
          spermTest: "",
          varicocele: "",
          chronicDisease: "",
          smoking: "",
          alcohol: "",
        })
        setError(null)
        setSmsCode("")
        setAppointmentId(null)
        setVerificationError(null)
        setPatientSearchQuery("")
        setPatientSearchResults([])
        setSelectedExistingPatient(prefilledPatient
          ? { id: prefilledPatient.id || "", full_name: prefilledPatient.full_name, phone: prefilledPatient.phone, tc_no: prefilledPatient.tc_no, date_of_birth: prefilledPatient.date_of_birth || null }
          : null
        )
      }, 300)
    }
  }, [isOpen])

  // KVKK scroll detection
  const handleKvkkScroll = () => {
    if (kvkkScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = kvkkScrollRef.current
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setKvkkScrolled(true)
      }
    }
  }

  const goToStep = (step: number) => {
    // Kontrol/Takip tipi için Step 3 ve 4'ü atla
    if (selectedType === "kontrol-takip") {
      if (step === 3 || step === 4) {
        setCurrentStep(2)
        return
      }
    }
    // Clear errors when navigating between steps
    if (step !== currentStep) {
      setError(null)
    }
    setCurrentStep(step)
  }

  const handleStep1Next = () => {
    if (!selectedType) {
      setError("Lütfen bir randevu tipi seçin")
      return
    }
    
    // Acil Randevu seçilirse özel flow başlat
    if (selectedType === "acil-durum") {
      setShowEmergencyFlow(true)
      setEmergencyStep("sekreter")
      return
    }
    
    if (selectedType === "kontrol-takip" && !kontrollTakipSubType) {
      setError("Lütfen kontrol türünü seçin")
      return
    }
    goToStep(2)
  }

  const validateTcNo = (tc: string): boolean => {
    if (tc.length !== 11) return false
    if (!/^\d+$/.test(tc)) return false
    if (tc[0] === "0") return false

    const digits = tc.split("").map(Number)
    const sum10 = digits.slice(0, 10).reduce((a, b) => a + b, 0)
    if (sum10 % 10 !== digits[10]) return false

    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7]
    if ((oddSum * 7 - evenSum) % 10 !== digits[9]) return false

    return true
  }

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "")
    return cleaned.length === 11 && cleaned.startsWith("0")
  }

  const handleStep2Next = async () => {
    if (!tcNo || !fullName || !phone || !dateOfBirth) {
      setError("Lütfen tüm zorunlu alanları doldurun")
      return
    }
    
    if (!isForeignCitizen && !validateTcNo(tcNo)) {
      setError("Geçerli bir TC Kimlik No giriniz")
      return
    }

    if (isForeignCitizen && tcNo.length < 3) {
      setError("Geçerli bir Pasaport No giriniz")
      return
    }

    if (!validatePhone(phone)) {
      setError("Geçerli bir telefon numarası giriniz (05XX XXX XX XX)")
      return
    }

    // Admin ise KVKK ve bilgi formu adımlarını atla, direkt randevu oluştur
    if (isAdmin) {
      await handleAdminDirectSubmit()
      return
    }

    // Kontrol / Takip için direkt KVKK adımına git
    if (selectedType === "kontrol-takip") {
      goToStep(5)
    } else {
      goToStep(3)
    }
  }

  // Step 3 (SMS uyarı) -> Step 4 (Hasta bilgi formu)'na git
  const handleStep3Next = () => {
    goToStep(4)
  }

  const handleStep4Next = () => {
    goToStep(4)
  }

  const handleStep5Next = async () => {
    if (!kvkkApproved) {
      setError("Devam etmek için KVKK aydınlatma metnini onaylamanız gerekmektedir")
      return
    }

    if (isSubmitting) {
      return
    }

    // KVKK onaylandıktan sonra randevu oluştur ve SMS gönder
    await handleFinalSubmit()
  }

  // Admin direkt randevu oluşturma - KVKK ve bilgi formu olmadan
  const handleAdminDirectSubmit = async () => {
    if (!selectedSlot) {
      setError("Randevu bilgisi bulunamadı")
      return
    }
    setIsSubmitting(true)
    setError(null)
    const effectiveType = selectedType || "ilk-randevu"
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedSlot.doctorId,
          appointment_date: selectedSlot.date,
          appointment_time: selectedSlot.time,
          appointment_type: effectiveType,
          kontrol_takip_subtype: effectiveType === "kontrol-takip" ? kontrollTakipSubType : null,
          fetal_bebek_sayisi: effectiveType === "ayrintili-fetal-ultrason" ? localFetalBebekSayisi : null,
          patient_tc_no: tcNo,
          patient_name: fullName,
          patient_phone: phone,
          patient_dob: dateOfBirth,
          referral_doctor: referralDoctor || null,
          female_history: null,
          male_history: null,
          kvkk_approved: true, // Admin adına oluşturuluyor
          medical_documents: {},
          created_by_admin: true,
        }),
      })

      if (!response.ok) {
        let errorData
        try { errorData = await response.json() } catch { throw new Error("Randevu oluşturulurken bir hata oluştu") }
        if (errorData.error === "duplicate_appointment" && errorData.existing_appointment) {
          setError(`Bu hasta ${errorData.existing_appointment.date} tarihinde zaten randevusu var.`)
        } else {
          setError(errorData.error || "Randevu oluşturulurken bir hata oluştu")
        }
        setIsSubmitting(false)
        return
      }

      const data = await response.json()
      setAppointmentId(data.appointmentId)
      if (data.devCode) setDevCode(data.devCode)

      // Admin için: SMS doğrulama adımına git (hasta kendi onaylasın)
      goToStep(6)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (!selectedSlot) {
      setError("Randevu bilgisi bulunamadı")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedSlot.doctorId,
          appointment_date: selectedSlot.date,
          appointment_time: selectedSlot.time,
          appointment_type: selectedType,
          kontrol_takip_subtype: selectedType === "kontrol-takip" ? kontrollTakipSubType : null,
          fetal_bebek_sayisi: selectedType === "ayrintili-fetal-ultrason" ? localFetalBebekSayisi : null,
          patient_tc_no: tcNo,
          patient_name: fullName,
          patient_phone: phone,
          patient_dob: dateOfBirth,
          referral_doctor: referralDoctor || null,
          female_history:
            selectedType === "asilama-tup-bebek" ||
            selectedType === "gebelik-infertilite" ||
            selectedType === "jinekolojik-muayene"
              ? femaleHistory
              : null,
          male_history:
            selectedType === "asilama-tup-bebek" || selectedType === "gebelik-infertilite" ? maleHistory : null,
          kvkk_approved: kvkkApproved,
          medical_documents: medicalDocuments,
        }),
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error("[v0] Failed to parse error response:", parseError)
          throw new Error("Randevu oluşturulurken bir hata oluştu")
        }

        // Handle duplicate appointment with friendly message
        if (errorData.error === "duplicate_appointment" && errorData.existing_appointment) {
          setError(
            `Zaten ${errorData.existing_appointment.date} tarihinde randevunuz var.\n\nAcil durum için lütfen aşağıdaki kişilerden iletişime geçin:\n\nSekreter: Armagan Ayverdi - aa@dreraycaliskan.com\nHemşire: Büsra Sever - bs@dreraycaliskan.com`
          )
        } else {
          setError(errorData.error || "Randevu oluşturulurken bir hata oluştu")
        }
        setIsSubmitting(false)
        return
      }

      const data = await response.json()

      setAppointmentId(data.appointmentId)
      if (data.devCode) {
        setDevCode(data.devCode)
      }
      
      // Go to SMS verification (Step 6)
      goToStep(6)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!smsCode || !appointmentId) {
      setVerificationError("Lütfen doğrulama kodunu girin")
      return
    }

    setIsVerifying(true)
    setVerificationError(null)

    try {
      const response = await fetch("/api/appointments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          code: smsCode,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Sunucu hatası: Geçersiz yanıt formatı")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Kod doğrulanamadı")
      }
  
      goToStep(7)
    } catch (err: unknown) {
      setVerificationError(err instanceof Error ? err.message : "Doğrulama başarısız")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCompleteWizard = () => {
    onSuccess()
    onClose()
  }

  const appointmentPrices: Record<string, number> = {
    "Aşılama / Tüp Bebek": 4500,
    "asilama-tup-bebek": 4500, // URL-friendly slug ekledim
    "Ayrıntılı (2. Düzey) Fetal Ultrason": 3200,
    "ayrintili-fetal-ultrason": 3200,
    "Gebelik Takibi": 2800,
    "gebelik-takibi": 2800,
    "Gebelik İstemi / İnfertilite": 3500,
    "gebelik-istemi-infertilite": 3500,
    "Jinekolojik Muayene (Kadın Hastalıkları)": 2500,
    "jinekolojik-muayene": 2500,
    "Kontrol / Takip": 2000,
    "kontrol-takip": 2000,
    "Acil Durum Randevusu": 3000,
    "acil-durum": 3000,
  }

  const getCurrentPrice = () => {
    console.log("[v0] Selected type for price:", selectedType)
    const price = appointmentPrices[selectedType as keyof typeof appointmentPrices] || 4500 // default'u 4500 yaptım
    console.log("[v0] Calculated price:", price)
    return price
  }

  const getDiscountedPrice = () => {
    const price = getCurrentPrice()
    return Math.round(price * 0.9) // %10 indirim
  }

  // This function is called after completing the patient history form (step 4)
  // and before proceeding to the KVKK step (step 5).
  const onSuccessComplete = () => {
    goToStep(8) // Go to the success screen
    onSuccess() // Call the parent component's success handler
  }

  if (!selectedSlot) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Randevu Oluştur</DialogTitle>
          <DialogDescription className="sr-only">Randevu bilgilerinizi girin ve onaylayın</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* NORMAL RANDEVU FLOW */}
          {!showEmergencyFlow && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
              <div className="font-medium">Doktor:</div>
              <div>{doctorName}</div>
            </div>
          )}
          {!showEmergencyFlow && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm mt-1">
              <div className="font-medium">Tarih:</div>
              <div className="text-xs sm:text-sm">
                {new Date(selectedSlot.date).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  weekday: "long",
                })}
              </div>
            </div>
          )}
          {!showEmergencyFlow && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm mt-1">
              <div className="font-medium">Saat:</div>
              <div>{selectedSlot.time}</div>
            </div>
          )}

            {/* Progress indicator */}
          {currentStep <= 8 && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    step === currentStep ? "bg-primary" : step < currentStep ? "bg-primary/50" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Step 1: Kişisel Bilgiler */}
          {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {isAdmin ? "Hasta Bilgileri" : "Kişisel Bilgileriniz"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                {isAdmin ? "Kayıtlı hastayı arayın veya bilgileri manuel girin" : "Lütfen bilgilerinizi eksiksiz doldurun"}
              </p>
            </div>

            {/* ADMIN: Kayıtlı hasta arama */}
            {isAdmin && (
              <div className="space-y-2">
                {selectedExistingPatient ? (
                  <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-green-800">{selectedExistingPatient.full_name}</p>
                      <p className="text-xs text-green-600">{selectedExistingPatient.phone} &bull; {selectedExistingPatient.tc_no}</p>
                    </div>
                    <button onClick={clearSelectedPatient} className="text-green-600 hover:text-green-800 ml-2">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Label className="text-sm mb-1 block">Kayıtlı Hasta Ara</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="TC kimlik, isim veya telefon ile ara..."
                        value={patientSearchQuery}
                        onChange={(e) => handlePatientSearchChange(e.target.value)}
                        className="pl-9 min-h-[44px]"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    {patientSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {patientSearchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectExistingPatient(p)}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b last:border-0 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900">{p.full_name}</p>
                            <p className="text-xs text-gray-500">{p.phone} &bull; TC: {p.tc_no}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {patientSearchQuery.length >= 2 && !isSearching && patientSearchResults.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1 px-1">Kayıtlı hasta bulunamadı. Aşağıdan manuel girin.</p>
                    )}
                  </div>
                )}
                <div className="relative flex items-center gap-2 my-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-muted-foreground bg-white px-2">veya manuel girin</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tc-no" className="text-sm">
                    {isForeignCitizen ? "Pasaport No" : "TC Kimlik No"} <span className="text-destructive">*</span>
                  </Label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isForeignCitizen}
                      onChange={(e) => {
                        setIsForeignCitizen(e.target.checked)
                        setTcNo("")
                      }}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <span className="text-xs text-muted-foreground">Yabanci Vatandas</span>
                  </label>
                </div>
                <Input
                  id="tc-no"
                  type="text"
                  placeholder={isForeignCitizen ? "Pasaport numaraniz" : "12345678901"}
                  value={tcNo}
                  onChange={(e) => {
                    if (isForeignCitizen) {
                      setTcNo(e.target.value.slice(0, 20))
                    } else {
                      setTcNo(e.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                  }}
                  maxLength={isForeignCitizen ? 20 : 11}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name" className="text-sm">
                  Ad Soyad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">
                  Telefon Numarası <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  maxLength={11}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob" className="text-sm">
                  Doğum Tarihi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral" className="text-sm">
                  Sizi Tavsiye Eden Doktor (Opsiyonel)
                </Label>
                <Input
                  id="referral"
                  type="text"
                  placeholder="Doktor adı"
                  value={referralDoctor}
                  onChange={(e) => setReferralDoctor(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">{error}</div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1 bg-transparent min-h-[44px]"
                onClick={() => goToStep(1)}
              >
                Geri
              </Button>
              <Button type="button" className="w-full sm:flex-1 min-h-[44px]" onClick={handleStep2Next} disabled={isSubmitting}>
                {isAdmin ? (isSubmitting ? "Randevu Olu��turuluyor..." : "Randevu Oluştur") : "İleri"}
              </Button>
            </div>
          </div>
          )}

          {/* Step 3: SMS Uyarı Ekranı - Kontrol/Takip için görünmez */}
          {currentStep === 2 && selectedType !== "kontrol-takip" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="relative rounded-lg border-2 border-primary/20 bg-primary/5 p-6 sm:p-8 animate-pulse">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 animate-[pulse_2s_ease-in-out_infinite]" />
              <div className="relative flex flex-col items-center gap-4 sm:gap-6 text-center">
                <div className="relative">
                  <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-primary animate-bounce" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-destructive animate-ping" />
                </div>
                <div className="space-y-2 sm:space-y-3 max-w-md px-2 sm:px-0">
                  <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
                    Lütfen telefonunuza gelecek olan SMS mesajlarını dikkatlice okuyunuz.
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Eğer size soru yöneltilirse, ilgili soruları cevaplayınız.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1 bg-transparent min-h-[44px]"
                onClick={() => goToStep(2)}
              >
                Geri
              </Button>
              <Button type="button" className="w-full sm:flex-1 min-h-[44px]" onClick={handleStep3Next}>
                İleri
              </Button>
            </div>
          </div>
          )}

          {/* Step 4: Hasta Bilgi Formu - Kontrol/Takip için görünmez */}
          {currentStep === 3 && selectedType !== "kontrol-takip" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold px-2">Hasta Bilgi Formu</h3>
              <p className="text-xs sm:text-sm text-muted-foreground px-4">
                Lütfen tıbbi geçmişiniz hakkında bilgi verin
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Female Patient History */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Kadın Hasta Bilgileri
                </h4>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Daha önce gebelik oldu mu?</label>
                    <textarea
                      value={femaleHistory.previousPregnancy}
                      onChange={(e) => setFemaleHistory({ ...femaleHistory, previousPregnancy: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Evet/Hayır, kaç gebelik, sonuçları..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Tüp bebek denemesi var mı?</label>
                    <textarea
                      value={femaleHistory.ivfAttempt}
                      onChange={(e) => setFemaleHistory({ ...femaleHistory, ivfAttempt: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Kaç deneme, hangi merkezde, sonuçlar..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Düşük öyküsü var mı?</label>
                    <textarea
                      value={femaleHistory.miscarriage}
                      onChange={(e) => setFemaleHistory({ ...femaleHistory, miscarriage: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Kaç kez, hangi haftada..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Kronik hastalıklarınız var mı?</label>
                    <textarea
                      value={femaleHistory.chronicDisease}
                      onChange={(e) => setFemaleHistory({ ...femaleHistory, chronicDisease: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Tansiyon, şeker, tiroid vb..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Kullandığınız ilaçlar var mı?</label>
                    <textarea
                      value={femaleHistory.medications}
                      onChange={(e) => setFemaleHistory({ ...femaleHistory, medications: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="İlaç adları ve dozları..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Sigara kullanımı?</label>
                    <textarea
                      value={femaleHistory.smoking}
                      onChange={(e) => setFemaleHistory({ ...femaleHistory, smoking: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Günde kaç adet, kaç yıldır..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Alkol kullanımı?</label>
                    <textarea
                      value={femaleHistory.alcohol}
                      onChange={(e) => setFemaleHistory({ ...femaleHistory, alcohol: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Sıklık ve miktar..."
                    />
                  </div>
                </div>
              </div>

              {/* Male Patient History - Only for IVF */}
              {selectedType === "asilama-tup-bebek" && (
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Erkek Hasta Bilgileri
                  </h4>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Sperm testi yapıldı mı?</label>
                    <textarea
                      value={maleHistory.spermTest}
                      onChange={(e) => setMaleHistory({ ...maleHistory, spermTest: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Evet/Hayır, sonuçlar normal/düşük..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Varikosel öyküsü var mı?</label>
                    <textarea
                      value={maleHistory.varicocele}
                      onChange={(e) => setMaleHistory({ ...maleHistory, varicocele: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Ameliyat oldu mu, tedavi aldı mı..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Kronik hastalıklar var mı?</label>
                    <textarea
                      value={maleHistory.chronicDisease}
                      onChange={(e) => setMaleHistory({ ...maleHistory, chronicDisease: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Tansiyon, şeker, tiroid vb..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Sigara kullanımı?</label>
                    <textarea
                      value={maleHistory.smoking}
                      onChange={(e) => setMaleHistory({ ...maleHistory, smoking: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Günde kaç adet, kaç yıldır..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium">Alkol kullanımı?</label>
                    <textarea
                      value={maleHistory.alcohol}
                      onChange={(e) => setMaleHistory({ ...maleHistory, alcohol: e.target.value })}
                      className="w-full min-h-[60px] px-3 py-2 rounded-lg border bg-background text-sm"
                      placeholder="Sıklık ve miktar..."
                    />
                  </div>
                </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => goToStep(3)} className="w-full sm:flex-1 min-h-[44px]">
                Geri
              </Button>
              <Button onClick={handleStep4Next} className="w-full sm:flex-1 min-h-[44px]">
                İleri
              </Button>
            </div>
          </div>
          )}

          {/* Step 5: KVKK Onay (moved from step 4) */}
          {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">KVKK Aydınlatma ve Onay</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Lütfen aydınlatma metnini okuyun ve onaylayın
              </p>
            </div>

            <div
              ref={kvkkScrollRef}
              onScroll={handleKvkkScroll}
              className="h-48 sm:h-64 overflow-y-auto rounded-lg border p-3 sm:p-4 bg-muted/30 text-xs sm:text-sm space-y-3"
            >
              {KVKK_TEXT.split("\n\n").map((paragraph, idx) => (
                <p key={idx} className="text-xs leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {!kvkkScrolled && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs">Onay vermek için metni en aşağı kadar kaydırın</span>
              </p>
            )}

            <div className="flex items-start space-x-3 rounded-lg border p-3 sm:p-4 min-h-[48px]">
              <Checkbox
                id="kvkk-final"
                checked={kvkkApproved}
                onCheckedChange={(checked) => setKvkkApproved(checked === true)}
                disabled={!kvkkScrolled}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="kvkk-final"
                  className={`text-xs sm:text-sm font-medium leading-none ${!kvkkScrolled ? "opacity-50" : "cursor-pointer"}`}
                >
                  KVKK kapsamında bilgilendirildim ve kişisel verilerimin işlenmesini onaylıyorum *
                </Label>
                <p className="text-xs text-muted-foreground">
                  Randevu bilgilerimin kayıt altına alınmasını ve telefon numarama SMS gönderilmesini onaylıyorum.
                </p>
              </div>
            </div>

            {/* Ayrintili Fetal Ultrason DEGIL ise ek onay */}
            {selectedType !== "ayrintili-fetal-ultrason" && (
              <div className="flex items-start space-x-3 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/20 p-3 sm:p-4 min-h-[48px]">
                <Checkbox
                  id="non-fetal-confirm"
                  checked={nonFetalConfirmed}
                  onCheckedChange={(checked) => setNonFetalConfirmed(checked === true)}
                  disabled={!kvkkScrolled}
                  className="mt-1 border-red-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="non-fetal-confirm"
                    className={`text-sm sm:text-base font-bold leading-tight text-red-700 dark:text-red-400 uppercase ${!kvkkScrolled ? "opacity-50" : "cursor-pointer"}`}
                  >
                    AYRINTILI 2. DUZEY FETAL ULTRASON RANDEVUSU ALMADIGIMI OKUDUM ANLADIM ONAYLIYORUM *
                  </Label>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">{error}</div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1 bg-transparent min-h-[44px]"
                onClick={() => goToStep(3)}
                disabled={isSubmitting}
              >
                Geri
              </Button>
              <Button
                type="button"
                className="w-full sm:flex-1 min-h-[44px]"
                onClick={() => {
                  if (!kvkkApproved) {
                    setError("Devam etmek için KVKK aydınlatma metnini onaylamanız gerekmektedir")
                    return
                  }
                  // Fetal ultrason degilse ek onay gerekli
                  if (selectedType !== "ayrintili-fetal-ultrason" && !nonFetalConfirmed) {
                    setError("Devam etmek için Ayrıntılı Fetal Ultrason randevusu almadığınızı onaylamanız gerekmektedir")
                    return
                  }
                  setError(null) // Clear any previous errors
                  goToStep(5)
                }}
              >
                İleri
              </Button>
            </div>
          </div>
          )}

          {/* Step 5: SMS Uyarısı */}
          {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Randevu Oluştur</h3>
                <p className="text-muted-foreground">
                  Randevunuzu oluşturmak için bir adım kaldı
                </p>
              </div>
            </div>

            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Lütfen telefonunuza gelecek olan SMS mesajlarını dikkatle okuyunuz
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Eger size son yöntemde bile bir doğrulama kodu gönderilir. Bu kodu bir sonraki adımda girmeniz gerekecek.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">{error}</div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1 bg-transparent min-h-[44px]"
                onClick={() => goToStep(4)}
                disabled={isSubmitting}
              >
                Geri
              </Button>
              <Button
                type="button"
                className="w-full sm:flex-1 min-h-[44px]"
                onClick={handleStep5Next}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Randevu Oluşturuluyor..." : "İleri"}
              </Button>
            </div>
          </div>
          )}

          {/* Step 6: SMS Doğrulama */}
          {currentStep === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">SMS Doğrulama</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                {isAdmin
                  ? "Hastanın telefonuna doğrulama kodu gönderildi. Hasta kodu size iletebilir ya da kendi telefonundan girebilir."
                  : "Telefon numaranıza gönderilen 6 haneli doğrulama kodunu girin"}
              </p>
            </div>

            {isAdmin ? (
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-900">Randevu Oluşturuldu</p>
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>{phone}</strong> numarasına 6 haneli bir doğrulama kodu gönderildi.
                  Hastadan kodu alarak aşağıya girin veya hastanın kendi telefonundan girmesini bekleyin.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-3 sm:p-4">
                <p className="text-xs sm:text-sm">
                  <strong>{phone}</strong> numarasına bir doğrulama kodu gönderdik.
                </p>
              </div>
            )}

            {devCode && (
              <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-900">Development Mode / SMS Gönderilemedi</p>
                <p className="text-xs text-amber-800">SMS servisi şu anda çalışmıyor. Test için kod:</p>
                <p className="text-2xl font-bold text-center text-amber-900 tracking-widest">{devCode}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sms-code" className="text-sm">
                Doğrulama Kodu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sms-code"
                type="text"
                placeholder="6 haneli kod"
                maxLength={6}
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                className="min-h-[44px] text-center text-lg sm:text-xl tracking-widest"
              />
            </div>

            {verificationError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs sm:text-sm text-destructive">
                {verificationError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              {!isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1 bg-transparent min-h-[44px]"
                  onClick={() => goToStep(5)}
                  disabled={isVerifying}
                >
                  Geri
                </Button>
              )}
              <Button
                type="button"
                className="w-full sm:flex-1 min-h-[44px]"
                onClick={handleVerifyCode}
                disabled={smsCode.length !== 6 || isVerifying}
              >
                {isVerifying ? "Doğrulanıyor..." : "Doğrula ve Tamamla"}
              </Button>
            </div>
          </div>
          )}

          {/* Step 7: Tıbbi Evrak Kontrolü */}
          {currentStep === 7 && (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold px-2">Getirmeniz Gereken Evraklar</h3>
              <p className="text-xs sm:text-sm text-muted-foreground px-4">
                Lütfen varsa yanınızda aşağıdaki tetkikleri getirmeyi unutmayınız
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {selectedType === "gebelik-takibi" || selectedType === "gebelik-istemi-infertilite" || selectedType === "ayrintili-fetal-ultrason" ? (
                <>
                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Gebelikte yaptırdığınız kan idrar tahlilleri</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Gebelikte yaptırdığınız ultrasonlar</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">İkili / üçlü / dörtlü testler</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Fetal DNA analizleri</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      5
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Aldığınız ilaçların isimleri veya fotoğrafları</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      6
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Kan grubunuzun bilgisi</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      7
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Bilinen hastalıklarınızın epikrizleri / bilgi notları</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      8
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Olumsuz sonuçlanan gebelikleriniz varsa tahlil ve tedavi bilgileri</div>
                    </div>
                  </div>
                </>
              ) : selectedType === "jinekolojik-muayene" ? (
                <>
                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Smear Testi Sonuçları</div>
                      <p className="text-xs text-muted-foreground mt-1">Son 1 yıl içinde yapılmış smear test sonuçları</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">HPV Test Sonuçları</div>
                      <p className="text-xs text-muted-foreground mt-1">Varsa HPV (Human Papillomavirus) test sonuçları</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Ultrason Görüntüleri</div>
                      <p className="text-xs text-muted-foreground mt-1">Jinekolojik ultrason raporları (varsa)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Kan Tahlilleri</div>
                      <p className="text-xs text-muted-foreground mt-1">Hormon testleri, hemogram gibi kan tahlilleri</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      5
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Geçmiş Ameliyat Raporları</div>
                      <p className="text-xs text-muted-foreground mt-1">Myom, kist, endometriozis gibi ameliyat epikrizleri</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      6
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Kullandığınız İlaçlar</div>
                      <p className="text-xs text-muted-foreground mt-1">Düzenli kullandığınız ilaçların listesi</p>
                    </div>
                  </div>
                </>
              ) : selectedType === "kontrol-takip" ? (
                <>
                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Yaptırdığınız kan idrar tahlilleri</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Yaptırdığınız ultrasonlar</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Manyetik Rezonans Görüntüleme (MRG)</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Tomografi (BT)</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      5
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Smear Testi, HPV Testi</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      6
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Ameliyat veya biyopsilerin notları ve patoloji sonuçları</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      7
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Bilinen başka hastalıklarınız varsa bilgi ve muayene notları</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Hormon Tahlilleri</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        FSH, LH, E2, AMH, Prolaktin gibi hormon sonuçları
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Rahim Filmi (HSG)</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tüp geçirgenliğini gösteren radyolojik görüntüleme
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Spermiogram</div>
                      <p className="text-xs text-muted-foreground mt-1">Sperm analiz sonuçları (erkek partner için)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Genetik Tahliller</div>
                      <p className="text-xs text-muted-foreground mt-1">Karyotip analizi, taşıyıcılık testleri vb.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      5
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Önceki Tedavilerin Ayrıntıları</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Daha önce yapılan tüp bebek, aşılama vb. kayıtları
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/30 min-h-[60px]">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                      6
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Geçirdiğiniz Ameliyatların Notları</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Myom, kist, endometriozis ameliyatları, epikriz raporları
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 border p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Not:</span> Bu evraklar zorunlu değildir, ancak doktorunuzun size daha
                iyi hizmet verebilmesi için önerilir. Eksik evraklarınızı randevu öncesinde temin etmeniz tavsiye
                edilir.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => goToStep(6)} className="w-full sm:flex-1 min-h-[44px]">
                Geri
              </Button>
              <Button 
                onClick={() => goToStep(8)} 
                className="w-full sm:flex-1 min-h-[44px]"
                disabled={!appointmentId}
              >
                İleri
              </Button>
            </div>
          </div>
          )}

          {/* Step 8: Başarılı */}
          {currentStep === 8 && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            </div>

            <div className="px-4">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Randevunuz Onaylandi!</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                SMS dogrulama tamamlandi. Randevu bilgileriniz telefon numaraniza gonderildi.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                <span className="text-muted-foreground font-medium">Doktor:</span>
                <span className="font-medium">{doctorName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                <span className="text-muted-foreground font-medium">Tarih:</span>
                <span className="font-medium text-xs sm:text-sm">
                  {new Date(selectedSlot.date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    weekday: "long",
                  })}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                <span className="text-muted-foreground font-medium">Saat:</span>
                <span className="font-medium">{selectedSlot.time}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                <span className="text-muted-foreground font-medium">Randevu Tipi:</span>
                <span className="font-medium text-xs sm:text-sm">
                  {selectedType === "ilk-randevu" ? "Ilk Randevu"
                    : selectedType === "kontrol-takip" ? "Kontrol / Takip"
                    : selectedType === "ayrintili-fetal-ultrason" ? "Ayrintili (2. Duzey) Fetal Ultrason"
                    : selectedType === "genetik-danismanlik" ? "Genetik Danismanlik"
                    : selectedType === "gebelik-takibi" ? "Gebelik Takibi"
                    : selectedType === "gebelik-istemi-infertilite" ? "Gebelik Istemi / Infertilite"
                    : selectedType === "asilama-tup-bebek" ? "Asilama / Tup Bebek"
                    : selectedType}
                </span>
              </div>
              {selectedType === "ayrintili-fetal-ultrason" && localFetalBebekSayisi && (
                <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                  <span className="text-muted-foreground font-medium">Bebek Sayisi:</span>
                  <span className="font-medium">
                    {localFetalBebekSayisi === "tek" ? "Tek Bebek"
                      : localFetalBebekSayisi === "ikiz" ? "Ikiz Bebek"
                      : "Ucuz Bebek"}
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-lg border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 dark:from-green-950/30 to-green-100 dark:to-green-950/50 p-4">
              <div className="text-center">
                <p className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-400">✓ SMS Dogrulama Tamamlandi</p>
              </div>
            </div>

            <Button className="w-full min-h-[44px]" onClick={handleCompleteWizard}>
              Kapat
            </Button>
          </div>
          )}

          {/* ACİL RANDEVU FLOW - AŞAĞIDA GÖSTERİL */}
          {showEmergencyFlow && (
            <div ref={emergencyRef} className="space-y-6 py-6 border-t-2 border-destructive/20 mt-6 pt-6">
              <div className="text-center space-y-4">
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-lg p-6">
                  <h2 className="text-2xl sm:text-4xl font-bold text-destructive mb-4">ACİL DURUMDA</h2>

                  {emergencyStep === "sekreter" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-muted-foreground mb-4">Sekreteri Arayınız:</p>
                        <p className="text-5xl sm:text-6xl font-bold text-destructive break-words">0531 080 47 20</p>
                      </div>
                      <p className="text-sm text-muted-foreground italic mt-4">
                        Sakin olunuz. Hemen size yardımcı olacağız.
                      </p>
                    </div>
                  )}

                  {emergencyStep === "hemsiresatır1" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-muted-foreground mb-4">Hemşire 1'i Arayınız:</p>
                        <p className="text-5xl sm:text-6xl font-bold text-destructive break-words">0533 142 72 61</p>
                      </div>
                      <p className="text-sm text-muted-foreground italic mt-4">
                        Sakin olunuz. Ulaşamadığımız durumlarda sizin aradığımız numaraya geri dönüş yapacağız.
                      </p>
                    </div>
                  )}

                  {emergencyStep === "hemsiresatır2" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-muted-foreground mb-4">Hemşire 2'yi Arayınız:</p>
                        <p className="text-5xl sm:text-6xl font-bold text-destructive break-words">0537 788 13 31</p>
                      </div>
                      <p className="text-sm text-muted-foreground italic mt-4">
                        Sakin olunuz. Ulaşamadığımız durumlarda sizin aradığımız numaraya geri dönüş yapacağız.
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    onClick={() => {
                      onSuccess?.()
                      onClose()
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
                  >
                    Konuştum - Tamam
                  </Button>

                  <Button
                    onClick={() => {
                      if (emergencyStep === "sekreter") {
                        setEmergencyStep("hemsiresatır1")
                      } else if (emergencyStep === "hemsiresatır1") {
                        setEmergencyStep("hemsiresatır2")
                      } else if (emergencyStep === "hemsiresatır2") {
                        onSuccess?.()
                        onClose()
                      }
                    }}
                    variant="outline"
                    className="w-full min-h-[44px]"
                  >
                    Ulaşamadım - Yeni Numara
                  </Button>

                  <Button
                    onClick={() => {
                      setShowEmergencyFlow(false)
                      setSelectedType(null)
                      setEmergencyStep("sekreter")
                    }}
                    variant="ghost"
                    className="w-full min-h-[44px]"
                  >
                    İptal
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
