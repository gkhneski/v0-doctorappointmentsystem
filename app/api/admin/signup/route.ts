import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role } = await request.json()

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if user already exists in admin_users table
    const { data: existingUser } = await supabaseAdmin
      .from("admin_users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı" }, { status: 409 })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
      },
    })

    if (authError) {
      // Check if error is due to duplicate email
      if (authError.message.includes("already registered") || authError.message.includes("duplicate")) {
        return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı" }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Kullanıcı oluşturulamadı" }, { status: 400 })
    }

    // Use upsert instead of insert to handle duplicate IDs gracefully
    const { error: upsertError } = await supabaseAdmin.from("admin_users").upsert(
      {
        id: authData.user.id,
        email,
        full_name: fullName,
        role: role,
      },
      {
        onConflict: "id",
      },
    )

    if (upsertError) {
      console.error("[v0] Admin user upsert error:", upsertError)
      // If upsert fails, try to clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: `Kayıt tamamlanamadı: ${upsertError.message}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json({ error: "Sunucu hatası oluştu" }, { status: 500 })
  }
}
