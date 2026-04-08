"use client"

import { DialogTitle } from "@/components/ui/dialog"
import InfertilityEvaluationForm from "@/components/admin/infertility-evaluation-form"
import { PregnancyTab } from "@/components/admin/pregnancy/pregnancy-tab"
import { SmsSender } from "@/components/admin/sms-sender"
import { MedicalAlertsFloatingButton } from "@/components/admin/medical-alerts-floating-button"
import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogDescription } from "@/components/ui/dialog"
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
import { toast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Camera,
  Download,
  Eye,
  X,
  CalendarPlus,
  FileText,
  MessageSquare,
  Upload,
  Edit,
  Save,
  Trash2,
  Edit3,
  AlertTriangle,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PatientDetailClientProps {
  patientId: string
}

export function PatientDetailClient({ patientId }: PatientDetailClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [patient, setPatient] = useState<any>(null)
  const [profilePhotoSignedUrl, setProfilePhotoSignedUrl] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [lightboxDoc, setLightboxDoc] = useState<any>(null)
  const [smsDialog, setSmsDialog] = useState(false)
  const [noteDialog, setNoteDialog] = useState(false)
  const [smsMessage, setSmsMessage] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [sendingSms, setSendingSms] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [showInfertilityTab, setShowInfertilityTab] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [uploadingSpousePhoto, setUploadingSpousePhoto] = useState(false)
  const [spousePhotoSignedUrl, setSpousePhotoSignedUrl] = useState<string | null>(null)
  const [references, setReferences] = useState<Array<{ id: string; reference_name: string }>>([])
  const [showAddReference, setShowAddReference] = useState(false)
  const [newReference, setNewReference] = useState("")
  const [showAddSpouseReference, setShowAddSpouseReference] = useState(false)
  const [newSpouseReference, setNewSpouseReference] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Use singleton client to prevent "Multiple GoTrueClient instances" error
  const supabase = useMemo(() => createClient(), [])

  const fetchReferences = async () => {
    try {
      const { data, error } = await supabase.from("references").select("*").order("reference_name")
      if (error) throw error
      setReferences(data || [])
    } catch (error: any) {
      console.error("[v0] References fetch error:", error)
    }
  }

  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true)

      // Only fetch patient data if not already loaded
      if (!patient) {
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", patientId)
          .single()

        if (patientError) throw patientError
        setPatient(patientData)

        if (patientData.profile_photo_url) {
          const pathMatch = patientData.profile_photo_url.match(/profile-photos\/[^?]+/)
          if (pathMatch) {
            const storagePath = pathMatch[0]
            const { data: signedData } = await supabase.storage
              .from("patient-documents")
              .createSignedUrl(storagePath, 3600)
            if (signedData?.signedUrl) {
              setProfilePhotoSignedUrl(signedData.signedUrl)
            }
          }
        }
      }

      // Fetch appointments with limit (lazy load other tabs)
      if (activeTab === "appointments" && appointments.length === 0) {
        const { data: appointmentsData } = await supabase
          .from("appointments")
          .select("*, doctors:doctor_id(name)")
          .eq("patient_id", patientId)
          .order("appointment_date", { ascending: false })
          .limit(50)
        setAppointments(appointmentsData || [])
      }

      // Lazy load documents only when documents tab is active
      if (activeTab === "documents" && documents.length === 0) {
        const { data: documentsData } = await supabase
          .from("patient_documents")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false })
          .limit(100)

        if (documentsData) {
          const docsWithSignedUrls = await Promise.all(
            documentsData.map(async (doc) => {
              try {
                const pathMatch = doc.file_url.match(/patient-documents\/(.+)/)
                if (!pathMatch) return { ...doc, signedUrl: null }

                const storagePath = pathMatch[1]
                const { data: signedData, error } = await supabase.storage
                  .from("patient-documents")
                  .createSignedUrl(storagePath, 3600)

                if (error) {
                  console.error("[v0] Signed URL error for", doc.file_name, error)
                  return { ...doc, signedUrl: null }
                }

                return { ...doc, signedUrl: signedData?.signedUrl || null }
              } catch (err) {
                console.error("[v0] Error processing document:", doc.file_name, err)
                return { ...doc, signedUrl: null }
              }
            }),
          )
          setDocuments(docsWithSignedUrls)
        }
      }

      const { data: notesData } = await supabase
        .from("doctor_notes")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
      setNotes(notesData || [])
    } catch (error: any) {
      console.error("[v0] Patient fetch error:", error)
      toast({ title: "Hata", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [patientId, activeTab, patient, appointments.length, documents.length])

  useEffect(() => {
    fetchPatientData()
    fetchReferences()
    setShowInfertilityTab(true)
  }, [patientId, activeTab, fetchPatientData])

  useEffect(() => {
    if (patient) {
      setFormData(patient)
      
      // TEMP_ TC'li hastalar için otomatik edit mode aç
      if (patient.tc_no?.startsWith("TEMP_")) {
        setEditMode(true)
      }
      
      // Load spouse photo if exists
      if (patient.spouse_photo_url) {
        supabase.storage
          .from("patient-documents")
          .createSignedUrl(patient.spouse_photo_url.split("/patient-documents/")[1], 3600)
          .then(({ data }) => {
            if (data?.signedUrl) setSpousePhotoSignedUrl(data.signedUrl)
          })
      }
    }
  }, [patient])

  // Auto-sync spouse registration date from woman's registration date
  useEffect(() => {
    if (formData.registration_date && !formData.spouse_registration_date) {
      setFormData((prev: any) => ({ ...prev, spouse_registration_date: prev.registration_date }))
    }
  }, [formData.registration_date])

  const handleAddReference = async () => {
    if (!newReference.trim()) return
    try {
      const { data, error } = await supabase
        .from("references")
        .insert({ reference_name: newReference.trim() })
        .select()
        .single()
      if (error) throw error
      setReferences([...references, data])
      setFormData({ ...formData, reference_id: data.id })
      setNewReference("")
      setShowAddReference(false)
      toast({ title: "Başarılı", description: "Yeni referans eklendi" })
    } catch (error: any) {
      console.error("[v0] Add reference error:", error)
      toast({ title: "Hata", description: "Referans eklenemedi", variant: "destructive" })
    }
  }

  const handleAddSpouseReference = async () => {
    if (!newSpouseReference.trim()) return
    try {
      const { data, error } = await supabase
        .from("references")
        .insert({ reference_name: newSpouseReference.trim() })
        .select()
        .single()
      if (error) throw error
      setReferences([...references, data])
      setFormData({ ...formData, spouse_reference_id: data.id })
      setNewSpouseReference("")
      setShowAddSpouseReference(false)
      toast({ title: "Başarılı", description: "Yeni eş referansı eklendi" })
    } catch (error: any) {
      console.error("[v0] Add spouse reference error:", error)
      toast({ title: "Hata", description: "Eş referansı eklenemedi", variant: "destructive" })
    }
  }

  const handleSavePatientData = async () => {
    try {
      setSaving(true)
      console.log("[v0] Saving patient data:", formData)
      
      // TEMP_ TC'den gerçek TC'ye dönüşüm kontrolü
      const isTempToReal = patient?.tc_no?.startsWith("TEMP_") && formData.tc_no && !formData.tc_no.startsWith("TEMP_")
      
      const { data, error } = await supabase.from("patients").update(formData).eq("id", patientId).select()
      
      if (error) {
        console.error("[v0] Database error:", error)
        // TC duplicate hatası özel mesaj
        if (error.code === "23505" && error.message.includes("tc_no")) {
          toast({
            title: "✗ Hata",
            description: "Bu TC kimlik numarası zaten sistemde kayıtlı.",
            variant: "destructive",
            duration: 5000,
          })
          return
        }
        throw error
      }
      
      console.log("[v0] Save successful:", data)
      setPatient(formData)
      setEditMode(false)
      
      // TEMP_ TC'den gerçek TC'ye geçiş yapıldıysa SMS onay kodu gönder
      if (isTempToReal && formData.phone && formData.phone !== "0000000000") {
        toast({
          title: "✓ Bilgiler Kaydedildi",
          description: "SMS onay kodu gönderiliyor...",
          duration: 3000,
        })
        
        try {
          // Hastanın son randevusunu bul
          const { data: appointments } = await supabase
            .from("appointments")
            .select("id")
            .eq("patient_id", patientId)
            .order("appointment_date", { ascending: false })
            .limit(1)
          
          if (appointments && appointments.length > 0) {
            // SMS onay kodu gönder
            const smsResponse = await fetch("/api/sms/send-verification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: formData.phone,
                appointmentId: appointments[0].id,
                tc_no: formData.tc_no,
                date_of_birth: formData.date_of_birth,
              }),
            })
            
            if (smsResponse.ok) {
              toast({
                title: "✓ SMS Gönderildi",
                description: `${formData.phone} numarasına onay kodu gönderildi. Hastaya kodu sorsun ve onaylayın.`,
                duration: 8000,
              })
            }
          }
        } catch (smsError: any) {
          console.error("[v0] SMS send error:", smsError)
          // SMS hatası bloke etmesin, hasta bilgileri zaten kaydedildi
        }
      } else {
        toast({
          title: "✓ Başarılı",
          description: "Değişiklikler başarıyla kaydedildi",
          duration: 4000,
        })
      }
    } catch (error: any) {
      console.error("[v0] Save error:", error)
      toast({
        title: "✗ Hata",
        description: `Bilgiler kaydedilemedi: ${error.message || "Bilinmeyen hata"}`,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setFormData(patient)
    setEditMode(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `profile_${patientId}_${Date.now()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error: uploadError } = await supabase.storage.from("patient-documents").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: signedData } = await supabase.storage.from("patient-documents").createSignedUrl(filePath, 3600)

      if (!signedData?.signedUrl) throw new Error("Failed to generate signed URL")

      const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/patient-documents/${filePath}`

      const { error: updateError } = await supabase
        .from("patients")
        .update({ profile_photo_url: storageUrl })
        .eq("id", patientId)

      if (updateError) throw updateError

      setPatient((prev: any) => ({ ...prev, profile_photo_url: storageUrl }))
      setProfilePhotoSignedUrl(signedData.signedUrl)
      toast({ title: "Başarılı", description: "Profil resmi güncellendi" })
    } catch (error: any) {
      console.error("[v0] Photo upload error:", error)
      toast({ title: "Hata", description: "Resim yüklenemedi", variant: "destructive" })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSpousePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingSpousePhoto(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `spouse_profile_${patientId}_${Date.now()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error: uploadError } = await supabase.storage.from("patient-documents").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: signedData } = await supabase.storage.from("patient-documents").createSignedUrl(filePath, 3600)

      if (!signedData?.signedUrl) throw new Error("Failed to generate signed URL")

      const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/patient-documents/${filePath}`

      const { error: updateError } = await supabase
        .from("patients")
        .update({ spouse_photo_url: storageUrl })
        .eq("id", patientId)

      if (updateError) throw updateError

      setPatient((prev: any) => ({ ...prev, spouse_photo_url: storageUrl }))
      setSpousePhotoSignedUrl(signedData.signedUrl)
      toast({ title: "Başarılı", description: "Eş profil resmi güncellendi" })
    } catch (error: any) {
      console.error("[v0] Spouse photo upload error:", error)
      toast({ title: "Hata", description: "Eş resmi yüklenemedi", variant: "destructive" })
    } finally {
      setUploadingSpousePhoto(false)
    }
  }

  const handleSendSms = async () => {
    if (!smsMessage.trim()) return
    setSendingSms(true)
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: patient.phone,
          message: smsMessage,
        }),
      })
      if (response.ok) {
        toast({ title: "SMS gönderildi" })
        setSmsDialog(false)
        setSmsMessage("")
      } else {
        toast({ title: "SMS gönderilemedi", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Hata oluştu", variant: "destructive" })
    } finally {
      setSendingSms(false)
    }
  }

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return
    setSavingNote(true)
    try {
      const { error } = await supabase.from("doctor_notes").insert({
        patient_id: patientId,
        doctor_name: "Admin",
        note: noteContent,
      })
      if (error) throw error
      toast({ title: "Not kaydedildi" })
      setNoteDialog(false)
      setNoteContent("")
      fetchPatientData()
    } catch (error) {
      toast({ title: "Not kaydedilemedi", variant: "destructive" })
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeletePatient = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/patients/${patientId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Hasta silinemedi")
      }

      toast({
        title: "Başarılı",
        description: "Hasta başarıyla silindi",
      })

      router.push("/admin/patients")
    } catch (error) {
      console.error("[v0] Error deleting patient:", error)
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Hasta silinirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p>Hasta bulunamadı</p>
      </div>
    )
  }

  const photoUrl = profilePhotoSignedUrl

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">Hasta Detayı</h1>
                <p className="text-xs text-gray-600">{patient?.full_name}</p>
              </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SmsSender
                patientId={patientId}
                patientName={patient.full_name}
                patientPhone={patient.phone || ""}
              />
            </div>
        </div>
      </header>

      {/* TEMP_ TC Uyarı Banner */}
      {patient.tc_no?.startsWith("TEMP_") && (
        <div className="mx-6 mt-4 rounded-lg bg-orange-50 border border-orange-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-900">Geçici Hasta Kaydı</h3>
              <p className="text-sm text-orange-700 mt-1">
                Bu hasta <strong>"Hızlı Ajanda Bloke"</strong> ile oluşturulmuş. Lütfen gerçek <strong>TC Kimlik No</strong>, <strong>Telefon</strong> ve <strong>Doğum Tarihi</strong> bilgilerini girin. 
                Kaydet'e bastığınızda SMS onay kodu gönderilecek.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        {/* EDIT/SAVE BUTTONS */}
        <div className="mb-4 flex justify-end gap-2">
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Düzenle
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                İptal
              </Button>
              <Button onClick={handleSavePatientData} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Kaydet
              </Button>
            </>
          )}
        </div>

        {/* DUAL CLINICAL FORM CONTAINER */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* WOMAN / PATIENT CARD (LEFT - SUBTLE PINK) */}
          <Card className="bg-gradient-to-b from-rose-50/40 to-white border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-5">
                <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide">BAYAN HASTA KAYIT</h3>
                <div className="relative flex-shrink-0">
                  <Avatar className="h-20 w-20 border-2 border-gray-300">
                    {profilePhotoSignedUrl ? (
                      <AvatarImage src={profilePhotoSignedUrl || "/placeholder.svg"} alt={patient.full_name} />
                    ) : (
                      <AvatarFallback className="bg-rose-100 text-lg font-semibold text-gray-700">
                        {patient.full_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-600 text-white shadow transition-colors hover:bg-gray-700"
                  >
                    {uploadingPhoto ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Kayıt Tarihi</label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={formData.registration_date?.split("T")[0] || ""}
                      onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formData.registration_date
                        ? new Date(formData.registration_date).toLocaleDateString("tr-TR")
                        : "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Doktor</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.doctor || ""}
                      onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.doctor || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">TC</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.tc_no || ""}
                      onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })}
                      className="h-8 text-sm font-mono"
                      maxLength={11}
                    />
                  ) : (
                    <p className="font-mono text-sm font-medium text-gray-900">{formData.tc_no || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Dosya No</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.file_number || ""}
                      onChange={(e) => setFormData({ ...formData, file_number: e.target.value })}
                      className="h-8 text-sm font-mono"
                    />
                  ) : (
                    <p className="font-mono text-sm font-medium text-gray-900">{formData.file_number || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Adı</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.full_name?.split(" ")[0] || ""}
                      onChange={(e) => {
                        const lastName = formData.full_name?.split(" ").slice(1).join(" ") || ""
                        setFormData({ ...formData, full_name: `${e.target.value} ${lastName}`.trim() })
                      }}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.full_name?.split(" ")[0] || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Soyadı</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.full_name?.split(" ").slice(1).join(" ") || ""}
                      onChange={(e) => {
                        const firstName = formData.full_name?.split(" ")[0] || ""
                        setFormData({ ...formData, full_name: `${firstName} ${e.target.value}`.trim() })
                      }}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formData.full_name?.split(" ").slice(1).join(" ") || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Ana Adı</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.mother_name || ""}
                      onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.mother_name || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Baba Adı</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.father_name || ""}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.father_name || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Doğum Tarihi</label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={formData.date_of_birth?.split("T")[0] || ""}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formData.date_of_birth
                        ? new Date(formData.date_of_birth).toLocaleDateString("tr-TR")
                        : "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Doğum Yeri</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.birth_place || ""}
                      onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.birth_place || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Meslek</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.occupation || ""}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.occupation || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Kan Grubu</label>
                  {editMode ? (
                    <Select
                      value={formData.blood_group || ""}
                      onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
                    >
                      <SelectTrigger className="h-8 text-sm w-full">
                        <SelectValue placeholder="Seçiniz" />
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
                  ) : (
                    <p className="text-sm font-semibold text-red-600">{formData.blood_group || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Referans</label>
                  {editMode ? (
                    <>
                      {showAddReference ? (
                        <div className="flex gap-1">
                          <Input
                            type="text"
                            value={newReference}
                            onChange={(e) => setNewReference(e.target.value)}
                            placeholder="Yeni referans adı"
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddReference()
                            }}
                          />
                          <Button size="sm" onClick={handleAddReference} className="h-8 px-2 text-xs">
                            Ekle
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddReference(false)
                              setNewReference("")
                            }}
                            className="h-8 px-2 text-xs"
                          >
                            İptal
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Select
                            value={formData.reference_id || ""}
                            onValueChange={(value) =>
                              setFormData({ ...formData, reference_id: value === "new" ? null : value })
                            }
                          >
                            <SelectTrigger className="h-8 text-sm flex-1">
                              <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                              {references.map((ref) => (
                                <SelectItem key={ref.id} value={ref.id}>
                                  {ref.reference_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddReference(true)}
                            className="h-8 px-2 text-xs whitespace-nowrap"
                          >
                            + Yeni
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {references?.find((r) => r.id === formData.reference_id)?.reference_name || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Telefon</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.phone || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Ülke</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.country || ""}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.country || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Şehir</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.city || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">İlçe</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.district || ""}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.district || "-"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MAN / SPOUSE CARD (RIGHT - SUBTLE BLUE) */}
          <Card className="bg-gradient-to-b from-sky-50/40 to-white border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-5">
                <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide">BAY HASTA KAYIT</h3>
                <div className="relative flex-shrink-0">
                  <Avatar className="h-20 w-20 border-2 border-gray-300">
                    {spousePhotoSignedUrl ? (
                      <AvatarImage src={spousePhotoSignedUrl || "/placeholder.svg"} alt={patient.spouse_name || "Eş"} />
                    ) : (
                      <AvatarFallback className="bg-sky-100 text-lg font-semibold text-gray-700">
                        {patient.spouse_name
                          ? patient.spouse_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "??"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label
                    htmlFor="spouse-photo-upload"
                    className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-600 text-white shadow transition-colors hover:bg-gray-700"
                  >
                    {uploadingSpousePhoto ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </label>
                  <input
                    id="spouse-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSpousePhotoUpload}
                    disabled={uploadingSpousePhoto}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">
                    Kayıt Tarihi (Otomatik)
                  </label>
                  <p className="text-sm font-medium text-gray-500 italic">
                    {formData.registration_date
                      ? new Date(formData.registration_date).toLocaleDateString("tr-TR")
                  : "-"}
                </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">TC</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_tc_no || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_tc_no: e.target.value })}
                      className="h-8 text-sm font-mono"
                      maxLength={11}
                    />
                  ) : (
                    <p className="font-mono text-sm font-medium text-gray-900">{formData.spouse_tc_no || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Adı</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_name?.split(" ")[0] || ""}
                      onChange={(e) => {
                        const lastName = formData.spouse_name?.split(" ").slice(1).join(" ") || ""
                        setFormData({ ...formData, spouse_name: `${e.target.value} ${lastName}`.trim() })
                      }}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.spouse_name?.split(" ")[0] || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Soyadı</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_name?.split(" ").slice(1).join(" ") || ""}
                      onChange={(e) => {
                        const firstName = formData.spouse_name?.split(" ")[0] || ""
                        setFormData({ ...formData, spouse_name: `${firstName} ${e.target.value}`.trim() })
                      }}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formData.spouse_name?.split(" ").slice(1).join(" ") || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Ana Adı</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_mother_name || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_mother_name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.spouse_mother_name || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Baba Adı</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_father_name || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_father_name: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.spouse_father_name || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Doğum Tarihi</label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={formData.spouse_date_of_birth?.split("T")[0] || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_date_of_birth: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formData.spouse_date_of_birth
                        ? new Date(formData.spouse_date_of_birth).toLocaleDateString("tr-TR")
                        : "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Doğum Yeri</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_birth_place || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_birth_place: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.spouse_birth_place || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Meslek</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_occupation || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_occupation: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.spouse_occupation || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Kan Grubu</label>
                  {editMode ? (
                    <Select
                      value={formData.spouse_blood_group || ""}
                      onValueChange={(value) => setFormData({ ...formData, spouse_blood_group: value })}
                    >
                      <SelectTrigger className="h-8 text-sm w-full">
                        <SelectValue placeholder="Seçiniz" />
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
                  ) : (
                    <p className="text-sm font-semibold text-red-600">{formData.spouse_blood_group || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Referans</label>
                  {editMode ? (
                    <>
                      {showAddSpouseReference ? (
                        <div className="flex gap-1">
                          <Input
                            type="text"
                            value={newSpouseReference}
                            onChange={(e) => setNewSpouseReference(e.target.value)}
                            placeholder="Yeni referans adı"
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSpouseReference()
                            }}
                          />
                          <Button size="sm" onClick={handleAddSpouseReference} className="h-8 px-2 text-xs">
                            Ekle
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddSpouseReference(false)
                              setNewSpouseReference("")
                            }}
                            className="h-8 px-2 text-xs"
                          >
                            İptal
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Select
                            value={formData.spouse_reference_id || ""}
                            onValueChange={(value) =>
                              setFormData({ ...formData, spouse_reference_id: value === "new" ? null : value })
                            }
                          >
                            <SelectTrigger className="h-8 text-sm flex-1">
                              <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                              {references.map((ref) => (
                                <SelectItem key={ref.id} value={ref.id}>
                                  {ref.reference_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddSpouseReference(true)}
                            className="h-8 px-2 text-xs whitespace-nowrap"
                          >
                            + Yeni
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {references?.find((r) => r.id === formData.spouse_reference_id)?.reference_name || "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Telefon</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_phone || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_phone: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.spouse_phone || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Ülke</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_country || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_country: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.spouse_country || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Şehir</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_city || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_city: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.spouse_city || "-"}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">İlçe</label>
                  {editMode ? (
                    <Input
                      type="text"
                      value={formData.spouse_district || ""}
                      onChange={(e) => setFormData({ ...formData, spouse_district: e.target.value })}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{formData.spouse_district || "-"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="appointments">Randevu Geçmişi</TabsTrigger>
            <TabsTrigger value="documents">Evraklar</TabsTrigger>
            <TabsTrigger value="notes">Notlar</TabsTrigger>
            {showInfertilityTab && <TabsTrigger value="infertility">İnfertilite Değerlendirme</TabsTrigger>}
            <TabsTrigger value="pregnancy">Gebelik Takip</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Toplam Randevu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{appointments.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Yüklenen Evrak</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{documents.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{notes.length}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Randevu Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz randevu yok</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <p className="font-medium">{new Date(apt.appointment_date).toLocaleDateString("tr-TR")}</p>
                          <p className="text-sm text-muted-foreground">{apt.doctors?.name || "Doktor bilgisi yok"}</p>
                        </div>
                        <Badge>
                          {apt.status === "confirmed" ? "Onaylandı" : apt.status === "pending" ? "Beklemede" : "İptal"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-clinical-text">Yüklenen Evraklar</h3>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Yeni Evrak Yükle
              </Button>
            </div>
            {documents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-20" />
                  <p>Henüz evrak yüklenmemiş</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc: any) => {
                  const isImage = doc.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                  return (
                    <Card
                      key={doc.id}
                      className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                      onClick={() => {
                        setSelectedDocument(doc)
                        setLightboxOpen(true)
                      }}
                    >
                      <div className="relative aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden">
                        {isImage && doc.signedUrl ? (
                          <img
                            src={doc.signedUrl || "/placeholder.svg"}
                            alt={doc.file_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error("[v0] Image load error:", doc.file_name)
                              e.currentTarget.style.display = "none"
                              e.currentTarget.nextElementSibling?.classList.remove("hidden")
                            }}
                          />
                        ) : null}
                        <div
                          className={
                            isImage && doc.signedUrl ? "hidden" : "flex flex-col items-center justify-center p-6"
                          }
                        >
                          <FileText className="h-16 w-16 text-gray-400 mb-2" />
                          <p className="text-xs text-center text-gray-600 line-clamp-2">{doc.file_name}</p>
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDocument(doc)
                              setLightboxOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Önizle
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (doc.signedUrl) {
                                window.open(doc.signedUrl, "_blank")
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            İndir
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-3 border-t">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString("tr-TR")}
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Doktor Notları</CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz not eklenmemiş</p>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium">{note.doctor_name || "Doktor"}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(note.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <p className="text-sm">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {showInfertilityTab && (
            <TabsContent value="infertility" className="mt-6">
              <InfertilityEvaluationForm patientId={patientId} />
            </TabsContent>
          )}

          <TabsContent value="pregnancy" className="mt-6">
            <PregnancyTab
              patientId={patientId}
              patientData={{
                blood_group: patient?.blood_group,
                spouse_blood_group: patient?.spouse_blood_group,
              }}
            />
          </TabsContent>
        </Tabs>

        {lightboxDoc && (
          <Dialog open={!!lightboxDoc} onOpenChange={() => setLightboxDoc(null)}>
            <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
              <DialogHeader className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-sm font-semibold text-gray-900 truncate">
                      {lightboxDoc.file_name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-600 mt-1">
                      Yüklenme: {new Date(lightboxDoc.created_at).toLocaleDateString("tr-TR")} • Tür:{" "}
                      {lightboxDoc.file_type?.split("/")[1]?.toUpperCase() || "FILE"}
                    </DialogDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-4 shrink-0" onClick={() => setLightboxDoc(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="relative w-full h-[calc(95vh-80px)] bg-gray-100">
                {lightboxDoc.file_type?.startsWith("image/") ? (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <img
                      src={lightboxDoc.signedUrl || lightboxDoc.file_url || "/placeholder.svg"}
                      alt={lightboxDoc.file_name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8">
                    <FileText className="h-20 w-20 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">{lightboxDoc.file_name}</p>
                    <p className="text-sm text-gray-600 mb-6">Bu dosya türü tarayıcıda önizlenemiyor</p>
                    <div className="flex gap-3">
                      <Button asChild variant="default">
                        <a href={lightboxDoc.signedUrl || lightboxDoc.file_url} target="_blank" rel="noreferrer">
                          <Eye className="h-4 w-4 mr-2" />
                          Yeni Sekmede Aç
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href={lightboxDoc.signedUrl || lightboxDoc.file_url} download>
                          <Download className="h-4 w-4 mr-2" />
                          İndir
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={smsDialog} onOpenChange={setSmsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>SMS Gönder</DialogTitle>
              <DialogDescription>{patient.full_name} adlı hastaya SMS gönderin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Telefon</label>
                <p className="text-sm text-muted-foreground">{patient.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Mesaj</label>
                <Textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSmsDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleSendSms} disabled={sendingSms || !smsMessage.trim()}>
                {sendingSms && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gönder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Not Ekle</DialogTitle>
              <DialogDescription>{patient.full_name} için doktor notu ekleyin</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Notunuzu yazın..."
                rows={8}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveNote} disabled={savingNote || !noteContent.trim()}>
                {savingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Floating Medical Alerts Button */}
        <MedicalAlertsFloatingButton
          alerts={formData.medical_alerts || []}
          onUpdate={async (alerts) => {
            const updated = { ...formData, medical_alerts: alerts }
            setFormData(updated)
            try {
              await supabase.from("patients").update({ medical_alerts: alerts }).eq("id", patientId)
              setPatient(updated)
            } catch (error: any) {
              console.error("[v0] Medical alerts update error:", error)
              toast({ title: "Hata", description: "Tıbbi uyarılar kaydedilemedi", variant: "destructive" })
            }
          }}
          editMode={editMode}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hastayı Sil</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  Bu hastayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve hasta ile ilgili tüm
                  veriler (randevular, notlar, evraklar) silinecektir.
                  <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="font-semibold text-sm">Hasta Bilgileri:</div>
                    <div className="text-sm">
                      <strong>Ad Soyad:</strong> {patient?.full_name}
                    </div>
                    <div className="text-sm">
                      <strong>TC Kimlik No:</strong> {patient?.tc_no}
                    </div>
                    <div className="text-sm">
                      <strong>Telefon:</strong> {patient?.phone}
                    </div>
                  </div>
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
      </div>
    </div>
  )
}
