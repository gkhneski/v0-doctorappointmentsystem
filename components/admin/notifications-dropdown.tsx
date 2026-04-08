"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

type Notification = {
  id: string
  type: "confirmed" | "cancelled" | "pending" | "reminder_sent"
  patient_name: string
  appointment_date: string
  appointment_time: string
  timestamp: string
  read: boolean
}

type Appointment = {
  id: string
  appointment_date: string
  appointment_time: string
  confirmation_status: string | null
  confirmed_at: string | null
  reminder_sent_at: string | null
  link_clicked_at: string | null
  patients: {
    full_name: string
  } | null
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    const supabase = createClient()
    
    // Son 7 gundeki onay/iptal bildirimleri
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // Sadece gercekten cevap vermis hastalar (confirmed veya cancelled, pending degil)
    const { data: appointments } = await supabase
      .from("appointments")
      .select(`
        id, appointment_date, appointment_time, 
        confirmation_status, confirmed_at, reminder_sent_at, link_clicked_at,
        patients (full_name)
      `)
      .not("reminder_sent_at", "is", null)  // SMS gonderilmis olmali
      .not("link_clicked_at", "is", null)  // Link tiklanmis olmali
      .in("confirmation_status", ["confirmed", "cancelled"])  // Sadece confirmed veya cancelled
      .gte("confirmed_at", sevenDaysAgo.toISOString())  // Son 7 gun
      .order("confirmed_at", { ascending: false })
      .limit(20)

    if (appointments) {
      const notifs: Notification[] = (appointments as Appointment[]).map(apt => ({
        id: apt.id,
        type: apt.confirmation_status === "confirmed" ? "confirmed" : "cancelled",
        patient_name: apt.patients?.full_name || "Bilinmeyen Hasta",
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        timestamp: apt.confirmed_at || "",
        read: false,
      }))
      setNotifications(notifs)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("tr-TR", { 
      day: "numeric", month: "short" 
    })
  }

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || ""
  }

  const formatTimestamp = (ts: string) => {
    if (!ts) return ""
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Az once"
    if (diffMins < 60) return `${diffMins} dk once`
    if (diffHours < 24) return `${diffHours} saat once`
    return `${diffDays} gun once`
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Hasta Onay Bildirimleri</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Son 7 gundeki hasta cevaplari
          </p>
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Henuz bildirim yok</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-3 hover:bg-muted/50 transition-colors ${
                  notif.type === "confirmed" ? "border-l-2 border-l-green-500" : "border-l-2 border-l-red-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-full ${
                    notif.type === "confirmed" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {notif.type === "confirmed" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{notif.patient_name}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(notif.timestamp)}
                      </span>
                    </div>
                    <p className={`text-xs font-medium mt-0.5 ${
                      notif.type === "confirmed" ? "text-green-600" : "text-red-600"
                    }`}>
                      {notif.type === "confirmed" ? "Gelecegini onayladi" : "Gelemeyecegini bildirdi"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDate(notif.appointment_date)} - {formatTime(notif.appointment_time)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="p-2 border-t bg-muted/30">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setOpen(false)}>
            Tum bildirimleri gördüm
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
