import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Stethoscope, Award, GraduationCap, Heart, Baby, Shield, Microscope, MapPin } from "lucide-react"
import HiddenAdminTrigger from "@/components/hidden-admin-trigger"


export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - Location only */}
      <div className="bg-primary text-primary-foreground py-2 text-sm">
        <div className="container mx-auto px-4 flex justify-center items-center">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Kocaeli / İzmit</span>
          </div>
        </div>
      </div>

      <header className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              Kocaeli Tüp Bebek ve Gebelik Uzmanı
            </div>
            <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Prof. Dr. Eray ÇALIŞKAN
            </h1>
            <p className="mb-2 text-xl font-semibold text-primary">Kadın Hastalıkları ve Doğum Uzmanı</p>
            <p className="mb-6 text-lg text-muted-foreground">
              Perinatoloji Yan Dal Uzmanı | Tüp Bebek | Gebelik Takibi | Aşılama (IUI) | Kocaeli
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

      {/* SEO Keywords Section */}
      <section className="border-b bg-accent/5 py-12">
        <div className="container mx-auto px-4">
          <h2 className="sr-only">Kocaeli Tüp Bebek ve Gebelik Hizmetleri</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Baby className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">TÜP BEBEK KOCAELİ</h3>
              <p className="text-sm text-muted-foreground mt-1">IVF Tedavisi</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">GEBELİK TAKİBİ</h3>
              <p className="text-sm text-muted-foreground mt-1">Riskli Gebelik Uzmanı</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">AŞILAMA (IUI)</h3>
              <p className="text-sm text-muted-foreground mt-1">Gebelik İstemi</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Microscope className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">FETAL ULTRASON</h3>
              <p className="text-sm text-muted-foreground mt-1">Ayrıntılı Ultrason</p>
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

      {/* SEO Text Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-sm text-muted-foreground">
            <h2 className="text-xl font-semibold text-foreground mb-4">Kocaeli Tüp Bebek ve Gebelik Merkezi</h2>
            <p>
              <strong>Prof. Dr. Eray Çalışkan</strong>, Kocaeli ve çevresinde <strong>tüp bebek tedavisi</strong>, 
              <strong>gebelik takibi</strong>, <strong>aşılama (IUI)</strong> ve <strong>ayrıntılı fetal ultrason</strong> 
              alanlarında uzmanlaşmış deneyimli bir kadın doğum uzmanıdır. İzmit, Gebze, Derince, Gölcük ve 
              çevre ilçelerden gelen hastalarımıza modern tıbbi imkanlarla hizmet vermekteyiz.
            </p>
            <p>
              <strong>Gebelik istemi</strong> ve <strong>infertilite (kısırlık) tedavisi</strong> konusunda 
              yılların deneyimiyle, çiftlerin bebek sahibi olma hayallerini gerçekleştirmelerine yardımcı 
              oluyoruz. <strong>Riskli gebelik takibi</strong> ve <strong>perinatoloji</strong> alanındaki 
              uzmanlığımızla anne ve bebek sağlığını en üst düzeyde koruyoruz.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 text-xs">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">Tüp Bebek Kocaeli</span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">Gebelik Takibi Kocaeli</span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">Aşılama IUI Kocaeli</span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">Fetal Ultrason Kocaeli</span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">İnfertilite Tedavisi İzmit</span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded">Riskli Gebelik Kocaeli</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-secondary/30 py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-3">Hızlı Linkler</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li><Link href="/randevu" className="hover:text-primary transition">Online Randevu Al</Link></li>
                <li><Link href="/kvkk" className="hover:text-primary transition">KVKK Aydınlatma Metni</Link></li>
                <li><Link href="/gizlilik-politikasi" className="hover:text-primary transition">Gizlilik Politikası</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Prof. Dr. Eray Çalışkan</h3>
              <p className="text-sm text-muted-foreground">
                Kadın Hastalıkları ve Doğum Uzmanı<br/>
                Perinatoloji Yan Dal Uzmanı<br/>
                Tüp Bebek Tedavisi Uzmanı
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Hizmet Bölgelerimiz</h3>
              <p className="text-sm text-muted-foreground">
                Kocaeli, İzmit, Gebze, Derince, Gölcük, Körfez, Kartepe, Başiskele, Çayırova, Dilovası
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Uzmanlık Alanları</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Tüp Bebek (IVF)</strong>, Aşılama (IUI), Gebelik Takibi, Ayrıntılı Fetal Ultrason, 
                Gebelik İstemi, İnfertilite Tedavisi, Riskli Gebelik
              </p>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground border-t pt-6">
            <p className="mb-2">
              <HiddenAdminTrigger>© 2025 Prof. Dr. Eray Çalışkan - Kadın Hastalıkları ve Doğum Uzmanı | Kocaeli</HiddenAdminTrigger>
            </p>
            <p className="text-xs mb-3">Tüp Bebek Kocaeli | Gebelik Takibi İzmit | Aşılama Gebze | Fetal Ultrason Kocaeli</p>
            <div className="flex justify-center gap-4 text-xs">
              <Link href="/kvkk" className="hover:text-primary transition">KVKK Aydınlatma Metni</Link>
              <span>|</span>
              <Link href="/gizlilik-politikasi" className="hover:text-primary transition">Gizlilik Politikası</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
