import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("t")

  if (!token) {
    redirect("/error?message=invalid-link")
  }

  // Redirect to the appointment page with the token
  redirect(`/appointment/${token}`)
}
