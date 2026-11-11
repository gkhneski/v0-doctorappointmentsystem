# Hasta Uygulaması — Ana Plan

Tarih: 11 Kasım 2026 · Durum: **taslak, onay bekliyor** · Kapsam: baştan sona yol haritası

Bu belge işin tamamını sırasıyla anlatır. Her faz başlamadan önce o faz için ayrı, ayrıntılı bir uygulama planı yazılır. Bu belge onaylanmadan kod yazılmaz.

Belgedeki bilgilerin kaynağı dört yerdir: sizin söyledikleriniz, mevcut iki deponun okunması, canlı veritabanının salt-okunur incelenmesi ve 11 Kasım 2026 tarihli internet araştırması. Hukuki bölümler ürün planlaması içindir, **hukuki görüş değildir**; "avukata sorulacak" diye işaretli maddeler yanıtlanmadan ilgili özellik yayına alınmaz.

---

## 1. Ne yapıyoruz ve neden

Kliniğin kendi hastaları için bir gebelik ve kadın sağlığı uygulaması. Hasta gebeliğini ilk haftadan doğuma kadar uygulamadan takip eder, randevusunu görür, sorularına yanıt bulur ve 18. haftadan sonra kendi telefonuyla ultrason görüntüsünden bebeğinin yüz resmini üretir.

**Neden (sizin sözlerinizle):**
- Bebek resmi bugün klinikte üretiliyor ve her biri personelin 15 dakikasını alıyor. Üretimi hastanın kendisi yapacak; klinik üretmeyecek, personel bir şey girmeyecek.
- Hasta ilk resmi ücretsiz, sonrakileri kredi satın alarak üretecek: gelir.
- Hasta doğuma kadar uygulamada kalacak ve ona her zaman ulaşılabilecek: bağlılık.
- Hastalar birebir görülen insanlar; amaç onlara yardımcı olmak, gebeliklerini izlemek, sorularını yanıtlamak.

## 2. Hedefler, hedef olmayanlar, başarısızlık sayılacaklar

**Hedefler**
1. Mevcut randevu sistemindeki bütün güvenlik açıkları, çalışan hiçbir şey bozulmadan kapatılır. Bu iş her şeyden önce gelir.
2. Hasta uygulaması aynı sistemin içinde ama ayrı bölüm, ayrı tablolar ve ayrı giriş olarak kurulur.
3. Hasta, personel yardımı olmadan, ultrason görüntüsü ve ölçüm kâğıdının fotoğrafından bebek resmini üretir.
4. Kredi satışı gerçek ödemeyle çalışır.
5. Uygulama App Store ve Google Play kurallarına, KVKK'ya ve Sağlık Bakanlığı mevzuatına uygun çıkar.
6. `nbreeda` deposu ve Emergent üzerindeki eski sistem kapatılır.

**Hedef olmayanlar (ilk sürümde yok)**
- Doktorun ya da kliniğin uygulamadan kişiye özel tıbbi soru yanıtlaması (uzaktan sağlık hizmeti izni gerektirir, bkz. 5.2).
- Hastanın ölçümlerinden hesaplanan büyüme eğrileri, risk puanları, belirti değerlendirme (tıbbi cihaz sayılma riski, bkz. 5.3).
- Başka kliniklere satış. Yapı buna engel olmayacak şekilde kurulur ama ilk sürüm tek klinik içindir.
- Anne topluluğu/forum (her rakipte var, denetim yükü getirir).
- Video animasyon. Depoda yarım hali var; resim üretimi oturduktan sonra ele alınır.

**Başarısızlık sayılacaklar (teknik olarak çalışsa bile)**
- Bir hastanın başka bir hastanın verisini ya da görüntüsünü görebilmesi.
- Randevu alma, SMS hatırlatma ya da admin panelinin herhangi bir akışının bozulması.
- Uygulamanın ya da üretilen resmin kliniğe reklam yasağı, KVKK ya da izinsiz uzaktan sağlık hizmeti nedeniyle ceza getirmesi.
- Resmin "bebeğiniz böyle görünecek" ya da "doktor ölçümleriyle birebir oluşturuldu" gibi kanıtlanamayan bir iddiayla sunulması.
- Kliniğin uygulama için fazladan ultrason çekmesi ya da çekimi uzatması.

## 3. Bizi farklı kılan ne

**Dürüst konum:** "Ultrasondan bebek yüzü" tek başına dünyada tek değil. Onlarca tüketici uygulaması (biri Türk yayıncıya ait) ve en az iki klinik ürünü (GE "Natural Portrait View", Be·ia) bunu yapıyor. Araştırmada hiçbir yerde bulunamayan şey şu birleşim:

> Hastayı gerçekten takip eden doktorun verisine, randevusuna ve muayenede aldığı ölçümlere bağlı bir gebelik uygulaması — ve bunun içinde, o muayenenin görüntüsünden üretilen bebek yüzü.

Genel uygulamalar (Flo, BabyCenter, Pregnancy+ vb.) hastanın gerçek klinik verisini göstermiyor; bebek yüzü uygulamaları da bir doktora ya da takibe bağlı değil. Arama yüzeyseldi; "bulunamadı" kesin "yok" demek değildir.

**Uygulamaya özgü özellikler** (araştırmadan seçilenler; yenilik düzeyi "karşı örnek bulunamadı" anlamındadır):

| # | Özellik | Rakip neden kopyalayamaz | Faz |
|---|---|---|---|
| 1 | Doktorun muayenesindeki görüntüden, profilden önden yüz üretimi; ölçümlerin katkısı Faz 3'teki kalite çalışmasıyla netleşecek | Klinikte çekilmiş görüntü, ölçüm ve bu üretim hattı gerekir | 3 |
| 2 | "Benim gebeliğim" zaman çizelgesi: doktorun girdiği tahmini doğum tarihi, vizite geçmişi, kilo, tansiyon — olduğu gibi gösterim | Genel uygulamaların klinik verisi yok | 2 |
| 3 | Doktorun kendi protokolüne göre vizite hazırlık listesi (hangi tahlil, aç/tok, ne getirilecek) | Protokol doktora özgü | 2 |
| 4 | Protokole bağlı randevu önerisi ("20. hafta ayrıntılı ultrasonunuzun zamanı geldi, uygun 3 saat") | Randevu sistemi zaten bizde | 2 |
| 5 | Doktor onaylı soru-cevap bankası; yanıtı olmayan sorular "vizitede soracaklarım" listesine düşer | Adı bilinen bir profesör tarafından onaylı içerik | 2 |
| 6 | Vizite öncesi özet: hastanın tekme sayımı, kasılma kaydı, belirtileri ve soruları muayeneden önce doktorun önüne gelir | Doktor tarafında ekran gerekir | 6 |
| 7 | Yüz serisi: farklı vizitelerin resimlerinden zaman içinde değişim | Aynı klinikte tekrarlayan gerçek çekimler gerekir | 6 |
| 8 | Doğumdan sonra üretilen resim ile gerçek yenidoğan fotoğrafının yan yana gösterimi | Doğuma kadar takip gerekir | 6 |
| 9 | Aile odası: eş ve büyükanne-büyükbaba, hastanın tek tek izin verdiği resimleri ve dönüm noktalarını görür | Klinik görüntüsüyle birlikte yapan yok | 6 |
| 10 | Basılı hatıra albümü: gerçek ultrasonlar, üretilen resimler, doğum fotoğrafı | İçerik yalnızca burada var | 6 |
| 11 | Türkçe + Bulgarca | Bu dil çifti küresel uygulamalar için küçük | 6 |
| 12 | Aynı doktorla doğum sonrası takip, ardından kadın sağlığı moduna geçiş | Tek doktorda süreklilik | 7 |
| 13 | Hassas durum kilidi: ultrasonda bulgu olan hastada klinik üretimi kapatabilir ya da erteleyebilir | Yalnızca klinik bilir | 3 |

