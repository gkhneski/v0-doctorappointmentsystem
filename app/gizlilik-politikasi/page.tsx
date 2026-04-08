import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Gizlilik Politikası | Prof. Dr. Eray Çalışkan",
  description: "Kişisel verilerinizin korunması ve gizlilik politikamız hakkında bilgi.",
}

export default function GizlilikPolitikasiPage() {
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
            <h1 className="text-lg font-bold">Gizlilik Politikası</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="text-base font-bold mb-2">Gizlilik Taahhüdümüz</h2>
            <p className="text-muted-foreground">
              Prof. Dr. Eray Çalışkan olarak hasta gizliliği ve kişisel veri güvenliği en öncelikli
              konularımızdan biridir. Bu politika, online randevu sistemimiz aracılığıyla toplanan
              verilerin nasıl kullanıldığını açıklamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">Toplanan Bilgiler</h2>
            <p className="text-muted-foreground mb-2">
              Randevu oluşturma sırasında yalnızca gerekli olan bilgiler toplanmaktadır:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Ad ve soyadınız</li>
              <li>T.C. kimlik numaranız (kimlik doğrulama amacıyla)</li>
              <li>Telefon numaranız (randevu hatırlatması amacıyla)</li>
              <li>Seçilen randevu tarihi ve türü</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">Çerezler (Cookies)</h2>
            <p className="text-muted-foreground">
              Bu web sitesi yalnızca oturum yönetimi için zorunlu çerezler kullanmaktadır.
              Herhangi bir izleme veya pazarlama çerezi kullanılmamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">Veri Güvenliği</h2>
            <p className="text-muted-foreground">
              Kişisel verileriniz şifreli (SSL/TLS) bağlantı üzerinden iletilmekte ve güvenli
              sunucularda saklanmaktadır. Verilerinize yalnızca yetkili personel erişebilmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">Üçüncü Taraf Paylaşımı</h2>
            <p className="text-muted-foreground">
              Verileriniz ticari amaçla hiçbir üçüncü tarafla paylaşılmamaktadır. Yalnızca SMS
              gönderimi için Netgsm altyapısı kullanılmakta olup bu işlem için gerekli minimum
              veri aktarımı yapılmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">Veri Saklama Süresi</h2>
            <p className="text-muted-foreground">
              Randevu kayıtları, sağlık mevzuatı gereği belirlenen süre boyunca saklanmaktadır.
              Bu sürenin sonunda veriler güvenli şekilde silinmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2">İletişim</h2>
            <p className="text-muted-foreground">
              Gizlilik politikamıza ilişkin sorularınız için muayenehane adresine başvurabilirsiniz.
              KVKK kapsamındaki haklarınız için{" "}
              <Link href="/kvkk" className="text-primary hover:underline">
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni inceleyiniz.
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
