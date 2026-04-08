import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function ExpiredTokenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Link Geçersiz</h1>
        <p className="text-muted-foreground mb-6">
          Bu link süresi dolmuş veya daha önce kullanılmış. Lütfen kliniği arayarak yeni bir link talep edin.
        </p>
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/randevu">Yeni Randevu Al</Link>
          </Button>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <a href="tel:+905555555555">Kliniği Ara</a>
          </Button>
        </div>
      </Card>
    </div>
  )
}
