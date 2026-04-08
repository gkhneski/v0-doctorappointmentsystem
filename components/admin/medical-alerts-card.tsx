"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Plus, X, Heart } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface MedicalAlert {
  type: string
  severity: "low" | "moderate" | "high" | "critical"
  notes?: string
}

interface MedicalAlertsCardProps {
  alerts: MedicalAlert[]
  onUpdate: (alerts: MedicalAlert[]) => Promise<void>
  editMode: boolean
}

const ALERT_TYPES = [
  "Diyabet (Şeker Hastalığı)",
  "Hipertansiyon (Tansiyon)",
  "Kalp Hastalığı",
  "Astım",
  "Epilepsi",
  "Böbrek Hastalığı",
  "Karaciğer Hastalığı",
  "Tiroid Hastalığı",
  "Kanser",
  "Hemofili",
  "Anemi",
  "Alerjik Reaksiyon",
  "Diğer",
]

const SEVERITY_CONFIG = {
  low: { label: "Düşük", color: "bg-blue-100 text-blue-800 border-blue-300" },
  moderate: { label: "Orta", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  high: { label: "Yüksek", color: "bg-orange-100 text-orange-800 border-orange-300" },
  critical: { label: "Kritik", color: "bg-red-100 text-red-800 border-red-300 animate-pulse" },
}

export function MedicalAlertsCard({ alerts, onUpdate, editMode }: MedicalAlertsCardProps) {
  const [localAlerts, setLocalAlerts] = useState<MedicalAlert[]>(alerts || [])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAlert, setNewAlert] = useState<MedicalAlert>({
    type: "",
    severity: "moderate",
    notes: "",
  })

  const handleAddAlert = () => {
    if (!newAlert.type) {
      toast({ title: "Hata", description: "Lütfen bir hastalık tipi seçin", variant: "destructive" })
      return
    }
    const updated = [...localAlerts, newAlert]
    setLocalAlerts(updated)
    onUpdate(updated)
    setNewAlert({ type: "", severity: "moderate", notes: "" })
    setShowAddForm(false)
    toast({ title: "Başarılı", description: "Tıbbi uyarı eklendi" })
  }

  const handleRemoveAlert = (index: number) => {
    const updated = localAlerts.filter((_, i) => i !== index)
    setLocalAlerts(updated)
    onUpdate(updated)
    toast({ title: "Başarılı", description: "Tıbbi uyarı kaldırıldı" })
  }

  const hasCriticalAlerts = localAlerts.some((alert) => alert.severity === "critical" || alert.severity === "high")

  return (
    <Card className={`${hasCriticalAlerts ? "border-2 border-red-500 shadow-lg" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className={`h-5 w-5 ${hasCriticalAlerts ? "text-red-600 animate-pulse" : "text-gray-600"}`} />
            <CardTitle className="text-base">Tıbbi Uyarılar / Kronik Hastalıklar</CardTitle>
          </div>
          {editMode && (
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ekle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {localAlerts.length === 0 && !showAddForm && (
          <p className="text-sm text-gray-500 text-center py-4">Kayıtlı tıbbi uyarı bulunmuyor</p>
        )}

        {localAlerts.map((alert, index) => {
          const severityConfig = SEVERITY_CONFIG[alert.severity]
          return (
            <div
              key={index}
              className={`flex items-start justify-between gap-3 p-3 rounded-lg border-2 ${severityConfig.color}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {alert.severity === "critical" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  <span className="font-semibold text-sm">{alert.type}</span>
                  <Badge variant="outline" className="text-xs">
                    {severityConfig.label}
                  </Badge>
                </div>
                {alert.notes && <p className="text-xs text-gray-700 mt-1">{alert.notes}</p>}
              </div>
              {editMode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveAlert(index)}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })}

        {showAddForm && editMode && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Hastalık Tipi</label>
              <Select value={newAlert.type} onValueChange={(value) => setNewAlert({ ...newAlert, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Önem Derecesi</label>
              <Select
                value={newAlert.severity}
                onValueChange={(value: any) => setNewAlert({ ...newAlert, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="moderate">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="critical">Kritik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Notlar (Opsiyonel)</label>
              <Textarea
                value={newAlert.notes}
                onChange={(e) => setNewAlert({ ...newAlert, notes: e.target.value })}
                placeholder="İlaç, tedavi detayları vb."
                className="min-h-[60px] text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleAddAlert} className="flex-1">
                Ekle
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                İptal
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
