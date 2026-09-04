import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Stethoscope, Award, GraduationCap, Heart, Baby, Shield, Microscope, UserCog } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4 flex justify-end">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin-panel-giris">
                <UserCog className="mr-2 h-4 w-4" />
                Personel Girişi
              </Link>
            </Button>
          </div>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              Profesör Doktor
            </div>
            <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Eray ÇALIŞKAN
            </h1>
            <p className="mb-2 text-xl font-semibold text-primary">Kadın Hastalıkları ve Doğum Uzmanı</p>
            <p className="mb-6 text-lg text-muted-foreground">
              Perinatoloji Yan Dal Uzmanı • Tüp Bebek Tedavisi Uzmanı
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="outline" asChild>
                <Link href="#hizmetler">Hizmetlerimiz</Link>
              </Button>
              <Button size="lg" asChild className="animate-appointment-pulse bg-primary hover:bg-primary/90">
                <Link href="/randevu">
                  <Calendar className="mr-2 h-5 w-5" />
                  Online Randevu Al
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b bg-accent/5 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Baby className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">TÜP BEBEK TEDAVİSİ</h3>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">RİSKLİ GEBELİK TAKİBİ</h3>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">JİNEKOLOJİK MUAYENE</h3>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Microscope className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">ESTETİK JİNEKOLOJİ</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center gap-3">
              <GraduationCap className="h-10 w-10 text-primary" />
              <h2 className="text-3xl font-bold">Hakkımda</h2>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className="leading-relaxed text-muted-foreground">
                Kırcali-Bulgaristan'da doğdu. Hacettepe Üniversitesi Tıp Fakültesini İngilizce grubunda okuyarak 1996
                yılında bitirdi. Etlik Zübeyde Hanım Kadın Hastalıkları Eğitim ve Araştırma Hastanesi'nde başladığı
                ihtisasını 2002'de tamamladı.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Kocaeli Üniversitesi Tıp Fakültesinde Uzman, Yardımcı Doçent ve Doçent olarak çalıştıktan sonra 2015
                yılında Profesör unvanını aldı. Bahçeşehir Üniversitesi Tıp Fakültesi Dekan Yardımcısı olarak görev
                yaptı.
              </p>
              <div className="mt-6 grid gap-4 rounded-lg border bg-card p-6 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h4 className="font-semibold">2009</h4>
                    <p className="text-sm text-muted-foreground">Tüp Bebek Eğitimi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h4 className="font-semibold">2010</h4>
                    <p className="text-sm text-muted-foreground">Perinatoloji Yan Dal Uzmanı</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h4 className="font-semibold">2015</h4>
                    <p className="text-sm text-muted-foreground">Profesör</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <h4 className="font-semibold">2018</h4>
                    <p className="text-sm text-muted-foreground">Anadolu Üniversitesi İşletme Fakültesi</p>
                  </div>
                </div>
              </div>
              <p className="mt-6 leading-relaxed text-muted-foreground">
                2023 Ekim ayından itibaren Kocaeli'nde bulunan muayenehanesinde hastalarına hizmet vermeye devam
                etmektedir.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="hizmetler" className="border-y bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Hizmetlerimiz</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Baby className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">TÜP BEBEK TEDAVİSİ</h3>
              <p className="text-sm text-muted-foreground">Genetik taramalı tüp bebek tedavisi</p>
            </div>

            <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">PERİNATOLOJİ</h3>
              <p className="text-sm text-muted-foreground">Yüksek riskli gebelik tedavisi</p>
            </div>

            <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">GEBELİK TAKİBİ</h3>
              <p className="text-sm text-muted-foreground">Gebeliğin ilk anından itibaren takip</p>
            </div>

            <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">GENİTAL ESTETİK</h3>
              <p className="text-sm text-muted-foreground">İç/dış dudak estetiği, vajinal daraltma</p>
            </div>

            <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Microscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">HPV TEDAVİSİ</h3>
              <p className="text-sm text-muted-foreground">HPV tedavisi ve aşısı</p>
            </div>

            <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">KADIN ÜROLOJİSİ</h3>
              <p className="text-sm text-muted-foreground">İdrar kaçırma, rahim ve mesane sarkması</p>
            </div>

            <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">JİNEKOLOJİK ENDOSKOPİ</h3>
              <p className="text-sm text-muted-foreground">Polipler, yapışıklık, anormal kanamalar</p>
            </div>

            <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">JİNEKOLOJİK ONKOLOJİ</h3>
              <p className="text-sm text-muted-foreground">Yumurtalık, rahim ağzı, rahim kanseri</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 text-center text-primary-foreground md:p-12">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Online Randevu Alın</h2>
            <p className="mb-8 text-lg opacity-90">
              Kolay ve hızlı randevu sistemi ile müsait saatleri görün ve anında randevunuzu oluşturun
            </p>
            <Button size="lg" variant="secondary" asChild className="text-base">
              <Link href="/randevu">
                <Calendar className="mr-2 h-5 w-5" />
                Hemen Randevu Al
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t bg-secondary/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">© 2025 Prof. Dr. Eray Çalışkan - Kadın Hastalıkları ve Doğum Uzmanı</p>
          <p>Kocaeli</p>
        </div>
      </footer>
    </div>
  )
}