**11 Kasım kararının bu listeye etkisi:** Uygulama klinik kayıtlarından ve randevu sisteminden bağımsız olacağı için 2. madde (doktorun girdiği veriler) ve 4. madde (randevu önerisi) plandan çıkar; 3. madde hastanın kendi girdiği haftaya göre çalışan genel bir hazırlık listesine, 6. madde hastanın muayenede doktora gösterebileceği bir özete dönüşür. Yerlerine **kliniğin uygulamadaki hastalara doğrudan gönderim yapabilmesi** eklenir (Faz 2). Bu tercih, "takip eden doktorun verisine bağlı uygulama" farkını zayıflatır; geriye kalan fark, muayenede çekilmiş görüntüden üretim, doktor onaylı içerik ve kliniğin hastasına doğrudan ulaşmasıdır.

6. maddede hasta bu verinin anlık izlenmediğini açıkça görmelidir ("acil durumda 112 / kliniği arayın"). 13. madde, personelin hiçbir şey girmemesi kuralının tek istisnasıdır ve yalnızca gerektiğinde kullanılır (bkz. açık soru S6).

## 4. Kim neye karar verdi

**Sizin kararlarınız**
- Her şey tek yerde, ama ayrılmış ve güvenli.
- Klinik üretmez, personel veri girmez. Hastaya ultrason görüntüsü ve doktorun ölçüm kâğıdı verilir; hasta istediği yerde kendisi üretir.
- İlk üretim ücretsiz (kod ile), sonrakiler ücretli kredi.
- İşe mevcut programın güvenliğiyle başlanır; çalışan hiçbir şey bozulmaz.
- Sağlık Bakanlığı ve mağaza kuralları gözetilir.
- `nbreeda` deposu bırakılacak.

**Planı okuduktan sonra verdiğiniz kararlar (11 Kasım 2026)**
- **Satış:** Krediler internetten, PayTR ile satılacak.
- **Yurt dışı aktarım:** Görüntünün yurt dışına gitmesi şart değil; gidecekse bu, uygulamanın koşullarında açıkça yazılacak ve hasta okuyup onaylayacak.
- **Randevu sisteminden bağımsızlık:** Mevcut gebelik kayıtları geçersiz sayılır, sıfırdan başlanır. Hasta uygulaması randevu sistemiyle ve klinik kayıtlarıyla bağlantılı olmayacak; her hasta başlangıçta bilgilerini kendisi dolduracak.
- **Kliniğin gönderim hakkı:** Klinik, uygulamadaki hastalara istediği mesajı ve içeriği gönderebilecek.
- **Ad ve alan adı:** neobreedai.com.
- **Eski sistem:** Emergent tamamen bırakılacak; her şey bu sistemin üzerine, Vercel ve Supabase ile yeniden kurulacak.
- **Kimler kayıt olabilir:** Herkes. Ücretsiz ilk üretim yalnızca kliniğin onayladığı hesaplara verilir; onaylanmayanlar kredi satın alarak üretir.

**Benim kararlarım** (itiraz edebilirsiniz)
- **Uygulama biçimi:** Önce telefona ana ekrandan kurulabilen web uygulaması, ardından aynı kodun App Store ve Google Play sürümü. Gerekçe: gebelik takibi ve üretim akışı (Faz 2–3) mağaza onayı ve mağaza hesabı beklemeden denenebilir. Kredi satışı ise web'de de şirket, ödeme sağlayıcısı ve fatura gerektirir; web-önce yaklaşımı satışı öne çekmez.
- **Gebelik haftasının kaynağı:** Hasta ilk açılışta son adet tarihini ya da tahmini doğum tarihini kendisi girer. 18. hafta kuralı ayrıca ultrason görüntüsünün üzerindeki gebelik haftası yazısından okunarak doğrulanır (eski sistem bunu zaten okuyabiliyor).
- **Randevu:** Uygulama randevu sistemine bağlı değildir. İstenirse yalnızca mevcut randevu sayfasına giden bir bağlantı bulunur.
- **Kliniğin gönderimleri:** Admin paneline ayrı bir "uygulama gönderimleri" ekranı eklenir; klinik buradan tüm kullanıcılara ya da seçtiği gruba (örneğin gebelik haftasına göre) bildirim ve içerik gönderir. Bilgilendirme serbesttir; fiyat, indirim ve kampanya içeren gönderimler tanıtım yönetmeliği ve ticari ileti izni nedeniyle ayrı ele alınır (bkz. 5.1).
- **Deneme kullanıcıları:** Hukuki metinler (Faz 1) hazır olana kadar uygulamayı yalnızca ekip üyeleri ve uydurma deneme kayıtları kullanır; gerçek hasta alınmaz.
- **Ücretsiz hakkın onayı:** Admin panelindeki uygulama ekranında klinik bir hesabı "onaylı" işaretler; ücretsiz ilk üretim hakkı o hesaba sunucudan tanımlanır. Hasta kod yazmaz (Apple kuralına uygun). Onayın hangi bilgiyle verileceği (telefon numarası, hastanın klinikte gösterdiği bir ekran vb.) Faz 3 planında belirlenir. Bu, personelin tek dokunuşluk bir işidir.
- **Hasta girişi:** Telefona gelen SMS koduyla kayıt ve giriş; hesap klinik hasta kaydıyla eşleştirilmez. Hasta hesapları personel giriş sistemine (Supabase Auth) eklenmez; ayrı bir oturum sistemiyle yönetilir. Gerekçe: bugünkü veritabanı kuralları "giriş yapmış kullanıcı = personel" varsayıyor; hastalar aynı sisteme alınırsa her hasta herkesin verisini görebilir.
- **Veri erişimi:** Hastanın telefonu veritabanına hiç doğrudan bağlanmaz. Her istek sunucudan geçer ve oturumdaki hastanın kendi kaydına süzülür.
- **Hasta tarafı tabloları:** Tümü yeni ve ayrı ön ekli (`app_*`). Hasta uygulaması mevcut klinik tablolarını ne okur ne yazar.
- **Ölçümlerin rolü:** Ölçümler resmi geometrik olarak belirlemiyor; bugün modele yazılı ipucu olarak gidiyor ve uyulup uyulmadığı denetlenmiyor. Faz 3'te ölçümlü/ölçümsüz ve tek/çift görüntülü üretim karşılaştırılacak; tanıtım dili sonuca göre yazılacak.
- **Çerçeve:** Üretilen resimde doktorun adı, unvanı ve site adresi olmayacak; yalnızca uygulamanın kendi markası. Gerekçe: bkz. 5.1.
- **Sohbet:** Yapay zekâ yalnızca genel bilgi verir, teşhis koymaz, kişiye özel değerlendirme yapmaz, acil durumda 112'ye ve kliniğe yönlendirir.
- **Krediler:** Süresi dolmaz (Apple kuralı); kullanılmamış kredi 14 gün içinde iade edilir; kredi yalnızca resim başarıyla üretildiğinde düşer.
- **İlk sürümde yok:** büyüme eğrisi, risk puanı, belirti değerlendirme, doktora mesaj, forum, video.

