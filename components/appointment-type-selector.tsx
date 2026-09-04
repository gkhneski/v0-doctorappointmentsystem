"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Heart, Baby, ChevronRight, Phone } from "lucide-react"
import WeeklyCalendar from "./weekly-calendar"

type Doctor = {
  id: string
  name: string
  specialization: string
  working_hours?: any
}

type Schedule = {
  id: string
  doctor_id: string
  schedule_date: string
  start_time: string
  end_time: string
  is_available: boolean
  doctors: Doctor
}

type ExistingAppointment = {
  doctor_id: string
  appointment_date: string
  appointment_time: string
}

type Props = {
  doctor: Doctor | null
  schedules: Schedule[]
  existingAppointments: ExistingAppointment[]
}

const APPOINTMENT_TYPES = [
  {
    id: "asilama-tup-bebek",
    title: "Aşılama / Tüp Bebek",
    description: "Tüp bebek tedavisi bağlantı randevusu ve aşılama işlemleri için (15 dakika)",
    icon: Calendar,
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: "ayrintili-fetal-ultrason",
    title: "Ayrıntılı (2. Düzey) Fetal Ultrason",
    description: "Detaylı fetal ultrason muayenesi ve anomali taraması",
    icon: Heart,
    color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    id: "gebelik-takibi",
    title: "Gebelik Takibi",
    description: "Gebelik kontrolü, ultrason ve rutin takipler için",
    icon: Baby,
    color: "bg-pink-50 border-pink-200 hover:bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    id: "gebelik-istemi-infertilite",
    title: "Gebelik İstemi / İnfertilite",
    description: "Gebelik planlaması ve infertilite danışmanlığı",
    icon: Heart,
    color: "bg-rose-50 border-rose-200 hover:bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    id: "jinekolojik-muayene",
    title: "Jinekolojik Muayene (Kadın Hastalıkları)",
    description: "Kadın hastalıkları muayenesi ve tedavisi",
    icon: Heart,
    color: "bg-teal-50 border-teal-200 hover:bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    id: "kontrol-takip",
    title: "Kontrol / Takip",
    description: "Genel muayene, kontrol randevusu veya takip muayenesi için",
    icon: Calendar,
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "acil-durum",
    title: "Acil Durum Randevusu",
    description: "Acil durumlar için hızlı randevu",
    icon: Heart,
    color: "bg-red-50 border-red-200 hover:bg-red-100",
    iconColor: "text-red-600",
  },
]

export default function AppointmentTypeSelector({ doctor, schedules, existingAppointments }: Props) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyStep, setEmergencyStep] = useState<"sekreter" | "hemsire1" | "hemsire2">("sekreter")

  const handleTypeSelect = (typeId: string) => {
    if (typeId === "acil-durum") {
      setSelectedType(typeId)
      setShowEmergencyModal(true)
      setEmergencyStep("sekreter")
    } else {
      setSelectedType(typeId)
      setShowCalendar(true)
    }
  }

  const handleBackToTypes = () => {
    setShowCalendar(false)
    setSelectedType(null)
  }

  if (showCalendar && selectedType) {
    return (
      <div>
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToTypes} className="mb-4">
            ← Randevu Tipi Değiştir
          </Button>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Seçilen Randevu Tipi:</p>
            <p className="font-semibold">
              {APPOINTMENT_TYPES.find((t) => t.id === selectedType)?.title}
            </p>
          </div>
        </div>
        <WeeklyCalendar
          doctor={doctor}
          schedules={schedules}
          existingAppointments={existingAppointments}
          preselectedType={selectedType}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Randevu Tipi Seçin</CardTitle>
          <CardDescription>
            Lütfen önce randevu tipini seçin, ardından müsait tarih ve saatleri görebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {APPOINTMENT_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`group relative rounded-xl border-2 p-6 text-left transition-all hover:shadow-lg ${type.color}`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className={`rounded-lg bg-white p-3 shadow-sm ${type.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <h3 className="mb-2 font-semibold">{type.title}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Appointment Modal */}
      <Dialog open={showEmergencyModal} onOpenChange={setShowEmergencyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <Phone className="h-6 w-6" />
              ACİL DURUM
            </DialogTitle>
            <DialogDescription>
              Acil durumlar için lütfen aşağıdaki numaralardan biri ile iletişime geçin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {emergencyStep === "sekreter" && (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
                  <p className="text-sm text-muted-foreground mb-2">Öncelikle Sekreteri Arayınız:</p>
                  <a
                    href="tel:05310804720"
                    className="text-4xl font-bold text-red-600 hover:text-red-700 block"
                  >
                    0531 080 47 20
                  </a>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEmergencyModal(false)}
                  >
                    Kapat
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => setEmergencyStep("hemsire1")}
                  >
                    Ulaşılamadı
                  </Button>
                </div>
              </div>
            )}

            {emergencyStep === "hemsire1" && (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
                  <p className="text-sm text-muted-foreground mb-2">Hemşire 1'i Arayınız:</p>
                  <a
                    href="tel:05331427261"
                    className="text-4xl font-bold text-red-600 hover:text-red-700 block"
                  >
                    0533 142 72 61
                  </a>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEmergencyStep("sekreter")}
                  >
                    Geri
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => setEmergencyStep("hemsire2")}
                  >
                    Ulaşılamadı
                  </Button>
                </div>
              </div>
            )}

            {emergencyStep === "hemsire2" && (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
                  <p className="text-sm text-muted-foreground mb-2">Hemşire 2'yi Arayınız:</p>
                  <a
                    href="tel:05377881331"
                    className="text-4xl font-bold text-red-600 hover:text-red-700 block"
                  >
                    0537 788 13 31
                  </a>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEmergencyStep("hemsire1")}
                  >
                    Geri
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      setShowEmergencyModal(false)
                      setEmergencyStep("sekreter")
                    }}
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
