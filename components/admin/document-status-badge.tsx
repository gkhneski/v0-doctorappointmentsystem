"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"

interface DocumentStatusBadgeProps {
  appointmentId: string
}

export default function DocumentStatusBadge({ appointmentId }: DocumentStatusBadgeProps) {
  const [status, setStatus] = useState<"complete" | "partial" | "none" | "loading">("loading")

  useEffect(() => {
    async function checkDocumentStatus() {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/document-status`)
        if (!response.ok) {
          setStatus("none")
          return
        }
        const data = await response.json()

        if (data.hasForm && data.documentCount > 0) {
          setStatus("complete")
        } else if (data.hasForm || data.documentCount > 0) {
          setStatus("partial")
        } else {
          setStatus("none")
        }
      } catch (error) {
        console.error("[v0] Error checking document status:", error)
        setStatus("none")
      }
    }

    checkDocumentStatus()
  }, [appointmentId])

  if (status === "loading") {
    return <Badge variant="outline">...</Badge>
  }

  if (status === "complete") {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Tamamlandı
      </Badge>
    )
  }

  if (status === "partial") {
    return (
      <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
        <AlertCircle className="mr-1 h-3 w-3" />
        Kısmi
      </Badge>
    )
  }

  return (
    <Badge variant="destructive">
      <XCircle className="mr-1 h-3 w-3" />
      Yok
    </Badge>
  )
}