## 5. Kısıtlar ve tasarıma etkileri

### 5.1 Sağlıkta tanıtım yasağı

Yeni *Sağlık Hizmetlerinde Tanıtım ve Bilgilendirme Faaliyetleri Hakkında Yönetmelik* (RG 12.11.2025, sayı 33075) hekimin fiyat, indirim, kampanya, promosyon ve hediye duyurmasını, örtülü reklamı ve hasta memnuniyeti içeriğini yasaklıyor. Kurul'un 2023/787 sayılı kararında, hastadan rıza alınmış olmasına rağmen hasta görüntüsünü tanıtımda kullanan bir hastaneye 250.000 TL ceza verilmiş.

Etkisi:
- **Çerçevedeki doktor adı kaldırılır.** Hastaların sosyal medyada paylaşacağı resimde doktor adı ve site adresi örtülü reklam sayılabilir.
- **Klinikten dağıtılan "bedava kod" ve fiyat duyurusu riskli.** Önerilen çözüm: ücretsiz ilk üretim klinik hediyesi olarak değil, uygulamayı işleten şirketin her doğrulanmış hesaba tanıdığı standart deneme hakkı olarak verilir; klinik kod dağıtmaz, fiyat söylemez (avukata sorulacak, S2).
- Uygulama hastayı paylaşmaya ya da kliniği etiketlemeye teşvik etmez.
- Klinik kanallarında hasta paylaşımları yeniden paylaşılmaz.

### 5.2 Uzaktan sağlık hizmeti

*Uzaktan Sağlık Hizmetlerinin Sunumu Hakkında Yönetmelik* (RG 10.02.2022, sayı 31746): sağlık personelinin uzaktan muayene, takip ve tıbbi danışmanlık vermesi Bakanlık izni ve tescilli yazılım gerektirir.

Etkisi:
- **Kapsam dışı (serbest):** genel içerik, randevu, hatırlatma, hastanın kendi verisinin gösterimi.
- **Kapsam içi (ilk sürümde yok):** doktorun ya da kliniğin uygulamadan kişiye özel klinik soru yanıtlaması.
- Klinikle mesajlaşma yalnızca idari konularla sınırlı kalır.
- Muayenehanenin bu izni alıp alamayacağı belirsiz; İl Sağlık Müdürlüğü'ne sorulacak (S5).

### 5.3 Tıbbi cihaz

*Tıbbi Cihaz Yönetmeliği* (RG 02.06.2021): yazılımın tıbbi cihaz sayılıp sayılmayacağını beyan edilen amaç belirler; mağaza ve tanıtım metinleri de buna dahildir.

Etkisi:
- Uygulama teşhis, izleme, tahmin ya da risk değerlendirmesi yapmaz.
- Klinik verisi yalnızca doktorun girdiği haliyle gösterilir; uygulama üzerinde hesap yapmaz.
- Her resimde ve mağaza açıklamasında: "Yapay zekâ ile üretilmiş sanatsal bir görseldir; tıbbi görüntü değildir, bebeğin gerçek görünümünü ya da sağlığını göstermez."
- Ölçüm kâğıdı yalnızca üretime girdi olarak okunur. Uygulama hastaya ölçüm değeri, yorum ya da değerlendirme göstermez.

### 5.4 KVKK

- **Hukuki dayanak:** Hastaya kendi kaydını, randevusunu ve hatırlatmayı göstermek sağlık hizmeti kapsamında (m. 6/3-e). Bebek resmi, sohbet kayıtları ve her türlü pazarlama için ayrı **açık rıza** gerekir (m. 6/3-a).
- **Aydınlatma ve rıza ayrı metinler** olmalı, rıza hizmet koşulu yapılamaz (İlke Kararı 2026/347).
- **Yurt dışına aktarım en kritik madde.** Ultrason görüntüsü, ölçüm kâğıdı ve cinsiyet, kimliği belli bir hastaya bağlıysa sağlık verisidir. Google ve Replicate'e sürekli gönderim için açık rıza yetmez (m. 9/6 yalnızca arızi aktarımı kapsar); her sağlayıcıyla Kurul'un standart sözleşmesi imzalanır ve 5 iş günü içinde bildirilir (m. 9/4-c, 9/5). **Sağlayıcılar imzalamazsa özellik bu haliyle çıkamaz.**
- **Sizin kararınız ve sınırı:** Aktarımın koşullarda açıkça yazılıp hastaya onaylatılmasını istediniz. Araştırmaya göre bu tek başına yetmeyebilir: rıza, kullanım koşullarının içinde değil ayrı bir metin ve ayrı bir onay olmalı (İlke Kararı 2026/347), sürekli aktarım için de standart sözleşme aranıyor. Plan şöyle ilerler: ayrı ve açık bir rıza ekranı + aşağıdaki kimlik kırpma + sağlayıcıyla standart sözleşme girişimi; yeterli olup olmadığına avukat karar verir (S3). Ayrıca Faz 3'te görüntünün yurt dışına hiç çıkmadığı bir seçenek (Türkiye'de barındırılan model) kalite ve maliyet açısından denenir.
- **Azaltıcı tasarım:** Sağlayıcıya hasta adı, hasta numarası, telefon gitmez; fotoğraftaki isim ve cihaz ekranındaki yazılar gönderilmeden önce kırpılır; cinsiyet isteğe bağlıdır; "eğitimde kullanılmaz, saklanmaz" koşullu API kullanılır. Kimliksizleştirilmiş görüntünün aktarım kuralının dışında kalıp kalmadığı avukata sorulacak (S3).
- **Sohbet de aynı kurala tabidir.** Yapay zekâ sohbeti yurt dışındaki bir modele gider. Sohbete hasta kimliği ve klinik kayıt gönderilmez; yine de yayına alınması S3'ün yanıtına bağlıdır. Doktor onaylı soru-cevap bankası bu kısıttan etkilenmez.
- **Mevcut veritabanı da yurt dışında.** Randevu sisteminin Supabase projesi ABD'de (us-west-1) barındırılıyor; yani bugünkü hasta kayıtları da yurt dışında tutuluyor. Bunun hukuki durumu ve gerekirse taşınması avukata sorulacak (S10).
- **Saklama:** Hastanın yüklediği kaynak fotoğraflar üretimden sonra kısa sürede otomatik silinir (öneri: 30 gün). Üretilen resimler hasta silene ya da hesabını kapatana kadar saklanır.
- **Diğer yükümlülükler:** VERBİS değerlendirmesi, veri ihlali için 72 saat bildirim prosedürü, saklama-imha politikası, işleyen sözleşmeleri, erişim kayıtları.
- **Eski sistemin metni yanlış:** `nbreeda`'daki gizlilik metni görüntülerin üçüncü taraflarla paylaşılmadığını söylüyor; gerçekte yurt dışına gidiyor. Yeni metinler gerçeği yazacak.

