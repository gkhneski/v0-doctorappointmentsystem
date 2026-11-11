import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/require-admin"

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("predefined_lists")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  try {
    const { name, category, items } = await request.json()

    if (!name || !category || !items) {
      return NextResponse.json({ error: "Tüm alanlar gerekli" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("predefined_lists")
      .insert({ name, category, items })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
