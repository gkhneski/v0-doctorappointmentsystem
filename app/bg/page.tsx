import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Award, Baby, Heart, Shield, Microscope } from "lucide-react"

export const metadata: Metadata = {
  title: "Проф. д-р Ерай Чалъшкан | Ин Витро Турция | Кочаели",
  description:
    "Проф. д-р Ерай Чалъшкан — над 2000 успешни ин витро оплождания, над 1000 научни публикации. Специалист по ин витро, проследяване на бременност, фетална ехография. Кочаели, Турция. Приемаме пациенти от България.",
  keywords: [
    "ин витро оплождане турция",
    "ин витро турция",
    "ин витро кочаели",
    "проф д-р ерай чалъшкан",
    "лечение на безплодие турция",
    "бременност турция",
    "фетална ехография турция",
    "IVF Turkey Bulgaria",
    "IVF specialist Turkey",
    "in vitro oplozhdane turtsiya",
    "lekuване на bezplodie turtsiya",
  ],
  alternates: {
    canonical: "/bg",
    languages: {
      "tr-TR": "/",
      "bg-BG": "/bg",
      "en-US": "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    title: "Проф. д-р Ерай Чалъшкан | Ин Витро Турция | 2000+ успешни случаи",
    description:
      "Над 2000 успешни ин витро оплождания. Специалист по перинатология в Кочаели, Турция. Приемаме пациенти от България.",
    siteName: "Prof. Dr. Eray Çalışkan",
  },
}

export default function BulgarianPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-2 text-sm">
        <div className="container mx-auto px-4 flex justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Кочаели / Измит, Турция</span>
          </div>
          <span>|</span>
          <Link href="/" className="hover:underline text-primary-foreground/80">Türkçe</Link>
          <Link href="/en" className="hover:underline text-primary-foreground/80">English</Link>
        </div>
      </div>

      <header className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              Специалист по ин витро в Турция
            </div>
            <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Проф. д-р Ерай Чалъшкан
            </h1>
            <p className="mb-2 text-xl font-semibold text-primary">
              Специалист по Акушерство и Гинекология
            </p>
            <p className="mb-2 text-lg text-muted-foreground">
              Специалист по Перинатология | Ин Витро (IVF) | Проследяване на Бременност
            </p>
            <p className="mb-6 text-base text-muted-foreground">
              Кочаели, Турция — Приемаме пациенти от България
            </p>

            {/* Credentials highlight */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">2000+ успешни ин витро</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">1000+ научни публикации</span>
              </div>
            </div>

            <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
              <Link href="/randevu">
                <Calendar className="mr-2 h-5 w-5" />
                Запазете час онлайн
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Services */}
      <section className="border-b bg-accent/5 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold mb-8">Нашите услуги</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Baby, title: "Ин Витро Оплождане (IVF)", desc: "2000+ успешни случаи" },
              { icon: Heart, title: "Проследяване на Бременност", desc: "Рискова и нормална бременност" },
              { icon: Shield, title: "Инсеминация (IUI)", desc: "Лечение на безплодие" },
              { icon: Microscope, title: "Фетална Ехография", desc: "Детайлна фетална ехография" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Защо да изберете Проф. д-р Ерай Чалъшкан?</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">Проф. д-р Ерай Чалъшкан</strong> е един от най-опитните специалисти по ин витро оплождане в Турция с над <strong className="text-foreground">2000 успешни лечения</strong> и над <strong className="text-foreground">1000 научни публикации</strong>.
            </p>
            <p>
              Клиниката се намира в <strong className="text-foreground">Кочаели (Измит)</strong>, лесно достъпна от България — само 2.5 часа от Одрин, 3.5 часа от Бургас по магистрала.
            </p>
            <p>
              Приемаме български пациенти и осигуряваме пълна грижа по време на лечението. Свържете се с нас за онлайн консултация.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t bg-secondary/30 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Проф. д-р Ерай Чалъшкан | Кочаели, Турция</p>
          <p className="text-xs mt-2">Ин Витро Турция | Лечение Безплодие Турция | IVF Turkey Bulgaria</p>
        </div>
      </footer>
    </div>
  )
}
