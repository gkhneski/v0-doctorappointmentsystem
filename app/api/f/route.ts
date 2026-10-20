import { type NextRequest, NextResponse } from "next/server"
import { validateAppointmentToken } from "@/lib/generate-appointment-token"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("t")

  console.log("API /f - Token received:", token)

  if (!token) {
    console.log("No token provided")
    return NextResponse.redirect(new URL("/error?msg=token-missing", request.url))
  }

  try {
    const tokenData = await validateAppointmentToken(token)

    console.log("Token validation result:", tokenData)

    if (!tokenData) {
      console.log("Invalid or expired token")
      return NextResponse.redirect(new URL("/error?msg=token-invalid", request.url))
    }

    const appointmentId = tokenData.appointments?.id
    const redirectUrl = new URL("/patient-form", request.url)
    redirectUrl.searchParams.set("aid", appointmentId)
    redirectUrl.searchParams.set("t", token)

    console.log("Redirecting to:", redirectUrl.toString())

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.redirect(new URL("/error?msg=server-error", request.url))
  }
}
