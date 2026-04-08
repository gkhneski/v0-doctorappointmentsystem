"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export default function KvkkConsentDialog({ isOpen, onClose, onAccept }: Props) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setHasScrolledToBottom(false)
    }
  }, [isOpen])

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    const threshold = 10 // 10px tolerance
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold

    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>KVKK Aydınlatma Metni</DialogTitle>
          <DialogDescription className="sr-only">Kişisel verilerin korunması hakkında aydınlatma metni</DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto border rounded-lg p-4 bg-muted/30 max-h-[60vh]"
        >
          <div className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-bold text-center">ERAY ÇALIŞKAN</h2>
            <h3 className="text-base font-semibold text-center">
              KİŞİSEL VERİLERİN KORUNMASI HAKKINDA AYDINLATILMIŞ ONAM FORMU
            </h3>

            <p>
              Şirket (bundan böyle "klinik" olarak anılacaktır.) hastalarına ilişkin kişisel veriler bakımından 7 Nisan
              2016 tarihinde yürürlüğe giren 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) gereğince,
              muayenehaneye girişinizden itibaren tarafların yükümlülüklerini yerine getirebilmesi amacıyla ve size en
              iyi şekilde hizmet sağlayabilmemiz için tarafımızla paylaşmanız gereken ve tarafımıza sağlamadığınız
              takdirde size hizmet verebilmemizin mümkün olamayacağı ya da çok zorlaşacağı kayıt, iletişim, tanı,
              teşhis, tedavi ve ameliyata ilişkin her türlü kişisel veriniz (ad-soyad, telefon numarası, adres, T.C.
              Numarası, e-mail adresi gibi bilgileriniz, sağlık verileriniz, fotoğraflarınız, biyometrik ve genetik
              verileriniz gibi) mevzuatta öngörülen veri işleme şartlarına uygun olarak Hekim tarafından işlenecek olup,
              işleme amaçları;
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Kimliğinizi teyit etme</li>
              <li>Kamu sağlığının korunması</li>
              <li>Koruyucu hekimlik</li>
              <li>Tıbbî teşhis, tedavi ve bakım hizmetlerinin yürütülmesi</li>
              <li>Sağlık hizmetleri ile finansmanının planlanması ve yönetimi</li>
              <li>
                İlgili mevzuat uyarınca Sağlık Bakanlığı ve diğer kamu kurum ve kuruluşları ile talep edilen bilgilerin
                paylaşılması
              </li>
              <li>
                Muayenehane ve bağlı olduğu ve/veya ona bağlı merkezlerin iç işleyişi ile günlük operasyonların
                planlanması ve yönetilmesi
              </li>
              <li>Muayenehane Yönetimi, hasta memnuniyetinin ölçülmesi, arttırılması ve araştırılması</li>
              <li>İlaç temini</li>
              <li>Randevu almanız halinde randevu hakkında sizi haberdar edebilme</li>
              <li>Risk yönetimi ve kalite geliştirme aktivitelerinin yerine getirilmesi</li>
              <li>Sağlık hizmetlerini geliştirme amacıyla analiz yapma</li>
              <li>Müstehaklık sorgusu kapsamında özel sigorta şirketleri ile talep edilen bilgilerin paylaşılması</li>
              <li>Araştırma yapılması</li>
              <li>Yasal ve düzenleyici gereksinimlerin yerine getirilmesi</li>
              <li>
                Sağlık hizmetlerinin finansmanı kapsamında özel sigorta şirketleri ile talep edilen bilgileri paylaşma
              </li>
              <li>Risk yönetimi ve kalite geliştirme aktivitelerinin yerine getirilmesi</li>
              <li>
                Hizmetlerim karşılığında faturalandırma yapılması ve anlaşmalı olan kurumlardan alacakların tahsil
                edilmesi
              </li>
            </ul>

            <p>şeklinde olacaktır.</p>

            <p className="font-semibold">
              Kişisel verileriniz yukarıda belirtilen amaçlar doğrultusunda Hekim tarafından aşağıdaki alıcılara/alıcı
              gruplarına aktarılabilecektir:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Yetkilendirilmiş kamu kurum ve kuruluşları</li>
              <li>Özel sigorta şirketleri</li>
              <li>Laboratuvar, eczane ve görüntüleme merkezleri</li>
              <li>Hukuken yetkili kurum ve kuruluşlar</li>
              <li>İş ortakları</li>
            </ul>

            <p className="font-semibold mt-4">
              6698 sayılı Kanun'un 11. maddesi uyarınca kişisel veri sahibi olarak aşağıdaki haklara sahipsiniz:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</li>
              <li>
                Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,
              </li>
              <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme,</li>
              <li>
                Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme ve bu
                kapsamda yapılan işlemin kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini isteme,
              </li>
              <li>
                6698 sayılı Kanun ve ilgili diğer kanun hükümlerine uygun olarak işlenmiş olmasına rağmen, işlenmesini
                gerektiren sebeplerin ortadan kalkması hâlinde kişisel verilerin silinmesini veya yok edilmesini isteme
                ve bu kapsamda yapılan işlemin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,
              </li>
              <li>
                İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir
                sonucun ortaya çıkması durumunda buna itiraz etme,
              </li>
              <li>
                Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın
                giderilmesini talep etme.
              </li>
            </ul>

            <p className="mt-4">
              Söz konusu hakların kullanımına ilişkin talepler, kişisel veri sahipleri tarafından ve Hekim Tarafından
              6698 sayılı Kanun Kapsamında Kişisel Verilerin İşlenmesi ve Korunmasına İlişkin Politika'da belirtilen
              yöntemlerle iletilebilecektir. Hekim, söz konusu talepleri değerlendirerek 30 gün içerisinde
              sonuçlandıracaktır. Hekimin taleplere ilişkin olarak Kişisel Verileri Koruma Kurulu tarafından belirlenen
              (varsa) ücret tarifesi üzerinden ücret talep etme hakkı saklıdır.
            </p>

            <p className="mt-4">
              İşbu aydınlatma metninin ekinde yer alan bilgilendirme yazısını okuduğumu ve 6698 sayılı KVKK kapsamındaki
              haklarımı bildiğimi beyan ederim.
            </p>

            <p className="mt-4 font-semibold">
              Hasta yukarıdaki hususlar hakkında tam ve doğru olarak bilgilendirilmekle, özel nitelikli kişisel verileri
              dahil olmak üzere kişisel verilerinin ERAY ÇALIŞKAN tarafından yukarıdaki hüküm ve koşullar çerçevesinde
              işlenmesine muvafakat eder.
            </p>

            <div className="mt-8 p-4 border-2 border-primary rounded-lg bg-background">
              <p className="text-center font-semibold text-primary">
                ✓ Metni sonuna kadar okudunuz, şimdi onaylayabilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="button" onClick={onAccept} disabled={!hasScrolledToBottom}>
            {hasScrolledToBottom ? "Okudum ve Onaylıyorum" : "Lütfen metni sonuna kadar okuyun"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
