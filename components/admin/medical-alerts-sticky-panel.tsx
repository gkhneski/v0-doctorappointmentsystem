"use client"

import { useState } from "react"
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

interface MedicalAlertsStickyPanelProps {
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
  critical: {
    label: "Kritik",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    textColor: "text-red-900",
    badgeColor: "bg-red-100 text-red-800",
    iconColor: "text-red-600",
  },
  high: {
    label: "Yüksek",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    textColor: "text-orange-900",
    badgeColor: "bg-orange-100 text-orange-800",
    iconColor: "text-orange-600",
  },
  moderate: {
    label: "Orta",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    textColor: "text-yellow-900",
    badgeColor: "bg-yellow-100 text-yellow-800",
    iconColor: "text-yellow-600",
  },
  low: {
    label: "Düşük",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    textColor: "text-blue-900",
    badgeColor: "bg-blue-100 text-blue-800",
    iconColor: "text-blue-600",
  },
}

// Sort alerts by severity
const sortBySeverity = (alerts: MedicalAlert[]) => {
  const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 }
  return [...alerts].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

export function MedicalAlertsStickyPanel({ alerts, onUpdate, editMode }: MedicalAlertsStickyPanelProps) {
  const [localAlerts, setLocalAlerts] = useState<MedicalAlert[]>(alerts || [])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAlert, setNewAlert] = useState<MedicalAlert>({
    type: "",
    severity: "moderate",
    notes: "",
  })

  const sortedAlerts = sortBySeverity(localAlerts)

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

  return (
    <>
      {/* Desktop: Sticky Right Panel */}
      <div className="hidden lg:block fixed right-6 top-24 w-80 xl:w-[360px]">
        <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Header */}
          <div className="bg-white rounded-t-2xl border-b p-4 shadow-sm sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Uyarılar</h3>
                <Badge variant="secondary" className="ml-1">
                  {sortedAlerts.length}
                </Badge>
              </div>
              {editMode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-b-2xl shadow-lg border border-t-0 p-4 space-y-3">
            {sortedAlerts.length === 0 && !showAddForm && (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Kayıtlı uyarı yok</p>
              </div>
            )}

            {/* Add Form */}
            {showAddForm && editMode && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 space-y-3 bg-gray-50">
                <Select value={newAlert.type} onValueChange={(value) => setNewAlert({ ...newAlert, type: value })}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Hastalık Tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALERT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newAlert.severity}
                  onValueChange={(value: any) => setNewAlert({ ...newAlert, severity: value })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="moderate">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="critical">Kritik</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  value={newAlert.notes}
                  onChange={(e) => setNewAlert({ ...newAlert, notes: e.target.value })}
                  placeholder="Notlar (Opsiyonel)"
                  className="min-h-[60px] text-sm"
                />

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddAlert} className="flex-1 text-xs">
                    Ekle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 text-xs"
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}

            {/* Speech Bubble Alerts */}
            {sortedAlerts.map((alert, index) => {
              const config = SEVERITY_CONFIG[alert.severity]
              // Tail color mapping based on severity
              const tailColorClass = {
                critical: "border-r-red-300",
                high: "border-r-orange-300",
                moderate: "border-r-yellow-300",
                low: "border-r-blue-300",
              }[alert.severity]

              return (
                <div key={index} className="relative">
                  {/* Speech bubble tail pointing left */}
                  <div
                    className={`absolute left-0 top-5 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] ${tailColorClass} -ml-[12px] z-10`}
                  />

                  {/* Speech bubble card */}
                  <div
                    className={`relative rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-3 shadow-sm transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          {alert.severity === "critical" && (
                            <AlertTriangle className={`h-4 w-4 mt-0.5 animate-pulse ${config.iconColor}`} />
                          )}
                          <div className="flex-1">
                            <p className={`font-semibold text-sm ${config.textColor}`}>{alert.type}</p>
                            <Badge variant="outline" className={`mt-1 text-xs ${config.badgeColor} border-0`}>
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                        {alert.notes && (
                          <p className={`text-xs ${config.textColor} opacity-90 leading-relaxed`}>{alert.notes}</p>
                        )}
                      </div>
                      {editMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveAlert(index)}
                          className="h-6 w-6 p-0 hover:bg-white/50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Bottom Mini Summary */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-sm text-gray-900">Uyarılar</span>
              <Badge variant="secondary" className="text-xs">
                {sortedAlerts.length}
              </Badge>
            </div>
          </div>
          {sortedAlerts.length === 0 ? (
            <p className="text-xs text-gray-500">Kayıtlı uyarı yok</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedAlerts.map((alert, index) => {
                const config = SEVERITY_CONFIG[alert.severity]
                return (
                  <div
                    key={index}
                    className={`flex-shrink-0 rounded-lg border ${config.borderColor} ${config.bgColor} px-3 py-1.5`}
                  >
                    <p className={`text-xs font-semibold ${config.textColor}`}>{alert.type}</p>
                    <Badge variant="outline" className={`text-xs ${config.badgeColor} border-0 mt-0.5`}>
                      {config.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