### 5.5 Satışı kim yapacak

**Sizin kararınız:** satış internetten, PayTR ile yapılacak. PayTR üye işyeri hesabının hangi tüzel kişi adına açılacağı hâlâ yanıtlanmalı (S1); aşağıdaki kısıt bu yüzden geçerliliğini koruyor. Mağaza sürümlerinde (Faz 5) kredi yine Apple ve Google ödemesiyle satılmak zorunda; PayTR yalnızca web sürümünde kullanılabilir.

Muayenehane tek hekim tarafından şahsen açılır, mesleğe ticari nitelik verilemez; dijital ürün satışı ticari kazançtır. **Çalışma varsayımı:** uygulamanın sahibi, satıcısı ve bebek resmi özelliğinin veri sorumlusu ayrı bir şirket olur; klinik yalnızca klinik verinin sorumlusu kalır. Mağaza hesapları da bu şirket adına açılır. Doktorun şirketteki payı ve klinik ile şirket arasındaki veri paylaşımının dayanağı avukata ve mali müşavire sorulacak (S1).

Sıralamaya etkisi:
- **Faz 2** klinik bakımın uzantısı olan özelliklerle (kendi kaydını görme, randevu, hatırlatma) kliniğin veri sorumluluğunda başlayabilir. Hastanın kendi girdiği kayıtların (kilo, belirti, tekme) sorumlusunun klinik mi şirket mi olacağı S1 ile birlikte sorulur.
- **Faz 3** geliştirilebilir ve deneme kayıtlarıyla sınanabilir, ama gerçek hastalara açılması S1 ve S3 yanıtlanmadan olmaz: rıza metni bir veri sorumlusu adı yazmak, sağlayıcı sözleşmesini biri imzalamak zorunda.
- **Faz 4** S1 yanıtlanmadan başlamaz.

### 5.6 Mağaza kuralları

| Kural | Kaynak | Tasarıma etkisi |
|---|---|---|
| Dijital kredi yalnızca mağaza ödemesiyle satılır; komisyon ilk 1 milyon dolara kadar %15 | Apple 3.1.1, Google Play Ödemeler | Mağaza sürümlerinde uygulama içi satın alma; kartla satış yalnızca web sürümünde |
| Mağaza sürümü başka ödeme yoluna bağlantı veremez, ondan söz edemez | Apple 3.1.1(a) | Mağaza derlemesinde web ödeme ekranı ve bağlantısı bulunmaz |
| Uygulama içinde yazılan kodla özellik açılamaz | Apple 3.1.1 | Ücretsiz hak hesaba sunucudan tanımlanır; hasta kod yazmaz |
| Satın alınan kredinin süresi dolamaz | Apple 3.1.1 | Krediler süresiz |
| Sağlık uygulaması tüzel kişi hesabından yayınlanır; D-U-N-S numarası gerekir | Apple 5.1.1(ix), Google Play | Şirket hesabı (bkz. 5.5) |
| Kişisel veri üçüncü taraf yapay zekâya gönderilmeden önce açık izin | Apple 5.1.2(i) | İlk yüklemeden önce sağlayıcıyı adıyla söyleyen rıza ekranı |
| Hesap oluşturuluyorsa uygulama içinden silinebilmeli | Apple 5.1.1(v), Google Play | Ayarlar'da hesap silme + web'de silme bağlantısı |
| Tıbbi uygulama: doğruluk iddiası kanıt ister, "doktorunuza danışın" hatırlatması gerekir | Apple 1.4.1 | Benzerlik/doğruluk/cinsiyet tahmini iddiası yok; sohbet ve içerikte hatırlatma |
| "Tıbbi cihaz değildir…" ibaresi açıklamada bulunmalı | Google Play sağlık politikası | Mağaza açıklamalarında yer alır |
| Yapay zekâ içeriği: süzme, bildirme düğmesi, iletişim bilgisi | Apple 1.2, Google Play | "Bu sonucu bildir" düğmesi; ultrason olmayan fotoğrafı reddeden giriş kontrolü |
| Web sitesinin kabuğu olan uygulama reddedilir | Apple 4.2 | Yerel bildirim, kamera, gezinme; çıplak web görünümü değil |
| Kullanıcı kitlesi keyfi kısıtlanamaz; inceleme için deneme hesabı gerekir | Apple 3.2.2, 2.1 | Genel gebelik takibi girişsiz çalışır; hasta özellikleri girişin ardında; incelemeciye sabit kodlu deneme hastası |
| Sağlık verisi reklam ve analiz için kullanılamaz | Apple 5.1.3 | Reklam yok; sağlık verisi analitiğe gitmez |

### 5.7 Ultrason etiği

ISUOG, AIUM ve FDA yalnızca hatıra amaçlı ultrasona karşı. Uygulama yalnızca tıbbi gerekçeyle zaten çekilmiş görüntüyü kullanır; klinik uygulama için çekim yapmaz ve uzatmaz. Türk meslek kuruluşlarının bu konuda bir açıklaması bulunamadı ("izinli" anlamına gelmez).

## 6. Mimari

```
Aynı Next.js uygulaması, aynı Supabase projesi
│
├── Mevcut alanlar (dokunulmaz)
│   ├── /admin …            personel paneli        → Supabase Auth + admin_users
│   ├── /randevu, /confirm  herkese açık randevu   → sunucu yolları
│   └── mevcut tablolar     patients, appointments, pregnancy_*, …
│
└── Yeni hasta alanı
    ├── /anne/…             hasta uygulaması (adres adı değişebilir)
    ├── /api/anne/…         yalnızca sunucu; her istek oturumdaki hastaya süzülür
    ├── app_* tabloları     hesap, oturum, tek kullanımlık kod, günlük, belirti,
    │                       tekme, kilo, sorular, üretimler, kredi defteri, ödemeler, rızalar
    ├── özel depolama       hasta yüklemeleri ve üretilen resimler; imzalı, süreli bağlantılar
    └── üretim hattı        nbreeda'dan taşınan mantık (kâğıt okuma → kontrol → üretim → çerçeve)
```

