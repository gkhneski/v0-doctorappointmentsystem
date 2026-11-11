import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin({ role: "doktor" })
  if (!gate.ok) return gate.response

  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { name, content } = await request.json()

    if (!name || !content) {
      return NextResponse.json({ error: "Tüm alanlar gerekli" }, { status: 400 })
    }

    const supabaseAdmin = await createServiceRoleClient()

    const { data, error } = await supabaseAdmin
      .from("message_templates")
      .update({ name, content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin({ role: "doktor" })
  if (!gate.ok) return gate.response

  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const supabaseAdmin = await createServiceRoleClient()

    const { error } = await supabaseAdmin.from("message_templates").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
