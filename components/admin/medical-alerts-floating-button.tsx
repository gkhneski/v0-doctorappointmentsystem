"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Plus, X, Heart } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface MedicalAlert {
  type: string
  severity: "low" | "moderate" | "high" | "critical"
  notes?: string
}

interface MedicalAlertsFloatingButtonProps {
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

export function MedicalAlertsFloatingButton({
  alerts,
  onUpdate,
  editMode,
}: MedicalAlertsFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newAlert, setNewAlert] = useState<MedicalAlert>({
    type: "",
    severity: "moderate",
    notes: "",
  })

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  const handleAddAlert = async () => {
    if (!newAlert.type) {
      toast({ title: "Hata", description: "Lütfen hastalık türü seçin", variant: "destructive" })
      return
    }

    const updatedAlerts = [...alerts, newAlert]
    await onUpdate(updatedAlerts)
    setNewAlert({ type: "", severity: "moderate", notes: "" })
    toast({ title: "Başarılı", description: "Tıbbi uyarı eklendi" })
  }

  const handleDeleteAlert = async (index: number) => {
    const updatedAlerts = alerts.filter((_, i) => i !== index)
    await onUpdate(updatedAlerts)
    toast({ title: "Başarılı", description: "Tıbbi uyarı silindi" })
  }

  const hasCriticalAlerts = alerts.some((alert) => alert.severity === "critical")
  const hasHighAlerts = alerts.some((alert) => alert.severity === "high")

  // Button color based on highest severity
  const buttonColor = hasCriticalAlerts
    ? "bg-red-600 hover:bg-red-700"
    : hasHighAlerts
      ? "bg-orange-600 hover:bg-orange-700"
      : alerts.length > 0
        ? "bg-yellow-600 hover:bg-yellow-700"
        : "bg-gray-400 hover:bg-gray-500"

  return (
    <>
      {/* Floating Button - Bottom Right like WhatsApp */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 ${buttonColor} text-white rounded-full p-4 shadow-2xl z-50 transition-all hover:scale-110 flex items-center gap-3 group`}
        aria-label="Tıbbi Uyarılar"
      >
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 animate-heartbeat" />
          {alerts.length > 0 && (
            <span className="bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {alerts.length}
            </span>
          )}
        </div>
        <span className="hidden group-hover:inline-block whitespace-nowrap font-medium">
          {alerts.length > 0 ? "Kronik Hastalıklar Var" : "Uyarı Yok"}
        </span>
      </button>

      {/* Modal Dialog - Compact Size */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Tıbbi Uyarılar / Kronik Hastalıklar
              {alerts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {alerts.length} Uyarı
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Existing Alerts */}
            {sortedAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Henüz tıbbi uyarı eklenmemiş</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedAlerts.map((alert, index) => {
                  const config = SEVERITY_CONFIG[alert.severity]
                  const tailColorClass = {
                    critical: "border-r-red-300",
                    high: "border-r-orange-300",
                    moderate: "border-r-yellow-300",
                    low: "border-r-blue-300",
                  }[alert.severity]

                  return (
                    <div key={index} className="relative">
                      {/* Speech bubble tail */}
                      <div
                        className={`absolute left-0 top-5 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] ${tailColorClass} -ml-[12px] z-10`}
                      />

                      {/* Alert card - Compact */}
                      <div
                        className={`relative rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-3 shadow-sm`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <AlertTriangle className={`w-4 h-4 mt-0.5 ${config.iconColor} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`font-semibold text-sm ${config.textColor}`}>{alert.type}</h4>
                                <Badge className={`${config.badgeColor} text-xs`}>{config.label}</Badge>
                              </div>
                              {alert.notes && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alert.notes}</p>
                              )}
                            </div>
                          </div>
                          {editMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAlert(alerts.indexOf(alert))}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add New Alert Form */}
            {editMode && (
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Yeni Uyarı Ekle
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Hastalık Türü</label>
                    <Select value={newAlert.type} onValueChange={(value) => setNewAlert({ ...newAlert, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
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

                  <div>
                    <label className="text-sm font-medium mb-2 block">Öncelik Seviyesi</label>
                    <Select
                      value={newAlert.severity}
                      onValueChange={(value: any) => setNewAlert({ ...newAlert, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Kritik</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="moderate">Orta</SelectItem>
                        <SelectItem value="low">Düşük</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notlar (Opsiyonel)</label>
                    <Textarea
                      value={newAlert.notes}
                      onChange={(e) => setNewAlert({ ...newAlert, notes: e.target.value })}
                      placeholder="Ek bilgiler veya özel notlar"
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleAddAlert} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Uyarı Ekle
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