**Ayrım kuralları**
- Yeni alanın adresi `/patient` ya da `/admin` ile başlamaz (ara katman bu iki ön eki yakalıyor).
- Ara katmana yeni alan için ayrı bir dal eklenir; mevcut dallar değişmez.
- `app_*` tablolarında satır düzeyi güvenlik açık, hiçbir herkese-açık ya da giriş-yapmış-kullanıcı kuralı yok: yalnızca sunucu erişir.
- Hasta alanı mevcut klinik tablolarına (`patients`, `appointments`, `pregnancy_*` vb.) hiç erişmez; ne okur ne yazar. İki taraf aynı projede durur ama veri olarak birbirinden bağımsızdır.
- Hesap telefon numarasına bağlıdır; hasta bilgilerini kendisi girer. Kliniğin gönderim ekranı yalnızca `app_*` tablolarını kullanır.
- Sitenin genelindeki yapay zekâ randevu düğmesi hasta alanında gösterilmez.
- Yeni kod için derlemede tip hataları yok sayılmaz.

**Üretim hattı (taşınacak ve değişecekler)**
- Korunan: kilitli üretim yönergesi, kâğıt okuma alan sözlüğü, başlat → durum → sonuç iş akışı, "kredi yalnızca başarıda düşer" kuralı, 18. hafta alt sınırı.
- Değişen: resimler veritabanında değil depolamada tutulur; kredi düşümü eşzamanlı isteklerde güvenli yapılır; çerçeve uygulama markalı ve uzun isimlerde bozulmaz; çıktı kalitesi düşükse otomatik bir kez yeniden denenir; hafta doktorun girdiği tahmini doğum tarihinden hesaplanır, hastanın beyanından değil.
- Sağlayıcı: birincil Google görüntü modeli, yedek ikinci sağlayıcı. Model adları ve fiyatlar Faz 3 başında güncel belgelerden doğrulanır.

## 7. Fazlar

Süreler kaba tahmindir; her fazın kendi planında netleşir. Faz 1, Faz 0 ile aynı anda başlar çünkü kod değil hukuki ve idari iştir ve en uzun bekleme oradadır.

### Faz 0 — Mevcut sistemin güvenliği (önce bu; tahmin 2–3 hafta)

Kural: her adım önce ön izleme ortamında, hem herkese açık randevu akışı hem admin akışı denenerek yayına alınır. Dışarıya açık klinik tablolar şu an neredeyse boş (yaklaşık 3 gebelik kaydı, 1 vizite; tahlil ve tedavi tabloları boş görünüyor), yani bugünkü maruziyet küçük — hasta uygulaması bu tabloları doldurmadan kapatmak doğru sıra.

**Adım 0.1 — Bugün, kod riski yok**

| No | Bulgu | Durum | Yapılacak |
|---|---|---|---|
| G1 | Yeni kayıt olan herkesi yönetici yapan iki tetikleyici canlı veritabanında etkin. Supabase'de herkese açık kayıt açıksa, site anahtarını bilen biri kendini "doktor" olarak kaydedip bütün hasta verisine erişebilir. | **Tetikleyiciler 11.11.2026'da kaldırıldı** (`scripts/drop-admin-signup-triggers.sql`); herkese açık kayıt canlıda açıktı, 11.11.2026'da Supabase CLI ile kapatıldı (`auth.enable_signup = false`) | **Tamamlandı.** Personel hesapları sunucudan (`auth.admin.createUser`) açıldığı için etkilenmez. |
| G2 | Doktor ve sekreter hesabının e-posta ve şifresi depoda açık yazılı (`scripts/003_create_admin_account.sql`, `scripts/004_add_secretary_account.sql`). | Doğrulandı | Satırlar silindi (Plan 1, Görev 1). **Kalan: doktor ve sekreter şifreleri admin panelinden değiştirilecek** — değerler git geçmişinde durduğu için zorunlu. |
| G3 | `nbreeda` deposunda Google, Replicate, Resend ve Emergent anahtarları ile yönetici/doktor giriş bilgileri açık. | Doğrulandı | Tüm anahtarlar yenilenir; depo kapatılsa bile. Eski sistem Faz 3'e kadar klinikte kullanılacağı için yeni anahtarlar aynı anda Emergent ayarlarına girilmelidir, yoksa klinikteki üretim durur (bkz. S11). |
| G4 | `.gitignore` yalnızca `.env*.local` dosyalarını kapsıyor. | Doğrulandı | `.env*` eklenir. **Kod tamam (Plan 1, 11.11.2026); ön izleme denemesi ve canlıya alma bekliyor.** |

**Adım 0.2 — Next.js güncellemesi**

| No | Bulgu | Yapılacak |
|---|---|---|
| G5 | Next.js 16.2.0'da 5 kritik (uzaktan kod çalıştırma) ve 14 yüksek (ara katman atlatma dahil) açık bildirimi var. | En az 16.4.1'e yükseltilir; ön izlemede giriş, randevu, sohbet ve iki zamanlanmış görev denenir. **Kod tamam (Plan 1, 11.11.2026); ön izleme denemesi ve canlıya alma bekliyor.** |

**Adım 0.3 — Yalnızca ekleme olan düzeltmeler**

| No | Bulgu | Yapılacak |
|---|---|---|
| G6 | Sekiz yönetici yolu kendi içinde yetki kontrolü yapmıyor, yalnızca ara katmana güveniyor (hasta bilgisi değiştirme, KVKK onayı, haftalık program vb.). | Her yolun başına ortak yönetici kontrolü. **Kod tamam (Plan 1, 11.11.2026); ön izleme denemesi ve canlıya alma bekliyor.** |
| G7 | Sunucu kayıtlarına personel şifresi, SMS kodları, erişim anahtarları ve hasta formu yazılıyor. | Bu kayıt satırları silinir. **Kod tamam (Plan 1, 11.11.2026); ön izleme denemesi ve canlıya alma bekliyor.** |
| G8 | Herkese açık randevu formuna yazılan isim, personelin günlük liste yazdırma ekranında kod olarak çalışabiliyor; doktorun oturumunda çalışırsa yeni yönetici hesabı açabilir. | Yazdırma şablonunda tüm değerler kaçışlanır; herkese açık yolda isim ve randevu türü doğrulanır. **Kod tamam (Plan 1, 11.11.2026); ön izleme denemesi ve canlıya alma bekliyor.** |
| G9 | Kullanılmayan, yetkisiz çalışan kod: iki SMS yolu, üç sunucu işlemi, iki bileşen. | Silinir. **Kod tamam (Plan 1, 11.11.2026); ön izleme denemesi ve canlıya alma bekliyor.** |

**Adım 0.4 — Herkese açık randevu akışının sağlamlaştırılması (tek paket, iki sihirbazla denenir)**

> **Durum (G10–G19): Kod tamam (Plan 2, 11.11.2026); ön izleme denemesi ve canlıya alma bekliyor.** Veritabanı şeması değişmedi: doğrulanmamış herkese açık randevu `status = 'pending'` ile işaretlenir. Kalan karar: TC'yi bilen biri kendi telefonuyla randevu alıp kodu doğrularsa hasta kaydındaki telefon yine değişir; tam kapatmak için telefonu değişen hastanın sekretere yönlendirilmesi gerekir.

