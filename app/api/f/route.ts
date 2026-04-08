import { type NextRequest, NextResponse } from "next/server"
import { validateAppointmentToken } from "@/lib/generate-appointment-token"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("t")

  console.log("[v0] API /f - Token received:", token)

  if (!token) {
    console.log("[v0] No token provided")
    return NextResponse.redirect(new URL("/error?msg=token-missing", request.url))
  }

  try {
    const tokenData = await validateAppointmentToken(token)

    console.log("[v0] Token validation result:", tokenData)

    if (!tokenData) {
      console.log("[v0] Invalid or expired token")
      return NextResponse.redirect(new URL("/error?msg=token-invalid", request.url))
    }

    const appointmentId = tokenData.appointments?.id
    const redirectUrl = new URL("/patient-form", request.url)
    redirectUrl.searchParams.set("aid", appointmentId)
    redirectUrl.searchParams.set("t", token)

    console.log("[v0] Redirecting to:", redirectUrl.toString())

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("[v0] Token validation error:", error)
    return NextResponse.redirect(new URL("/error?msg=server-error", request.url))
  }
}
