import "server-only"

import { createHash } from "node:crypto"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

type AuditEvent = {
  patientId?: string | null
  appointmentId: string
  eventType: "reminder_sent" | "link_opened"
  occurredAt?: string
  patientName: string
  patientPhone?: string | null
  appointmentDate?: string | null
  appointmentTime?: string | null
  messageText?: string | null
  channel?: string | null
  deliveryStatus?: string | null
  providerReference?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

export function getRequestEvidence(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return {
    ipAddress: forwarded || headers.get("x-real-ip") || null,
    userAgent: headers.get("user-agent")?.slice(0, 1000) || null,
  }
}

export async function recordAppointmentAudit(event: AuditEvent) {
  const occurredAt = event.occurredAt || new Date().toISOString()
  const eventHash = createHash("sha256")
    .update(
      [event.appointmentId, event.eventType, occurredAt, event.patientName, event.ipAddress || "", event.userAgent || ""].join("|"),
    )
    .digest("hex")

  const supabase = createServiceRoleClient()
  const { error } = await supabase.from("appointment_audit_events").insert({
    patient_id: event.patientId || null,
    appointment_id: event.appointmentId,
    event_type: event.eventType,
    occurred_at: occurredAt,
    patient_name_snapshot: event.patientName,
    patient_phone_snapshot: event.patientPhone || null,
    appointment_date_snapshot: event.appointmentDate || null,
    appointment_time_snapshot: event.appointmentTime || null,
    message_text: event.messageText || null,
    channel: event.channel || null,
    delivery_status: event.deliveryStatus || null,
    provider_reference: event.providerReference || null,
    ip_address: event.ipAddress || null,
    user_agent: event.userAgent || null,
    event_hash: eventHash,
  })

  if (error) throw error
}