| No | Bulgu | Yapılacak | Bozulma riski ve önlemi |
|---|---|---|---|
| G10 | Bir hastanın TC'sini bilen biri, SMS kodu olmadan o hastanın adını, telefonunu ve doğum tarihini değiştirebiliyor. Hasta uygulaması telefonla giriş yapacağı için bu, hesap ele geçirmeye dönüşür. | Herkese açık yolda mevcut hasta kaydı kod doğrulanmadan güncellenmez. | Sekreterlerin kullandığı "geçici kaydı tamamlama" davranışı personel için aynen kalır. |
| G11 | SMS gönderilemediğinde doğrulama kodu yanıtın içinde geri dönüyor. | Kod yalnızca personele döner. | Sekreterler bunu admin randevularında kullanıyor olabilir; onlar için kalır. |
| G12 | Kod denemesinde sınır yok; kodlar tahmin edilebilir yöntemle üretiliyor. | 5 hatalı denemede kod iptal; güvenli rastgele üretim. | — |
| G13 | Doğrulanmamış randevu hemen takvimde yer tutuyor ve ertesi gün hatırlatma SMS'i alıyor; biri başkasının telefonuna kliniğin adıyla istediği metni gönderebilir. | Telefon başına sınır; doğrulanmamış randevu işaretlenir, hatırlatma atlanır, 15 dakika sonra silinir. | Personelin açtığı randevular hatırlatma almaya devam etmeli. |
| G14 | TC ya da telefonla hasta varlığı ve kara liste durumu sorgulanabiliyor. | Herkese açık yolda tek genel mesaj. | Sihirbazdaki mesaj güncellenir. |
| G15 | Gelecekteki tüm randevuların kimlikleri herkese açık sayfanın içinde gidiyor. | Kimlik alanı gönderilmez. | Herkese açık takvimde yalnızca anahtar olarak kullanıldığı doğrulanır. |
| G16 | Hız sınırlayıcı veritabanı hatasında herkesi geçiriyor; SQL'i depoda yok. | SMS ve yapay zekâ için hata durumunda reddeder; SQL depoya eklenir. | Randevu için mevcut davranış kalır (gerçek hasta engellenmesin). |

**Adım 0.5 — Onay sayfası, bağlantılar, sohbet**

| No | Bulgu | Yapılacak |
|---|---|---|
| G17 | Onay bağlantıları zayıf üretiliyor ve süresiz; onay sayfası randevu satırının tamamını (notlar, ödeme, telefon) tarayıcıya gönderiyor. | Yeni bağlantılar güvenli üretilir; yalnızca gereken altı alan gönderilir. Gönderilmiş eski bağlantılar çalışmaya devam eder. |
| G18 | `/patient` ön eki `/patient-form`'u da yakalıyor ve olmayan bir giriş sayfasına yönlendiriyor. | Ön ek eşleşmesi düzeltilir. |
| G19 | Yapay zekâ sohbetinde mesaj sayısı ve uzunluk sınırı yok; istemci sistem yönergesini değiştirebiliyor olabilir (test edilmedi). | Roller süzülür, uzunluk ve günlük sınır eklenir. |

**Adım 0.6 — Veritabanı kuralları ve dosyalar**

| No | Bulgu | Yapılacak | Bozulma riski ve önlemi |
|---|---|---|---|
| G20 | Gebelik tabloları girişsiz okunabiliyor (`pregnancy_episodes`, `pregnancy_visits`, `pregnancy_outcomes`). | Okuma yalnızca personele. | Admin gebelik ekranı personel oturumuyla çalışıyor; etkilenmez. |
| G21 | Tahlil ve tedavi tabloları girişsiz okunup yazılabiliyor (`hormone_tests`, `hsg_results`, `spermiogram_results`, `ultrasound_results`, `genetic_tests`, `treatments`, `medications`, `procedures`). | Tamamen kapatılır. | Kodda hiçbir yer kullanmıyor. |
| G22 | Doktor notları girişsiz okunup silinebiliyor. | Yalnızca personele. | Hasta detay ekranı personel oturumuyla çalışıyor. |
| G23 | `patients` tablosunda girişsiz güncelleme izni tanımlı (pratikte çalışıp çalışmadığı test edilmedi). | Kaldırılır. | Kodda hiçbir yer kullanmıyor. |
| G24 | Hasta belgeleri, mesaj şablonları ve depolama "giriş yapmış herkese" açık. | "Personel tablosunda olan" koşuluna çevrilir. | Kural yanlış yazılırsa admin ekranları 403 verir; her ekran denenir. |
| G25 | `patient-photos` klasörü herkese açık (3 dosya). | Özel yapılır, imzalı bağlantıya geçilir. | Randevu detayındaki belge bağlantısı imzalıya çevrilmeden klasör kapatılmaz. |
| G26 | Dört veritabanı işlevi girişsiz çağrılabiliyor. | Çağırma izni geri alınır. | Tarayıcıdan çağıran yok. |
| G27 | Zengin metin düzenleyicileri kayıtlı HTML'i süzmeden yüklüyor. | Süzgeç eklenir. | Araç çubuğunun ürettiği biçimler izinli kalır. |

**Adım 0.7 — Roller ve sertleştirme**

| No | Bulgu | Yapılacak |
|---|---|---|
| G28 | Doktora özel ekranlar yalnızca menüde gizli; sekreter ve hemşire aynı işlemleri doğrudan yapabiliyor (hasta silme, serbest SMS, hatırlatma ayarları, personel listesi). | Rol tablosu sizinle belirlenir (S7), sonra yol yol uygulanır. Sekreterlerin günlük işleri kısıtlanmaz. |
| G29 | Güvenlik başlıkları yok; admin paneli başka sitede çerçeve içinde açılabiliyor. | Temel başlıklar eklenir; içerik güvenlik politikası önce yalnızca raporlama modunda. |
| G30 | SMS sağlayıcı şifresi adres satırında gidiyor, kod on yerde kopyalanmış. | Tek ortak gönderim işlevi. |
| G31 | Hata mesajları iç ayrıntıyı kullanıcıya gösteriyor; derleme tip hatalarını yok sayıyor. | Genel mesaj; tip hataları temizlenince kontrol açılır. |

**Faz 0 bitti sayılır:** yukarıdaki her madde kapatılmış, herkese açık randevu + SMS doğrulama + hatırlatma + admin panelinin tüm ekranları ön izlemede ve canlıda denenmiş, veritabanında girişsiz erişilebilen tek şey randevu sayfasının ihtiyaç duyduğu doktor ve program okuması.

### Faz 1 — Hukuki ve idari hazırlık (Faz 0 ile aynı anda; süre dışarıya bağlı)

