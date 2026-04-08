import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: getUser() validates the JWT with Supabase servers
  // This also refreshes the session if needed
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      const isTokenError =
        error.message?.includes("Refresh Token") ||
        error.message?.includes("refresh_token") ||
        (error as { code?: string }).code === "refresh_token_not_found"

      if (isTokenError) {
        // Delete all Supabase auth cookies from the browser by setting them to empty with maxAge=0
        const clearResponse = NextResponse.redirect(new URL("/auth/admin/login?ref=ec25", request.url))
        request.cookies.getAll().forEach(({ name }) => {
          if (name.startsWith("sb-")) {
            clearResponse.cookies.set(name, "", { maxAge: 0, path: "/" })
          }
        })
        return clearResponse
      }
    } else {
      user = data.user
    }
  } catch {
    // Session error — treat as unauthenticated
  }

  // Protect patient routes
  if (request.nextUrl.pathname.startsWith("/patient") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/patient/login"
    return NextResponse.redirect(url)
  }

  // Protect admin routes — redirect to gizli login URL
  if (request.nextUrl.pathname.startsWith("/admin") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/admin/login"
    url.search = "?ref=ec25"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
