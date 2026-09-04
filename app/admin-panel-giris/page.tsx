import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function AdminPanelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-secondary to-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
            <Calendar className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Yönetim Paneli Girişi</h1>
          <p className="mt-2 text-sm text-muted-foreground">Giriş türünüzü seçin</p>
        </div>

        <div className="space-y-4">
          <Button variant="default" size="lg" asChild className="w-full">
            <Link href="/auth/admin/login">Doktor/Sekreter Girişi</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