- Avukat ve mali müşavirle görüşme: bölüm 8'deki S1–S5.
- Şirket yapısının kurulması ya da belirlenmesi; D-U-N-S başvurusu; Apple ve Google şirket hesapları.
- Görüntü sağlayıcılarıyla standart sözleşme imkânının araştırılması (**devam/dur kararı**).
- Aydınlatma metni, açık rıza metinleri, kullanım koşulları, mesafeli satış ön bilgilendirmesi, saklama-imha politikası, ihlal prosedürü.
- VERBİS değerlendirmesi; ticari ileti için İYS kaydı.
- Ödeme sağlayıcısı başvurusu (TCMB lisanslı; iyzico, PayTR vb.), e-arşiv fatura.
- Uygulamanın adı ve markası (S4).

### Faz 2 — Hasta uygulamasının temeli (tahmin 4–6 hafta)

- Kayıt ve giriş: telefon + SMS kodu; oturum; çıkış; hesap silme.
- Başlangıç formu: hasta son adet tarihini ya da tahmini doğum tarihini ve temel bilgilerini kendisi girer.
- Rıza yönetimi: ayrı aydınlatma ve rıza ekranları, geri alma, kayıt.
- Girişsiz mod: hafta hafta gebelik içeriği, tahmini doğum tarihi hesabı (mağaza kuralı için).
- Haftaya göre hazırlık listesi (özellik 3). İçeriği Dr. Eray'dan alınır.
- Kliniğin gönderim ekranı: admin panelinden tüm kullanıcılara ya da seçilen gruba bildirim ve içerik.
- Günlük kayıtlar: kilo, belirti, tekme sayacı, kasılma zamanlayıcı.
- Doktor onaylı soru-cevap bankası ve "vizitede soracaklarım" (özellik 5); genel bilgi veren sohbet.
- Bildirimler: randevu ve hafta hatırlatmaları (tanıtım içermez).
- Ana ekrana kurulum ve web bildirimi.

**Bitti sayılır:** deneme kullanıcıları kayıt olup yalnızca kendi verisini görüyor; klinik gönderimi hedeflenen kullanıcılara ulaşıyor; başka hastanın verisine erişim denemeleri sunucuda reddediliyor; admin ve randevu akışları değişmemiş.

### Faz 3 — Bebek resmi üretimi (tahmin 4–6 hafta; Faz 1'deki sözleşme kararına bağlı)

- Çekim akışı: ölçüm kâğıdı + ultrason görüntüsü; kamera ve galeri; basılı çıktı ya da ekran fotoğrafı ikisi de kabul edilir.
- Otomatik kontrol: ultrason mu, yüz görünüyor mu, bulanık mı; uygun değilse üretmeden yeniden çektirir.
- Gönderim öncesi kimlik kırpma (bkz. 5.4).
- Üretim hattının taşınması (bkz. bölüm 6). Kaynak: `https://github.com/gkhneski/nbreeda` deposundaki `backend/generation/` (yönerge `ultrasound_4k.py`, kâğıt okuma `biometric_ocr.py`, görüntü kontrolü `image_validator.py`, çerçeve `polaroid_frame.py`). Depo kapatılmadan önce bu dosyalar yeni koda aktarılmış olmalı.
- **Kalite çalışması:** Dr. Eray'ın referans vakalarıyla ölçümlü/ölçümsüz ve profil/profil+önden karşılaştırma; kabul ölçütü onunla belirlenir.
- 18. hafta kuralı, hassas durum kilidi (özellik 13), "bu sonucu bildir" düğmesi.
- Galeri, indirme, uygulama markalı çerçeve.
- Ücretsiz ilk hak (sunucudan tanımlanır).

**Bitti sayılır:** deneme hastaları kendi telefonlarından, yardımsız, resim üretebiliyor; başarısız üretim hak düşürmüyor; görüntüler yalnızca sahibine açık; Dr. Eray kaliteyi onaylamış.

### Faz 4 — Kredi ve ödeme (tahmin 2–3 hafta; S1 yanıtlanmadan başlamaz)

- Kredi defteri: her hareket kayıtlı, eksiye düşmez, eşzamanlı isteklerde güvenli.
- Web sürümünde kartla ödeme, ön bilgilendirme ve onay, e-arşiv fatura, kullanılmamış kredi iadesi.
- Fiyat: eski plandaki 1 kredi = 150 TL başlangıç varsayımıdır; paketler denenerek belirlenir.

### Faz 5 — Mağaza sürümleri (tahmin 3–5 hafta + inceleme süresi)

- Aynı kodun yerel kabuğu: bildirim, kamera, gezinme.
- Uygulama içi satın alma (Apple ve Google); mağaza derlemesinde web ödemesi yok.
- İncelemeci için deneme hastası; inceleme notları; gizlilik etiketleri ve veri güvenliği formu; Google sağlık beyanı; yaş derecelendirmesi (beklenen 16+).
- Küçük İşletme Programı başvurusu.

### Faz 6 — Farklılaştırıcı özellikler (sırayla, her biri ayrı)

Vizite öncesi özet (6) → yüz serisi (7) → doğum sonrası karşılaştırma (8) → aile odası (9) → Bulgarca (11) → basılı albüm (10).

### Faz 7 — Doğum sonrası ve kadın sağlığı

Doğum sonrası takip, ardından adet ve genel kadın sağlığı modu (özellik 12). Böylece hasta doğumdan sonra da uygulamada kalır.

### Kapanış — eski sistem

Sizin kararınız: Emergent tamamen bırakılıyor ve planlamada hesaba katılmıyor. Yapılacaklar: oradaki açık anahtarlar iptal edilir (G3), `nbreeda` deposu üretim hattı dosyaları yeni koda aktarıldıktan sonra kapatılır, oradaki hasta görüntüleri için silme kararı verilir.

## 8. Sizin ve danışmanların yanıtlaması gerekenler

**11 Kasım'da yanıtlananlar:** S4 (ad: neobreedai.com), S9 (klinik kayıt tutmayacak; hasta kendi doldurur, uygulama randevu sisteminden bağımsız), S11 (Emergent hesaba katılmıyor, anahtarlar iptal edilir). S1 kısmen yanıtlandı (satış PayTR ile; hangi tüzel kişi adına olduğu açık). S3 için yönünüz belli (Türkiye'de kalsın ya da açık onayla gitsin); yeterliliği avukatta. S8 yanıtlandı: herkes kayıt olabilir, ücretsiz ilk üretim yalnızca kliniğin onayladığı hesaplara. S2'nin kod kısmı da böylece çözüldü (kod yok, klinik onayı var); klinik onayının tanıtım yönetmeliği açısından durumu avukatta kalıyor.

