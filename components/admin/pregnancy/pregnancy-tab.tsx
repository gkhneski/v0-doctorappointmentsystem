"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CalendarPlus, Edit, XCircle, Plus, Save, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  fetchActivePregnancy,
  fetchPregnancyVisits,
  fetchPregnancyOutcome,
  updatePregnancyEpisode,
  calculateGA,
  formatGA,
  type PregnancyEpisode,
  type PregnancyVisit,
  type PregnancyOutcome,
} from "@/lib/pregnancy"
import { StartPregnancyModal } from "./start-pregnancy-modal"
import { VisitModal } from "./visit-modal"
import { OutcomeModal } from "./outcome-modal"
import { Loader2 } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface PregnancyTabProps {
  patientId: string
  patientData?: {
    blood_group?: string
    spouse_blood_group?: string
  }
}

export function PregnancyTab({ patientId, patientData }: PregnancyTabProps) {
  const [loading, setLoading] = useState(true)
  const [episode, setEpisode] = useState<PregnancyEpisode | null>(null)
  const [visits, setVisits] = useState<PregnancyVisit[]>([])
  const [outcome, setOutcome] = useState<PregnancyOutcome | null>(null)
  
  const [showStartModal, setShowStartModal] = useState(false)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showOutcomeModal, setShowOutcomeModal] = useState(false)
  const [editingVisit, setEditingVisit] = useState<PregnancyVisit | null>(null)

  // Gebelik bilgileri düzenleme
  const [isEditingEpisode, setIsEditingEpisode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<PregnancyEpisode>>({})
  const [isSavingEpisode, setIsSavingEpisode] = useState(false)

  // Anemnez
  const [anamnesis, setAnamnesis] = useState<string>("")
  const [isSavingAnamnesis, setIsSavingAnamnesis] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const pregnancyData = await fetchActivePregnancy(patientId)
      setEpisode(pregnancyData)

      if (pregnancyData) {
        setEditForm({
          conception_type: pregnancyData.conception_type || "",
          blood_group: pregnancyData.blood_group || "",
          height_cm: pregnancyData.height_cm ?? undefined,
          pre_pregnancy_weight: pregnancyData.pre_pregnancy_weight ?? undefined,
          important_notes: pregnancyData.important_notes || "",
          sat_date: pregnancyData.sat_date || "",
          edd_date: pregnancyData.edd_date || "",
        })
        setAnamnesis(
          typeof pregnancyData.anamnesis === "string"
            ? pregnancyData.anamnesis
            : pregnancyData.anamnesis?.text || ""
        )
        const [visitsData, outcomeData] = await Promise.all([
          fetchPregnancyVisits(pregnancyData.id),
          fetchPregnancyOutcome(pregnancyData.id),
        ])
        setVisits(visitsData)
        setOutcome(outcomeData)
      }
    } catch (error: any) {
      console.error("[v0] Pregnancy data load error:", error)
      toast({
        title: "Hata",
        description: "Gebelik verileri yüklenemedi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [patientId])

  const handleStartPregnancy = () => {
    setShowStartModal(true)
  }

  const handleSaveEpisode = async () => {
    if (!episode) return
    setIsSavingEpisode(true)
    try {
      const updated = await updatePregnancyEpisode(episode.id, editForm)
      setEpisode(updated)
      setIsEditingEpisode(false)
      toast({ title: "Gebelik bilgileri güncellendi" })
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" })
    } finally {
      setIsSavingEpisode(false)
    }
  }

  const handleSaveAnamnesis = async () => {
    if (!episode) return
    setIsSavingAnamnesis(true)
    try {
      await updatePregnancyEpisode(episode.id, { anamnesis: { text: anamnesis } as any })
      toast({ title: "Anemnez kaydedildi" })
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" })
    } finally {
      setIsSavingAnamnesis(false)
    }
  }

  const handleAddVisit = () => {
    setEditingVisit(null)
    setShowVisitModal(true)
  }

  const handleEditVisit = (visit: PregnancyVisit) => {
    setEditingVisit(visit)
    setShowVisitModal(true)
  }

  const handleClosePregnancy = () => {
    setShowOutcomeModal(true)
  }

  const handleModalSuccess = () => {
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Empty state - no active pregnancy
  if (!episode) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Gebelik Takip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-blue-100 p-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Aktif gebelik kaydı yok</h3>
              <p className="mb-6 text-sm text-gray-600">
                Bu hasta için henüz bir gebelik kaydı oluşturulmamış.
              </p>
              <Button onClick={handleStartPregnancy} className="gap-2">
                <CalendarPlus className="h-4 w-4" />
                Gebelik Başlat
              </Button>
            </div>
          </CardContent>
        </Card>

      <StartPregnancyModal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        patientId={patientId}
        patientData={patientData}
        onSuccess={handleModalSuccess}
      />
      </>
    )
  }

  // Calculate current GA
  const currentGA = episode.sat_date ? calculateGA(episode.sat_date) : null

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">SAT</div>
            <div className="mt-1 text-2xl font-bold">
              {episode.sat_date ? new Date(episode.sat_date).toLocaleDateString("tr-TR") : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">TDT (EDD)</div>
            <div className="mt-1 text-2xl font-bold">
              {episode.edd_date ? new Date(episode.edd_date).toLocaleDateString("tr-TR") : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Gebelik Haftası</div>
            <div className="mt-1 text-2xl font-bold">
              {currentGA ? formatGA(currentGA.weeks, currentGA.days) : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-gray-600">Durum</div>
            <div className="mt-1">
              <Badge variant={episode.status === "active" ? "default" : "secondary"}>
                {episode.status === "active" ? "Aktif" : "Kapalı"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Episode Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gebelik Bilgileri</CardTitle>
          <div className="flex gap-2">
            {!isEditingEpisode ? (
              <Button size="sm" variant="outline" onClick={() => setIsEditingEpisode(true)} className="gap-2 bg-transparent">
                <Edit className="h-4 w-4" />
                Düzenle
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditingEpisode(false)} className="gap-2">
                  <X className="h-4 w-4" />
                  İptal
                </Button>
                <Button size="sm" onClick={handleSaveEpisode} disabled={isSavingEpisode} className="gap-2">
                  {isSavingEpisode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Kaydet
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={handleAddVisit} className="gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Muayene Ekle
            </Button>
            {episode.status === "active" && (
              <Button size="sm" variant="destructive" onClick={handleClosePregnancy} className="gap-2">
                <XCircle className="h-4 w-4" />
                Gebeliği Kapat
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEditingEpisode ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                <div>
                  <div className="text-sm font-medium text-gray-600">Oluşum Tipi</div>
                  <div className="mt-1 text-sm">{episode.conception_type || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Kan Grubu</div>
                  <div className="mt-1 text-sm">{episode.blood_group || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Boy (cm)</div>
                  <div className="mt-1 text-sm">{episode.height_cm || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Gebelik Öncesi Kilo (kg)</div>
                  <div className="mt-1 text-sm">{episode.pre_pregnancy_weight || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">BMI</div>
                  <div className="mt-1 text-sm">{episode.bmi || "-"}</div>
                </div>
              </div>
              {episode.important_notes && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-600">Önemli Notlar</div>
                  <div className="mt-1 text-sm text-gray-900">{episode.important_notes}</div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="space-y-1">
                <Label>SAT</Label>
                <Input
                  type="date"
                  value={editForm.sat_date || ""}
                  onChange={(e) => setEditForm({ ...editForm, sat_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>TDT (EDD)</Label>
                <Input
                  type="date"
                  value={editForm.edd_date || ""}
                  onChange={(e) => setEditForm({ ...editForm, edd_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Oluşum Tipi</Label>
                <Select
                  value={editForm.conception_type || ""}
                  onValueChange={(v) => setEditForm({ ...editForm, conception_type: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spontan">Spontan</SelectItem>
                    <SelectItem value="IVF">IVF</SelectItem>
                    <SelectItem value="IUI">IUI</SelectItem>
                    <SelectItem value="OI">OI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Kan Grubu</Label>
                <Select
                  value={editForm.blood_group || ""}
                  onValueChange={(v) => setEditForm({ ...editForm, blood_group: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    {["A+","A-","B+","B-","AB+","AB-","0+","0-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Boy (cm)</Label>
                <Input
                  type="number"
                  value={editForm.height_cm || ""}
                  onChange={(e) => setEditForm({ ...editForm, height_cm: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label>Gebelik Öncesi Kilo (kg)</Label>
                <Input
                  type="number"
                  value={editForm.pre_pregnancy_weight || ""}
                  onChange={(e) => setEditForm({ ...editForm, pre_pregnancy_weight: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Önemli Notlar</Label>
                <Input
                  value={editForm.important_notes || ""}
                  onChange={(e) => setEditForm({ ...editForm, important_notes: e.target.value })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anemnez Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Anemnez</CardTitle>
          <Button size="sm" onClick={handleSaveAnamnesis} disabled={isSavingAnamnesis} className="gap-2">
            {isSavingAnamnesis ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Kaydet
          </Button>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={anamnesis}
            onChange={setAnamnesis}
            placeholder="Hasta anemnez bilgilerini buraya giriniz..."
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Visits List */}
      <Card>
        <CardHeader>
          <CardTitle>Muayeneler ({visits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Henüz muayene kaydı yok.
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => {
                const visitGA = episode.sat_date
                  ? calculateGA(episode.sat_date, visit.visit_date)
                  : null
                const displayGA = visit.ga_weeks !== null ? 
                  formatGA(visit.ga_weeks, visit.ga_days) : 
                  (visitGA ? formatGA(visitGA.weeks, visitGA.days) : "-")

                return (
                  <div
                    key={visit.id}
                    className="flex items-start justify-between rounded-lg border p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEditVisit(visit)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-semibold">
                          {new Date(visit.visit_date).toLocaleDateString("tr-TR")}
                        </div>
                        <Badge variant="outline">{displayGA}</Badge>
                        {visit.payment_done && (
                          <Badge variant="default" className="bg-green-600">Ödendi</Badge>
                        )}
                      </div>
                      {visit.topic && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Konu:</span> {visit.topic}
                        </div>
                      )}
                      {visit.weight_kg && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Kilo:</span> {visit.weight_kg} kg
                        </div>
                      )}
                      {(visit.bp_systolic && visit.bp_diastolic) && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Tansiyon:</span> {visit.bp_systolic}/{visit.bp_diastolic}
                        </div>
                      )}
                      {visit.exam_notes && (
                        <div
                          className="text-sm text-gray-600 mt-2 line-clamp-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: visit.exam_notes }}
                        />
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => {
                      e.stopPropagation()
                      handleEditVisit(visit)
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <VisitModal
        open={showVisitModal}
        onClose={() => {
          setShowVisitModal(false)
          setEditingVisit(null)
        }}
        episode={episode}
        visit={editingVisit}
        onSuccess={handleModalSuccess}
      />

      <OutcomeModal
        open={showOutcomeModal}
        onClose={() => setShowOutcomeModal(false)}
        episode={episode}
        existingOutcome={outcome}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
