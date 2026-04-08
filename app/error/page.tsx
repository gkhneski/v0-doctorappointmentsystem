import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ErrorPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const params = await searchParams
  const errorMsg = params.msg

  const errorMessages: Record<string, { title: string; description: string }> = {
    "token-missing": {
      title: "Link Eksik",
      description: "Randevu linki hatalı. Lütfen SMS'teki linki tekrar kontrol edin.",
    },
    "token-invalid": {
      title: "Link Geçersiz veya Süresi Dolmuş",
      description: "Bu link artık geçerli değil veya süresi dolmuş. Lütfen hastane ile iletişime geçin.",
    },
    "server-error": {
      title: "Bir Hata Oluştu",
      description: "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
    },
  }

  const error = errorMessages[errorMsg || "server-error"] || errorMessages["server-error"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{error.title}</h1>
        <p className="text-gray-600 mb-6">{error.description}</p>
        <Link href="/">
          <Button className="w-full">Ana Sayfaya Dön</Button>
        </Link>
      </Card>
    </div>
  )
}
