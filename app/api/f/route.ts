import { type NextRequest, NextResponse } from "next/server"
import { validateAppointmentToken } from "@/lib/generate-appointment-token"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("t")

  if (!token) {
    return NextResponse.redirect(new URL("/error?msg=token-missing", request.url))
  }

  try {
    const tokenData = await validateAppointmentToken(token)

    if (!tokenData) {
      return NextResponse.redirect(new URL("/error?msg=token-invalid", request.url))
    }

    const appointmentId = tokenData.appointments?.id
    const redirectUrl = new URL("/patient-form", request.url)
    redirectUrl.searchParams.set("aid", appointmentId)
    redirectUrl.searchParams.set("t", token)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.redirect(new URL("/error?msg=server-error", request.url))
  }
}
