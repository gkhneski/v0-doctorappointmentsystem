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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  Phone,
  User,
  Hash,
  MapPin,
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

// Compact info display component
function InfoItem({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: any }) {
  if (!value || value === "-") return null
  
  return (
    <div className="flex items-start gap-2 py-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

export function PatientDetailClient({ patientId }: PatientDetailClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const [patientRes, appointmentsRes, documentsRes, notesRes] = await Promise.all([
          supabase
            .from("patients")
            .select("*")
            .eq("id", patientId)
            .single(),
          supabase
            .from("appointments")
            .select("*")
            .eq("patient_id", patientId)
            .order("appointment_date", { ascending: false }),
          supabase
            .from("patient_documents")
            .select("*")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false }),
          supabase
            .from("doctor_notes")
            .select("*")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false }),
        ])

        if (patientRes.error) throw patientRes.error
        
        setPatient(patientRes.data)
        setAppointments(appointmentsRes.data || [])
        setDocuments(documentsRes.data || [])
        setNotes(notesRes.data || [])
      } catch (error) {
        console.error("Error fetching patient data:", error)
        toast({
          title: "Hata",
          description: "Hasta bilgileri yüklenemedi",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [patientId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Hasta bulunamadı</p>
        <Button onClick={() => router.push("/admin/patients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Hastalara Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/patients")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={patient.profile_photo_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {patient.full_name?.slice(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-bold">{patient.full_name}</h1>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {patient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </span>
                    )}
                    {patient.tc_no && !patient.tc_no.startsWith("TEMP_") && (
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {patient.tc_no}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {patient.medical_alerts && (
                <Badge variant="destructive" className="text-xs">
                  Tıbbi Uyarı
                </Badge>
              )}
              {patient.kvkk_approved && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  KVKK Onaylı
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Randevular</p>
              <p className="text-2xl font-bold">{appointments.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Evraklar</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Notlar</p>
              <p className="text-2xl font-bold">{notes.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Yaş</p>
              <p className="text-2xl font-bold">
                {patient.date_of_birth 
                  ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
                  : "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Compact Patient Info in Accordion */}
        <Accordion type="single" collapsible className="mb-6" defaultValue="patient-info">
          <AccordionItem value="patient-info" className="border rounded-lg bg-white">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-semibold">Hasta Bilgileri</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-x-6">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Kişisel</h4>
                    <div className="space-y-1">
                      <InfoItem label="TC Kimlik No" value={patient.tc_no?.startsWith("TEMP_") ? "Geçici Kayıt" : patient.tc_no} icon={Hash} />
                      <InfoItem label="Doğum Tarihi" value={patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString("tr-TR") : null} icon={Calendar} />
                      <InfoItem label="Doğum Yeri" value={patient.birth_place} icon={MapPin} />
                      <InfoItem label="Meslek" value={patient.occupation} />
                      <InfoItem label="Kan Grubu" value={patient.blood_group} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">İletişim</h4>
                    <div className="space-y-1">
                      <InfoItem label="Telefon" value={patient.phone} icon={Phone} />
                      <InfoItem label="E-posta" value={patient.email} />
                      <InfoItem label="Adres" value={patient.address} icon={MapPin} />
                      <InfoItem label="İlçe" value={patient.district} />
                      <InfoItem label="Şehir" value={patient.city} />
                      <InfoItem label="Ülke" value={patient.country} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Diğer</h4>
                    <div className="space-y-1">
                      <InfoItem label="Anne Adı" value={patient.mother_name} />
                      <InfoItem label="Baba Adı" value={patient.father_name} />
                      <InfoItem label="Referans" value={patient.reference_source} />
                      <InfoItem label="Dosya No" value={patient.file_number} />
                    </div>
                  </div>
                </div>
                
                {/* Spouse Info if exists */}
                {(patient.spouse_name || patient.spouse_tc_no) && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Eş Bilgileri</h4>
                    <div className="grid grid-cols-3 gap-x-6">
                      <InfoItem label="Ad Soyad" value={patient.spouse_name} icon={User} />
                      <InfoItem label="TC No" value={patient.spouse_tc_no} icon={Hash} />
                      <InfoItem label="Doğum Tarihi" value={patient.spouse_birth_date ? new Date(patient.spouse_birth_date).toLocaleDateString("tr-TR") : null} icon={Calendar} />
                      <InfoItem label="Meslek" value={patient.spouse_occupation} />
                      <InfoItem label="Kan Grubu" value={patient.spouse_blood_group} />
                      <InfoItem label="Referans" value={patient.spouse_reference_source} />
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Özet</TabsTrigger>
            <TabsTrigger value="appointments">Randevular</TabsTrigger>
            <TabsTrigger value="documents">Evraklar</TabsTrigger>
            <TabsTrigger value="notes">Notlar</TabsTrigger>
            <TabsTrigger value="infertility">İnfertilite</TabsTrigger>
            <TabsTrigger value="pregnancy">Gebelik</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Genel Bakış</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Son randevu özeti, önemli notlar ve aktif tedaviler burada görünecek
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Randevu Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz randevu yok</p>
                ) : (
                  <div className="space-y-2">
                    {appointments.slice(0, 10).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{new Date(apt.appointment_date).toLocaleDateString("tr-TR")}</p>
                            <p className="text-xs text-muted-foreground">{apt.appointment_time}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{apt.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evraklar</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz evrak yok</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                        <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="font-medium text-sm truncate">{doc.document_type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("tr-TR")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notlar</CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz not yok</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="border-l-4 border-l-blue-500 pl-3 py-2">
                        <p className="text-sm">{note.note_text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(note.created_at).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="infertility">
            <InfertilityEvaluationForm patientId={patientId} />
          </TabsContent>

          <TabsContent value="pregnancy">
            <PregnancyTab patientId={patientId} />
          </TabsContent>
        </Tabs>
      </div>

      <MedicalAlertsFloatingButton patientId={patientId} />
    </div>
  )
}
