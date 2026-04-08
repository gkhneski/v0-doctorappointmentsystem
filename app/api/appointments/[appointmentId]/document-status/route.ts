import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function GET(request: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const { appointmentId } = await params
    const supabase = createServiceRoleClient()

    // Form kontrolü
    const { data: form } = await supabase
      .from("appointment_forms")
      .select("id")
      .eq("appointment_id", appointmentId)
      .maybeSingle()

    // Evrak kontrolü
    const { data: documents } = await supabase
      .from("patient_documents")
      .select("id")
      .eq("appointment_id", appointmentId)

    return NextResponse.json({
      hasForm: !!form,
      documentCount: documents?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Error checking document status:", error)
    return NextResponse.json({ hasForm: false, documentCount: 0 }, { status: 500 })
  }
}
