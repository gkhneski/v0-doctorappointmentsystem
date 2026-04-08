import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Award, Baby, Heart, Shield, Microscope } from "lucide-react"

export const metadata: Metadata = {
  title: "Prof. Dr. Eray Çalışkan | IVF Specialist Turkey | Kocaeli",
  description:
    "Prof. Dr. Eray Çalışkan — 2000+ successful IVF treatments, 1000+ scientific publications. Leading IVF, perinatology, and pregnancy specialist in Kocaeli, Turkey. Accepting international patients including from Bulgaria.",
  keywords: [
    "IVF specialist Turkey",
    "IVF doctor Kocaeli Turkey",
    "IVF treatment Turkey",
    "best IVF doctor Turkey",
    "perinatology specialist Turkey",
    "2000 successful IVF Turkey",
    "infertility treatment Turkey",
    "high risk pregnancy Turkey",
    "IVF Turkey international patients",
    "IVF Turkey Bulgaria",
    "IVF Turkey professor",
    "fetal ultrasound specialist Turkey",
    "Prof Dr Eray Caliskan",
  ],
  alternates: {
    canonical: "/en",
    languages: {
      "tr-TR": "/",
      "bg-BG": "/bg",
      "en-US": "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Prof. Dr. Eray Çalışkan | IVF Specialist Turkey | 2000+ Successful Treatments",
    description:
      "2000+ successful IVF treatments, 1000+ scientific publications. Leading IVF & perinatology specialist in Kocaeli, Turkey. International patients welcome.",
    siteName: "Prof. Dr. Eray Çalışkan",
  },
}

export default function EnglishPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-2 text-sm">
        <div className="container mx-auto px-4 flex justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Kocaeli / Izmit, Turkey</span>
          </div>
          <span>|</span>
          <Link href="/" className="hover:underline text-primary-foreground/80">Türkçe</Link>
          <Link href="/bg" className="hover:underline text-primary-foreground/80">Български</Link>
        </div>
      </div>

      <header className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              IVF Specialist — Kocaeli, Turkey
            </div>
            <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Prof. Dr. Eray Çalışkan
            </h1>
            <p className="mb-2 text-xl font-semibold text-primary">
              Obstetrician & Gynecologist
            </p>
            <p className="mb-2 text-lg text-muted-foreground">
              Perinatology Subspecialist | IVF | Pregnancy Follow-up | Fetal Ultrasound
            </p>
            <p className="mb-6 text-base text-muted-foreground">
              Kocaeli, Turkey — Accepting international patients from Bulgaria & worldwide
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">2000+ Successful IVF Treatments</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">1000+ Scientific Publications</span>
              </div>
            </div>

            <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
              <Link href="/randevu">
                <Calendar className="mr-2 h-5 w-5" />
                Book an Appointment
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b bg-accent/5 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold mb-8">Our Services</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Baby, title: "IVF Treatment", desc: "2000+ successful cases" },
              { icon: Heart, title: "Pregnancy Follow-up", desc: "High-risk & normal pregnancy" },
              { icon: Shield, title: "IUI (Insemination)", desc: "Infertility treatment" },
              { icon: Microscope, title: "Fetal Ultrasound", desc: "Detailed fetal anomaly scan" },
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

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Prof. Dr. Eray Çalışkan?</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">Prof. Dr. Eray Çalışkan</strong> is one of Turkey&apos;s most experienced IVF specialists with over <strong className="text-foreground">2,000 successful treatments</strong> and more than <strong className="text-foreground">1,000 scientific publications</strong>.
            </p>
            <p>
              The clinic is located in <strong className="text-foreground">Kocaeli (Izmit)</strong>, easily accessible from Bulgaria, Europe, and the Middle East. We welcome international patients and provide comprehensive support throughout the treatment process.
            </p>
            <p>
              Contact us for an online consultation or book an appointment directly through our online system.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t bg-secondary/30 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Prof. Dr. Eray Çalışkan | Kocaeli, Turkey</p>
          <p className="text-xs mt-2">IVF Turkey | IVF Kocaeli | IVF Turkey Bulgaria | Infertility Treatment Turkey</p>
        </div>
      </footer>
    </div>
  )
}
