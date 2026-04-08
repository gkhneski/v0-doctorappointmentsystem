import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "KVKK Aydınlatma Metni | Prof. Dr. Eray Çalışkan",
  description: "Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.",
}

export default function KVKKPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary/5 py-4">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ana Sayfa
            </Link>
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Prof. Dr. Eray Çalışkan</p>
            <h1 className="text-lg font-bold">KVKK Aydınlatma Metni</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="text-base font-bold mb-2">1. Veri Sorumlusu</h2>
            <p className="text-muted-foreground">
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, kişisel verileriniz;
              veri sorumlusu sıfatıyla <strong>Prof. Dr. Eray Çalışkan</strong> (Kocaeli / İzmit) tarafından
              aşağıda açıklanan kapsamda işlenecektir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">2. İşlenen Kişisel Veriler</h2>
            <p className="text-muted-foreground mb-2">Tarafınızdan toplanan kişisel veriler şunlardır:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Ad, soyad</li>
              <li>T.C. kimlik numarası</li>
              <li>Telefon numarası</li>
              <li>Randevu tarihi ve saati</li>
              <li>Sağlık hizmeti türü (randevu tipi)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Online randevu sisteminin işletilmesi</li>
              <li>Randevu hatırlatma ve onay SMS&apos;lerinin gönderilmesi</li>
              <li>Hasta kayıtlarının tutulması ve yönetimi</li>
              <li>Mevzuattan kaynaklanan yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">4. Kişisel Verilerin Aktarılması</h2>
            <p className="text-muted-foreground">
              Kişisel verileriniz; SMS gönderimi amacıyla yalnızca <strong>Netgsm</strong> altyapı
              sağlayıcısıyla paylaşılmakta olup üçüncü kişilere ticari amaçla aktarılmamaktadır.
              Yasal zorunluluk hâlinde yetkili kamu kurum ve kuruluşlarıyla paylaşılabilir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
            <p className="text-muted-foreground">
              Kişisel verileriniz; online randevu formu aracılığıyla elektronik ortamda toplanmaktadır.
              İşlemenin hukuki dayanağı KVKK madde 5/2-c kapsamında &quot;sözleşmenin ifası için zorunlu
              olması&quot; ve madde 5/2-ç kapsamında &quot;veri sorumlusunun hukuki yükümlülüğünü yerine
              getirebilmesi için zorunlu olması&quot;dır.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">6. Kişisel Veri Sahibinin Hakları</h2>
            <p className="text-muted-foreground mb-2">KVKK&apos;nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
              <li>KVKK&apos;nın 7. maddesi çerçevesinde silinmesini veya yok edilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler aracılığıyla analiz edilmesi suretiyle
                aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">7. İletişim</h2>
            <p className="text-muted-foreground">
              Yukarıdaki haklarınızı kullanmak veya KVKK kapsamında bilgi almak için muayenehane
              adresine yazılı başvuruda bulunabilirsiniz.
            </p>
          </section>

          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>Son güncelleme: Nisan 2025</p>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>© 2025 Prof. Dr. Eray Çalışkan — Kadın Hastalıkları ve Doğum Uzmanı | Kocaeli</p>
        </div>
      </footer>
    </div>
  )
}
