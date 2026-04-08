import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all staff
    const { data: staff, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("Staff fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { full_name, email, password, role } = await request.json()

    // Validate input
    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır" }, { status: 400 })
    }

    if (!["doktor", "sekreter", "hemsire"].includes(role)) {
      return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 })
    }

    // Create admin client with service role key
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingAuthUser?.users?.find((u) => u.email === email)

    let userId: string

    if (userExists) {
      // User zaten auth.users'da var, sadece admin_users'a ekle
      userId = userExists.id

      // Check if already in admin_users
      const { data: existingAdminUser } = await supabaseAdmin.from("admin_users").select("*").eq("id", userId).single()

      if (existingAdminUser) {
        return NextResponse.json({ error: "Bu kullanıcı zaten kayıtlı" }, { status: 400 })
      }
    } else {
      // Create new auth user with metadata
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          display_name: full_name,
        },
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      if (!authData.user) {
        return NextResponse.json({ error: "Kullanıcı oluşturulamadı" }, { status: 400 })
      }

      userId = authData.user.id
    }

    // Insert into admin_users table
    const { error: insertError } = await supabaseAdmin.from("admin_users").insert({
      id: userId,
      full_name,
      email,
      role,
    })

    if (insertError) {
      // Only rollback if we just created the user
      if (!userExists) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({
      message: "Personel başarıyla eklendi",
      userId,
    })
  } catch (error) {
    console.error("Staff creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