| No | Soru | Kime | Neyi etkiler |
|---|---|---|---|
| S1 | Krediyi kim satacak: ayrı şirket mi, doktorun şirketteki rolü ne olabilir? | Avukat + mali müşavir | Faz 4, mağaza hesapları, veri sorumluluğu |
| S2 | Siz ilk üretimin klinikten verilen kodla ücretsiz olmasını istediniz. Ben kod yerine hesaba otomatik tanımlanan ücretsiz hak öneriyorum (Apple kod yazmayı yasaklıyor, yönetmelik klinik hediyesini riskli kılıyor). Hangisi olacak; ayrıca fiyat gösterimi ve uygulamanın klinikte önerilmesi 2025 tanıtım yönetmeliğine göre nasıl yapılabilir? | Siz + avukat | Ücretsiz hak, klinikte tanıtım |
| S3 | Kimliği kırpılmış ultrason görüntüsü yurt dışı aktarım kuralının dışında kalır mı; kalmıyorsa standart sözleşme nasıl imzalanır? | Avukat | Faz 3'ün çıkıp çıkamayacağı |
| S4 | Uygulamanın adı ne olacak? "NeoBreed" mi, yeni bir ad mı? | Siz | Çerçeve, mağaza kaydı, alan adı |
| S5 | Muayenehane uzaktan sağlık hizmeti izni alabilir mi? | İl Sağlık Müdürlüğü | İleride doktora soru özelliği |
| S6 | Hassas durum kilidi (özellik 13) kabul mü? Personelin tek dokunuşluk bir işi olur. | Siz + Dr. Eray | Faz 3 |
| S7 | Sekreter ve hemşire hangi işlemleri yapabilmeli (hasta silme, serbest SMS, hatırlatma ayarları)? | Siz + Dr. Eray | Faz 0, adım 0.7 |
| S8 | Uygulamayı yalnızca kliniğin hastaları mı kullanacak, yoksa dışarıdan gelenler de girişsiz takip modunu kullanabilsin mi? (Mağaza kuralı girişsiz kullanılabilir bir bölüm istiyor.) | Siz | Faz 2, Faz 5 |
| S9 | Klinik her gebeliği admin panelindeki gebelik modülüne kaydedecek mi (tahmini doğum tarihi, viziteler)? Kaydetmezse "Benim gebeliğim" ekranında yalnızca hastanın kendi girdiği tarih ve randevuları görünür; vizite geçmişi, kilo ve tansiyon boş kalır. | Siz + Dr. Eray | Faz 2'nin ana ekranı, özellik 2, 3, 6 |
| S10 | Mevcut hasta veritabanı ABD'de barındırılıyor. Bu durumun KVKK açısından düzeltilmesi gerekiyor mu, nasıl? | Avukat | Faz 0 sonrası olası taşıma |
| S11 | Emergent üzerindeki eski sistemin ayarlarına kim erişebiliyor? Anahtarlar yenilenirken oraya da girilmesi gerekiyor; erişim yoksa klinikteki üretim kısa süre durur. | Siz | Faz 0, adım 0.1 (G3) |

## 9. Doğrulanmamış ve dikkat edilecek noktalar

- Mevzuat bulgularının çoğu ikincil kaynaklardan (hukuk büroları, yeniden yayımlanmış metinler). 2025 tanıtım yönetmeliği ve 2022 uzaktan sağlık yönetmeliği Resmî Gazete aslından okunmadı.
- Supabase'de herkese açık kaydın açık olup olmadığı kontrol edilmedi (G1).
- G11'in sabit hat numarasıyla tetiklenmesi, G12'nin kaba kuvvetle kırılabilirliği, G19'daki yönerge değiştirme ve G23 çalıştırılarak denenmedi.
- Tablo satır sayıları veritabanının yaklaşık tahminidir.
- Rakip uygulamalarda "yok" denen özellikler için arama yüzeyseldi.
- Türkiye'de mağaza dışı ödeme için bir izin programı bulunamadı; Rekabet Kurumu'nun Apple (Mayıs 2024) ve Google (Ağustos 2025) soruşturmalarının sonucu bulunamadı.
- Üretim maliyeti için eldeki tek rakam eski sistemin Mart 2026 iç tahmini (resim başına 0,03–0,05 dolar); düşük olabilir, Faz 3'te ölçülecek.

## 10. Kaynaklar

**Mağaza kuralları**
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple hesap silme: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Apple Küçük İşletme Programı: https://developer.apple.com/app-store/small-business-program/
- Google Play sağlık içeriği: https://support.google.com/googleplay/android-developer/answer/16679511
- Google Play ödemeler: https://support.google.com/googleplay/android-developer/answer/9858738
- Google Play kullanıcı verisi: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play yapay zekâ içeriği: https://support.google.com/googleplay/android-developer/answer/14094294
- iOS web bildirimi: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

**Mevzuat**
- KVKK metni: https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf
- KVKK idari para cezaları: https://www.kvkk.gov.tr/Icerik/8145/6698-sayili-kisisel-verilerin-korunmasi-kanunu-kapsaminda-idari-para-cezasi-tutarlari
- Kurul kararı 2023/787: https://www.kvkk.gov.tr/Icerik/7692/2023-787
- KVKK üretken yapay zekâ rehberi: https://www.kvkk.gov.tr/Icerik/8547/uretken-yapay-zeka-ve-kisisel-verilerin-korunmasi-rehberi-15-soruda
- 2025 tanıtım yönetmeliği (yeniden yayım): https://www.alomaliye.com/2025/11/12/saglik-hizmetlerinde-tanitim-ve-bilgilendirme-faaliyetleri-hakkinda-yonetmelik-2025/
- Uzaktan sağlık yönetmeliği (yeniden yayım): https://www.alomaliye.com/2022/02/10/uzaktan-saglik-hizmetlerinin-sunumu
- İlke Kararı 2026/347: https://www.alomaliye.com/2026/03/24/kvkkdan-yeni-ilke-karari-acik-riza-metni-ile-aydinlatma-metni-artik-ayri-duzenlenmeli/
- Mesafeli Sözleşmeler Yönetmeliği: https://www.lexpera.com.tr/mevzuat/yonetmelikler/mesafeli-sozlesmeler-yonetmeligi
- Tıbbi cihaz yazılımları: https://hukukcularevi.com/tibbi-cihaz-yazilimlari-ne-zaman-tibbi-cihaz-sayilir/
- ISUOG açıklaması: https://isuog.org/asset/1123EE3F-8ED0-42D3-BFDA948166245CC1

**Rakipler ve pazar**
- GE Natural Portrait View: https://www.gehealthcare.com/en-gb/products/ultrasound/voluson/natural-portrait-view
- Be·ia Technology: https://www.isuog.org/events/isuog-world-congress-2025/event-information/meet-our-sponsors-and-exhibitors/be-ia-technology.html
- Ultrasound to Photo AI: https://mwm.ai/apps/ultrasound-to-photo-ai/6744644476
- Gebelik uygulamaları karşılaştırması: https://unstar.app/blog/ovia-what-to-expect-babycenter-pregnancy-plus-glow-pregnancy-apps-ranked-2026
- Babyscripts: https://apps.apple.com/app/id1463084234
- Mozilla gizlilik incelemesi: https://www.mozillafoundation.org/en/research/library/in-post-roe-v-wade-era-mozilla-labels-18-of-25-popular-period-and-pregnancy-tracking-tech-with-privacy-not-included-warning/
- Abonelik kıyaslamaları: https://adapty.io/state-of-in-app-subscriptions/
- Hatıra ultrasonu (FDA): https://www.fiercehealthcare.com/it/fda-issues-update-discouraging-keepsake-ultrasounds
