"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bot, ChevronRight } from "lucide-react"
import AppointmentWizardModal from "./appointment-wizard-modal"

type SelectedSlot = {
  date: string
  time: string
  appointmentTypeId: string
  appointmentTypeLabel: string
  patientName: string
  doctorId: string
}

type Props = {
  onSlotSelected?: (slot: SelectedSlot) => void
  onClose?: () => void
  standalone?: boolean
}

type Step = "name" | "type" | "slots" | "confirm"

type SlotOption = {
  date: string
  time: string
  label: string
}

const APPOINTMENT_TYPES = [
  { id: "gebelik-takibi", label: "Gebelik Takibi" },
  { id: "ayrintili-fetal-ultrason", label: "Ayrıntılı Fetal Ultrason" },
  { id: "gebelik-istemi-infertilite", label: "Gebelik İstemi / İnfertilite" },
  { id: "asilama-tup-bebek", label: "Aşılama / Tüp Bebek" },
  { id: "kontrol-takip", label: "Kontrol / Takip" },
  { id: "jinekolojik-muayene", label: "Jinekolojik Muayene" },
]

type Message = {
  id: string
  role: "assistant" | "user"
  text: string
}

export default function AiRandevuChat({ onSlotSelected, standalone = false }: Props) {
  const [step, setStep] = useState<Step>("name")
  const [showWizard, setShowWizard] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [patientName, setPatientName] = useState("")
  const [selectedType, setSelectedType] = useState<{ id: string; label: string } | null>(null)
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [slotsOffset, setSlotsOffset] = useState(0)
  const [hasMoreSlots, setHasMoreSlots] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Merhaba, hos geldiniz!\n\nBen Prof. Dr. Eray Caliskan'in randevu asistaniyim. Size yardimci olmaktan mutluluk duyarim.\n\nSizinle tanismak isterim, adinizi ve soyadinizi ogrenebilir miyim?",
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, step, slots, loading])

  useEffect(() => {
    setTimeout(() => nameInputRef.current?.focus(), 300)
  }, [])

  const addMessage = (role: "assistant" | "user", text: string) => {
    setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, text }])
  }

  // Sadece ilk ismi al (ornegin "Demet Eski" -> "Demet")
  const getFirstName = (fullName: string) => fullName.split(" ")[0]

  const handleNameSubmit = () => {
    const name = nameInput.trim()
    if (!name) return
    setPatientName(name)
    const firstName = getFirstName(name)
    addMessage("user", name)
    addMessage(
      "assistant",
      `Merhaba ${firstName} Hanim, tanistigimiza cok memnun oldum!\n\nSagliginiz bizim icin cok degerli. Hangi konuda randevu almak istersiniz?`,
    )
    setStep("type")
  }

  const fetchSlots = async (typeId: string, offset: number = 0, showMessage: boolean = true) => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai-randevu/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentTypeId: typeId, offsetDays: offset }),
      })
      const data = await res.json()
      const slotList: SlotOption[] = (data.slots || []).slice(0, 5)
      setSlots(slotList)
      setSlotsOffset(offset)
      setHasMoreSlots(data.hasMore || false)

      if (slotList.length === 0 && offset === 0) {
        addMessage("assistant", "Su an icin musait randevu saati bulunamadi ama merak etmeyin! Sekreterimiz size yardimci olacaktir: 0531 080 47 20")
      } else if (slotList.length === 0) {
        addMessage("assistant", "Bu donemde musait randevu kalmamis. Sekreterimizi arayabilirsiniz: 0531 080 47 20")
      } else if (showMessage) {
        addMessage("assistant", "Iste size uygun randevu saatlerimiz! Hangi zaman sizin icin daha uygun olur?")
        setStep("slots")
      }
    } catch {
      addMessage("assistant", "Bir aksilik oldu ama endiselenmeyin! Lutfen tekrar deneyin veya sekreterimizi arayin: 0531 080 47 20")
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = async (type: { id: string; label: string }) => {
    setSelectedType(type)
    addMessage("user", type.label)
    addMessage("assistant", `${type.label} icin size en uygun randevu saatlerini hemen buluyorum...`)
    await fetchSlots(type.id, 0)
  }

  const handleLoadMoreSlots = async () => {
    if (!selectedType) return
    addMessage("assistant", "Daha ileri tarihlerdeki randevulara bakiyorum...")
    await fetchSlots(selectedType.id, slotsOffset + 30, false)
  }

  const handleSlotSelect = (slot: SlotOption) => {
    if (!selectedType) return
    const confirmed: SelectedSlot = {
      date: slot.date,
      time: slot.time,
      appointmentTypeId: selectedType.id,
      appointmentTypeLabel: selectedType.label,
      patientName,
      doctorId: "",
    }
    setSelectedSlot(confirmed)
    addMessage("user", slot.label)
    addMessage(
      "assistant",
      `Harika secim ${getFirstName(patientName)} Hanim! Randevunuz neredeyse hazir. Son adim olarak asagidaki butona tiklayarak bilgilerinizi tamamlayabilirsiniz. Sizi muayenehanemizde gormek icin sabırsizlaniyoruz!`,
    )
    setStep("confirm")
  }

  const handleGoToForm = () => {
    if (!selectedSlot) return
    if (onSlotSelected) {
      onSlotSelected(selectedSlot)
    } else {
      // Standalone mode: open wizard modal directly
      setShowWizard(true)
    }
  }

  // Cute baby-themed SVG pattern (onesies, bottles, hearts, socks)
  const babyPattern = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2393c5fd' stroke-width='1' stroke-opacity='0.5'%3E%3C!-- Baby bottle --%3E%3Cpath d='M12 8v2h4v-2h-4zm0 2v6c0 1 1 2 2 2h0c1 0 2-1 2-2v-6'/%3E%3C!-- Heart --%3E%3Cpath d='M35 12c-1-2-4-2-5 0-1-2-4-2-5 0 0 3 5 6 5 6s5-3 5-6z'/%3E%3C!-- Onesie --%3E%3Cpath d='M58 5h8l2 4-3 1v10h-6v-10l-3-1z'/%3E%3C!-- Sock --%3E%3Cpath d='M10 35v8c0 2 2 3 4 3h2c2 0 2-2 2-3v-4h-4v-4z'/%3E%3C!-- Pacifier --%3E%3Ccircle cx='35' cy='40' r='4'/%3E%3Cellipse cx='35' cy='38' rx='2' ry='1'/%3E%3C!-- Rattle --%3E%3Ccircle cx='62' cy='38' r='5'/%3E%3Cpath d='M62 43v6'/%3E%3C!-- Star --%3E%3Cpath d='M15 62l1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5z'/%3E%3C!-- Small heart --%3E%3Cpath d='M42 65c-.5-1-2-1-2.5 0-.5-1-2-1-2.5 0 0 1.5 2.5 3 2.5 3s2.5-1.5 2.5-3z'/%3E%3C!-- Baby footprint --%3E%3Cellipse cx='62' cy='65' rx='3' ry='5'/%3E%3Ccircle cx='58' cy='61' r='1'/%3E%3Ccircle cx='60' cy='59' r='1'/%3E%3Ccircle cx='62' cy='58' r='1'/%3E%3Ccircle cx='64' cy='59' r='1'/%3E%3Ccircle cx='66' cy='61' r='1'/%3E%3C/g%3E%3C/svg%3E")`

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Floating animated icons in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute text-pink-300 text-2xl animate-float-slow" style={{ top: '10%', left: '5%' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div className="absolute text-cyan-300 text-xl animate-float-medium" style={{ top: '30%', right: '8%' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2L9 9H2l6 4.5L5.5 22 12 17l6.5 5-2.5-8.5L22 9h-7L12 2z"/>
          </svg>
        </div>
        <div className="absolute text-pink-200 text-lg animate-float-fast" style={{ bottom: '25%', left: '10%' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div className="absolute text-blue-200 text-xl animate-float-slow" style={{ bottom: '40%', right: '15%' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2L9 9H2l6 4.5L5.5 22 12 17l6.5 5-2.5-8.5L22 9h-7L12 2z"/>
          </svg>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="relative flex-1 overflow-y-auto px-4 py-3 space-y-3"
        style={{ backgroundImage: babyPattern, backgroundColor: "#f0f9ff" }}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user"
          return (
            <div 
              key={msg.id} 
              className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {!isUser && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-cyan-400 mt-0.5 shadow-md animate-in zoom-in duration-200">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl text-sm leading-relaxed px-4 py-3 shadow-sm ${
                  isUser
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-tr-sm"
                    : "bg-white/90 backdrop-blur-sm text-foreground rounded-tl-sm border border-pink-100"
                }`}
              >
                {msg.text.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          )
        })}

        {/* Loading dots */}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Randevu tipi butonları */}
        {step === "type" && !loading && (
          <div className="space-y-2 pl-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {APPOINTMENT_TYPES.map((type, idx) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                className="group flex w-full items-center justify-between rounded-2xl border-2 border-pink-200/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-left text-sm font-medium shadow-sm transition-all duration-200 hover:border-pink-400 hover:bg-gradient-to-r hover:from-pink-50 hover:to-cyan-50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <span className="group-hover:text-pink-600 transition-colors">{type.label}</span>
                <ChevronRight className="h-4 w-4 text-pink-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Slot butonları */}
        {step === "slots" && !loading && (
          <div className="space-y-2 pl-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => handleSlotSelect(slot)}
                className="group flex w-full items-center justify-between rounded-2xl border-2 border-cyan-200/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-left text-sm font-medium shadow-sm transition-all duration-200 hover:border-cyan-400 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-pink-50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="group-hover:text-cyan-600 transition-colors">{slot.label}</span>
                <ChevronRight className="h-4 w-4 text-cyan-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </button>
            ))}
            {hasMoreSlots && (
              <button
                onClick={handleLoadMoreSlots}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-300/50 bg-gradient-to-r from-pink-50/50 to-cyan-50/50 px-4 py-3 text-sm font-medium text-pink-500 transition-all hover:border-pink-400 hover:from-pink-100/50 hover:to-cyan-100/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Daha ileri tarihlere bak</span>
                <span className="animate-bounce">↓</span>
              </button>
            )}
          </div>
        )}

        {/* Onay kartı */}
        {step === "confirm" && selectedSlot && (
          <div className="mx-1 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <p className="text-sm font-semibold text-primary">Randevu Ozeti</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ad Soyad</span>
                <span className="font-medium">{selectedSlot.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Randevu Tipi</span>
                <span className="font-medium text-right max-w-[60%]">{selectedSlot.appointmentTypeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarih</span>
                <span className="font-medium">
                  {new Date(selectedSlot.date).toLocaleDateString("tr-TR", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saat</span>
                <span className="font-medium">{selectedSlot.time}</span>
              </div>
            </div>
            <Button className="w-full mt-1" onClick={handleGoToForm}>
              Formu Tamamla ve Onayla
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Ad soyad girisi */}
      {step === "name" && (
        <div className="border-t px-4 py-3 flex gap-2">
          <input
            ref={nameInputRef}
            className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            placeholder="Ad Soyad..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
          />
          <Button
            size="sm"
            onClick={handleNameSubmit}
            disabled={!nameInput.trim()}
            className="rounded-xl px-4"
          >
            Devam
          </Button>
        </div>
      )}

      {/* Wizard Modal - opens directly when "Formu Tamamla" is clicked */}
      {showWizard && selectedSlot && (
        <AppointmentWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          selectedSlot={{
            date: selectedSlot.date,
            time: selectedSlot.time,
            doctorId: "8d8e6b45-ed47-4e79-be36-5f1bce4203e6", // Prof. Dr. Eray Çalışkan
          }}
          doctorName="Prof. Dr. Eray Çalışkan"
          onSuccess={() => {
            setShowWizard(false)
            // Reset chat state
            setStep("name")
            setNameInput("")
            setPatientName("")
            setSelectedType(null)
            setSlots([])
            setSelectedSlot(null)
            setMessages([{
              id: "welcome",
              role: "assistant",
              text: "Merhaba, hos geldiniz!\n\nBen Prof. Dr. Eray Caliskan'in randevu asistaniyim. Size yardimci olmaktan mutluluk duyarim.\n\nSizinle tanismak isterim, adinizi ve soyadinizi ogrenebilir miyim?",
            }])
          }}
          preselectedType={selectedSlot.appointmentTypeId}
          prefilledName={selectedSlot.patientName}
        />
      )}
    </div>
  )
}
