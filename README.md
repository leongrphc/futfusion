# FutFusion SBC

## Güncel sürüm: 0.8.0

Çalışan 0.7.2 hâli Git'te `b90fa30` commit'iyle saklanır. Yeni geliştirmeler ayrı commit'lerdedir.

- **Yeni çalışma alanı:** Açık yüzeyler, mavi ana işlemler, yeşil saha, Türkçe dil seçeneği, dar ekranda liste görünümü ve klavyeyle sekme geçişi.
- **SBC:** Oyuncudaki **Düzenle** menüsüyle değiştir, kaldır veya bu kart sürümünü kalıcı korumaya al. Oyuncu seçicisinde değişikliğin reyting ve kimya farkını gör. **Geri al / İleri al** düzenlemeleri geri getirir. Son yerleştirme düğmesi daima panelin altında görünür.
- **Çözüm tercihleri:** Dengeli kart maliyeti, yeni coin harcamasını azaltma veya yüksek reytingli kartları saklama. Kaynak ayarından depoyu öne alabilirsin. Bunlar arama öncelikleridir; mutlak en ucuz çözüm garantisi değildir.
- **Kulüp:** Koruma profilleri kaydedilebilir. Kart korumaları EA hesabına göre ayrılır. Depo kartları ve kulüpteki kopyaları ayrıca görülebilir.
- **Gallery:** İşlem aşamaları, devam etme bilgisi, harcanan coin, kalan takım bütçesi, bağlı coin, beklenen gelir ve gerçekleşen net sonuç ayrı gösterilir. Ayrı fiyat/alım/satış işlemleri **Adımları ayrı ayrı yönet** içindedir.
- **Satış:** Alınmış kartta alış fiyatı, vergi sonrası başa baş veya özel Hemen Al hedefi seçilebilir. **Satış durumunu kontrol et** tam kart kopyasını Transfer Listesi'nden okur; kesin satış ve gerçek fiyat bulunursa kaydı günceller. Kart listede yoksa satıldı varsayılmaz.
- **Kişisel plan:** EasySBC kadrosunu getirdikten sonra eksiklerin referans bütçesi, elle girilen önceki token kazanımından kalan token ve tahmini coin/token gösterilir. **Karşılaştırmaya ekle** ile getirdiğin setleri karşılaştır; ortak kartların tek sayıldığı planı incele. Karşılaştırma bu oturumdadır; token kazanımın bu hesap için saklanır. İşlem kuyruğu tek aktif takımda kalır.
- **Geçmiş ve yedek:** Gallery içindeki **Hesap özeti ve işlem günlüğü** ile son 200 kaydı incele. **İşlem geçmişini yedekle** ile alış listesini ve günlüğü dışa/içe aktar. Bu yedek eski Gallery Export dosyasından ayrıdır. İçe aktarma aynı hesabı gerektirir, aktif takım ve bütçeyi sıfırlar; belirsiz mevcut işlem varsa üzerine yazmaz.
- **Performans:** Normal SBC hesaplaması uzantının arka plan işçisinde çalışır. Panelden iptal edilen sonucun uygulanması engellenir; başlamış yerel hesaplama arka planda tamamlanabilir. Kulüp verileri bu hesaplama için harici servise gönderilmez.
- **Sekmeler:** Aynı hesap için Gallery işlem sırası ve SBC yerleştirme, tarayıcının ortak işlem kilidini kullanır. Yarım kalan takımda önceki doğrulanmış alışlar toplam bütçeden düşülür.

Uzantıyı `chrome://extensions` üzerinden yenile, sonra Web App'i yenile. Türkçe için **Kulüp → Dil → Türkçe** seç. Önceki dil tercihin korunur. SBC'yi gönderme işlemi sana aittir.

Doğrulama ve sınırlar: [0.8.0 sürüm notları](docs/UPGRADE-0.8.0.md). Aşağıdaki sürüm başlıkları önceki geliştirmelerin ayrıntılı geçmişidir.


FutFox SBC planning + an AutoPilot-SBC-inspired squad placement adapter, in one unpacked Chrome extension.

## Kurulum ve kullanım

1. Chrome’da `chrome://extensions` sayfasını aç ve Geliştirici modunu etkinleştir.
2. FutFox ve AutoPilot-SBC’nin diğer kopyalarını devre dışı bırak.
3. **Paketlenmemiş öğe yükle** ile bu `futfusion` klasörünü seç.
4. EA Web App’i yenile. FutFusion panelinde Club → Load my club ile kulübü ve SBC deposunu yükle.
5. SBC setini aç; panelde SBC → Refresh ile görevi seç.
6. Find cheapest squad ile kadroyu hesapla. Otomatik uygulama için market önerileri yerine sahip olduğun kartlarla çözüm üret.
7. Aynı SBC’nin saha ekranını Web App’te aç. Sonuç ekranında **Solve Squad** düğmesine bas.
8. Kadro yerleştirilir, kaydedilir ve tekrar yüklenerek yuvalar kontrol edilir. EA’nın şartlarını gözden geçirip SBC’yi kendin gönder.

## Kapsam

- FutFox’un kadro hesaplaması, koruma filtreleri, maliyet ve kimya hesapları korunur.
- Yeni düğme hesaplanmış normal SBC kadrosunu veya puan SBC kart seçimini uygular; tekrar çözüm başlatmaz.
- SBC deposundaki seçili kartlar gerektiğinde kulübe taşınır. EA taşıma işlemini reddederse kaydetme yapılmaz; depodaki kartlarla kulüp kopyaları arasındaki çakışmalar otomatik takas edilmez.
- Normal SBC’lerde mevcut kartlar şartlar tamamlanmasa da taslak olarak yerleştirilir. Boş yuvalar ve market önerileri boş bırakılır; aynı oyuncunun tekrarı, kullanılamayan kartlar ve farklı açık SBC reddedilir.
- Puan/Streamlined SBC’lerde kart seçicisini açıp sonuç ekranındaki Solve Squad düğmesine bas. Önerilen kartlar mevcut seçimin yerine seçilir; gönderim yapılmaz. Seçim sınırı, kart puanları ve SBC ilerlemesi kontrol edilir; seçim hatasında önceki kartlar geri yüklenmeye çalışılır.
- Multi, Entire Set, Sequence Solver ve otomatik gönderim bu birleşime dahil değildir.
- Yeni yerleştirme arayüzü Türkçedir; mevcut FutFox ekranları orijinal dil desteğini korur.

## Gallery alış–satış listesi (v0.4.0)

Gallery kartlarını kadroya yerleştirmez: kulübe giriş üzerinden ilerleyen alış–satış takibi sunar.

1. Gallery’de bir seti aç. **Suggest cards for** alanından hedef dereceyi seçerek eksik kart önerilerini hesaplat.
2. **Önerilen eksikleri listeye ekle** düğmesine bas. Kulüp hafızasında bulunan sürümler atlanır; aynı kart tekrar eklenmez.
3. Liste aynı kartın başka hangi setlerin boş yuvalarına uyduğunu gösterir; birden fazla sete katkı adayları öne çıkar. Bu sayı ekleme anındaki eşleşmedir, tüm setlerin tamamlanacağı anlamına gelmez.
4. **Alış fiyatı** ve **Satış fiyatı / beklenti** alanlarını doldur. Vergi varsayımı başlangıçta %5’tir ve değiştirilebilir. Elle girilen fiyatlar tahmindir; En ucuzu bul canlı ilan araması yapar, başarılı satın almada gerçek alış fiyatını otomatik yazar. Satış değerini işlemden sonra güncelle. Vergi yuvarlaması temkinli bir tahmindir.
5. Kartı oyunda satın alıp kulübe gönder. **Aldım** ile işaretle; **Club → Load my club** ile kart hafızasını yenile.
6. **Kart hafızada** bilgisi yalnızca bu sürümün görüldüğünü söyler. Oyundaki Gallery kaydını kontrol edip **Gallery’de doğruladım** düğmesine bas.
7. Oyunda satışı gerçekleştirdikten sonra gerçek fiyatları girip **Sattım** ile kapat. Gallery doğrulaması elle yapılır; alış ve satışa koyma aşağıdaki düğmelerle tekli/toplu yapılabilir. Gallery’ye doğrudan kayıt yazılmaz.

İşlem listesi yalnız son eklenen aktif kadronun kartlarını gösterir. Eski kayıtlar geçmiş bölümünde salt okunur tutulur; toplu işlemlere dahil edilmez. Alış toplamı tüm girilmiş alış fiyatlarının toplamıdır; gerekli en yüksek anlık bütçenin hesabı değildir. Net maliyet, alış eksi vergi sonrası satış beklentisidir; eksik fiyatlı kartlar bu hesaba dahil edilmez. Eksi maliyet tahmini kârdır.

Liste bu tarayıcıda EA hesabına göre ayrı saklanır. Orijinal Gallery Export/Import dosyasına dahil değildir. Durum sıfırlama ve listeden çıkarma düğmeleri yalnız bu listeyi değiştirir; oyuna ve mevcut Gallery kayıtlarına dokunmaz. Mevcut öneriler ilk sayfadaki kartlara dayanabilir; en ucuz piyasa alışını veya en iyi set kombinasyonunu garanti etmez. Hedef derece önerisi bulunmayan setlerde bu sürümden yeni alış listesi üretilemez.

### En ucuzu bul → fiyatı gör → Satın al

Alış listesindeki her kartta **En ucuzu bul** düğmesi vardır. Bu düğme yalnız arar, satın almaz. EA’nın Satın Al ilanları içinde tam kart ID’si, reyting, sürüm ve holografik durumu kontrol edilir. İlk sayfanın en ucuz olduğunu varsaymak yerine fiyat üst sınırı daraltılarak daha düşük ilanlar araştırılır. Başlangıç arama sınırı 15.000.000 coin’dir. Arama bir piyasa anlık görüntüsüdür; değişen ilanlar ve EA’nın arama sonuçları nedeniyle tüm piyasa için kalıcı en düşük fiyat garantisi değildir.

Fiyat bulunduğunda **1.250 coin — Satın al** benzeri bir düğme görünür. Yalnız bu düğmeye basınca, gösterilen ilan aynı tutarda yeniden aranır ve EA’nın satın alma servisine tek istek gönderilir. İlan yoksa, fiyat değişmişse veya 60 saniye geçmişse alış yapılmaz; daha pahalı başka kartla otomatik devam edilmez. Başarılı alışın gerçek tutarı listeye yazılır ve kart kulübe gönderilir. Kulübe gönderme başarısızsa kart zaten alınmıştır; Transfer Hedefleri’nden kendin gönder.

Alış isteği sırasında yenileme veya yanıt hatası olursa sonuç belirsiz olabilir. Liste kalıcı bir bekleme işareti tutar ve tekrar satın almayı engeller. Kulübü ve Transfer Hedefleri’ni kontrol et: kart alındıysa **Aldım**, alınmadığından eminsen **Durumu sıfırla** ile devam et. Otomatik tekrar alış yoktur. Piyasa araması da bu düğmeler dışında kendiliğinden başlamaz.

### Toplu işlemler ve alış fiyatından satışa koyma

Hem set sayfasında hem Gallery ana sayfasında yalnız son getirilen ve listeye eklenen aktif kadro işlenir. Üst bölüm toplam alım tavanını, fiyatı bulunan kart sayısını, satışa hazır kartları ve tahmini vergi kaybını gösterir.

1. **Kartların fiyatını bul**: listedeki alınmamış ve belirsiz alış kilidi olmayan kartları sırayla arar. Bu adım para harcamaz.
2. **Kartları al · en fazla … coin**: fiyatı bulunmuş kartlar için gösterilen tutarları kart başına tavan olarak sabitler. Her kartın ilanı yeniden aranır; o tutara veya daha ucuza varsa alınır. Daha pahalı kartla devam edilmez. Tekli aramadaki 60 saniyeyi geçen toplu önizlemeler, aynı tavanla yeniden doğrulanabilir. Gösterilen toplam aşılmaz; henüz fiyatı olmayan kartlar bu tıklamaya dahil değildir.
3. **Alınanların Gallery kaydını kontrol ettim · hepsini doğrula**: oyunda gerçekten kontrol ettikten sonra bas. Bu yalnız yerel onay kaydıdır.
4. **Kartları alış fiyatından satışa koy**: Gallery onayı, geçerli alış fiyatı ve satın alınan kart örnek ID’si olan kartları sırayla Transfer Listesi’ne gönderir ve **1 saatliğine** listeler; aktif ilanı Transfer Listesi’nden tekrar okuyarak doğrular. Hemen Al fiyatı kendi kayıtlı alış tutarına eşittir; EA’nın istediği gibi başlangıç fiyatı bir alt kademedir. Bu fiyat EA’nın güncel aralığına uymuyorsa otomatik başka fiyat seçilmez.

“Satışta” etiketi satışın gerçekleştiği anlamına gelmez; gerçekten satıldığında **Sattım** ile kapat. Aynı fiyattan satmak vergi nedeniyle net kayıp oluşturur; tahmini toplam üst bölümde gösterilir. Transfer listesi doluluğu, EA hataları veya uygunsuz kartlar raporlanır; kartlar silinmez veya hızlı satılmaz.

**Sırayı durdur**, başlamış isteği geri almaz; tamamlandıktan sonra sonraki karta geçilmez. Sonucu belirsiz bir alış veya listeleme tüm sırayı durdurur ve kalıcı kilit bırakır. Transfer Listesi’ni kontrol edip satırdaki doğrulama düğmeleriyle belirsizliği çöz; otomatik tekrar istek gönderilmez.

v0.3 ve öncesinde kartın örnek ID’si tutulmuyordu. Bu eski alışları satmak için önce **Club → Load my club** ile yenile; kart satırında **Kulüpteki tek kopyayı bu alışa bağla** düğmesini kullan. Yalnız tam sürümle eşleşen tek bir takas edilebilir kopya varsa bağlanır; birden çok kopya varsa otomatik seçim yapılmaz. Yeni alışlarda örnek ID’si otomatik kaydedilir.

## EasySBC’den Gallery kadrosu alma (v0.5.0)

Gallery ana sayfasında yeni **EasySBC’den kadro al** bölümü var. Bu bölüm orijinal FutFox setlerini ve planlayıcısını değiştirmez.

1. Uzantıyı yenile, ardından Web App’i yenile. Yeni sürüm yalnız EasySBC’nin herkese açık Gallery API’sini okumak için `https://api-fc27.easysbc.io/*` erişimini kullanır.
2. **EasySBC setlerini getir** düğmesine bas. Konsol / PC fiyat platformunu ve seti seç. Setler EasySBC’nin piyasa verisindeki tahmini vergi kaybının toplam Gallery tokenına oranına göre sıralanır; kişisel tamamlanma ilerlemeni içermez.
3. Hedef dereceyi seçip **Seçilen kadroyu getir** düğmesine bas. Kart listesini, kaynak bütçeyi ve vergi kaybını incele. Güncellik uyarısı varsa kaynak fiyatlarına güvenerek alış yapma.
4. **Eksik kartları alış listesine ekle** ile yalnız kulüp hafızanda görülmemiş sürümleri ekle. Aynı kart tekrar eklenmez; önceki alımların fiyatı ve durumu korunur. İçe aktarma eski önerileri kaldırmaz, kendiliğinden satın almaz.
5. Alttaki toplu alış bölümünde canlı fiyat araması başlat; gösterilen toplamı değerlendirip satın al. Sonraki Gallery doğrulama ve alış fiyatından listeleme akışları aynen kullanılabilir.

EasySBC fiyatları referanstır; gerçek alış fiyatını doldurmaz veya fiyat onayı oluşturmaz. Kulüp verisi, EA kimliği, şifre, çerez veya EasySBC giriş tokenı bu bağlantıya gönderilmez. Yalnız herkese açık piyasa çözümleri kullanılır; kişisel çözüm oluşturma veya ücretli uç noktalar çağrılmaz. İlk sahip kartını varsayan, yanlış set ID’li, eksik sürümlü veya kart sayısı tutmayan çözümler reddedilir.

Kaynak set, alış listesinde `EasySBC · set adı · derece` şeklinde görünür. Kartlar uygun boş yuvalara sahip mevcut FutFox setleriyle de ilişkilendirilebilir. Setlerin ID alanları birbirinden ayrıdır; mevcut Gallery kayıtlarına yerleştirme veya tamamlandı işareti yazılmaz.

`npm run check:easysbc` temiz bir Brave profiline uzantıyı yükleyip gerçek herkese açık API bağlantısını kontrol eder. EA sayfasını yerel örnek sayfayla değiştirir; EA hesabı kullanmaz. Set listesi, OGC Nice S çözümü, 15 kartlık içe aktarma ve tekrar aktarımda tekilleştirme denetlenir. Önizleme `artifacts/easysbc/live-public-preview.png` altına yazılır.

## SBC kadrosunu elle düzenleme (v0.6.0)

Normal SBC’nin sonuç ekranında artık her oyuncuda **Kaldır** ve **Elle değiştir** düğmeleri bulunur. Kaldır yalnız seçili yuvayı boşaltır; yerine otomatik oyuncu koymaz. Boş yuvadaki **Oyuncu ekle** düğmesi kulüp/SBC deposu seçicisini açar.

- Oyuncu adını arayabilir, pozisyona veya SBC’nin belirli takım/lig/ülke/kalite şartına göre filtreleyebilirsin. Karşılanmamış belirli takım şartı varsa seçici öncelikle o şartı filtreler.
- Normal koruma ayarları geçerlidir. **Korunan / aktif kadro kartlarını da göster** seçeneğini kendin açarsan aktif kadro, reyting koruması ve takas edilemez filtresi bu seçim için kaldırılır. Kullanılamayan kiralık/evrim kartları yine listelenmez.
- Elle eklenen oyuncu **Sabit ✓** olarak işaretlenir. Diğer oyuncular değişmez. **Elle seçtiklerimi koru · kalanı yeniden çöz** düğmesi sabit kartları koruyarak yalnız geri kalanı yeniden hesaplar. Sabit düğmesine basarak kilidi kaldırabilirsin.
- Her kaldırma ve eklemede reyting, kimya, maliyet ve şartlar yeniden hesaplanır. EA’nın kimya hesabı mevcutsa onu esas alır. Şartlar karşılanmasa veya bazı yuvalar boş olsa da Solve Squad mevcut kartları taslak olarak uygular; boş yuvalar korunur. SBC’yi otomatik göndermez.
- Aynı oyuncunun iki farklı kart sürümü birlikte kullanılamaz.

Belirli takım şartı kartın gerçek takım ID’siyle değerlendirilir; kimya için kullanılan bağlı takım ID’si bu şartın yerine kullanılmaz. Çözücü eksik belirli takım/lig/ülke/kalite şartlarına uyan oyuncuları daha doğrudan araştırır. Ancak kulüpte ve seçili filtrelerde uygun oyuncu yoksa çözüm uydurulmaz; kırmızı şartı elle düzeltmen veya kulübü yenilemen gerekir.

Bu elle düzenleyici normal formasyon SBC’leri içindir; puan SBC’lerinin mevcut seçim akışı korunur. **Kaldır**, Web App’teki gerçek kadroya anında yazmaz; paneldeki öneriyi değiştirir. Son kadroyu uygulamak için **Solve Squad** kullan.

`npm run check:squad-editor` gerçek paneli ve çözücüyü örnek kulüp verisiyle Brave’de açar; kaldırma, korunan oyuncuyu elle seçme, takım şartının güncellenmesi ve sabit kartın yeniden çözmede korunmasını denetler. Gerçek EA hesabı kullanmaz.

## Eksik kadroyu taslak olarak yerleştirme (v0.6.1)

**Solve Squad**, normal SBC’lerde şartların tamamının sağlanmasını artık beklemez. Örneğin 10 oyuncu varsa onları kendi yuvalarına yerleştirip kalan yuvayı boş bırakır. Tam kadro olup takım, kimya veya reyting şartı tutmasa da yerleştirir; Web App’te kendin düzeltirsin. Market önerileri gerçek kart olmadığı için boş yuva olarak bırakılır. Yalnız yerleştirilen yuvalar panelde işaretlenir; işlem sonucu oyuncu ve boş yuva sayısını bildirir.

Yanlış SBC, aynı oyuncunun tekrarı, artık kulüpte bulunmayan veya kullanılamayan kartlar engellenmeye devam eder. Hiç gerçek oyuncusu olmayan öneri mevcut oyun kadrosunu temizlemez. Kilitli yuvalar korunur. Kaydetme sonrası dolu yuvalar ve boş kalması gereken yuvalar tekrar yüklenerek kontrol edilir. Puan SBC’lerinin seçim akışı değişmedi; gönderme işlemi yine kullanıcıya aittir.

## Tümünü yap ve gerçek aktif satış (v0.7.0)

Gallery alış listesinde artık **Tümünü yap** düğmesi var. Üstündeki **toplam alış bütçesi** alanına harcanabilecek toplam coin tutarını gir. Bütün bekleyen kartların fiyatı zaten bulunduysa önizleme toplamı başlangıç bütçesi olarak gösterilir. Yalnız daha önce alınmış kartlardan devam edilecekse 0 coin bütçe yeterlidir.

Tek tıklamayla, listedeki her kart için şu sıra çalışır:

1. Alınmamış kartın en düşük fiyatını araştırır; varsa önceden gösterilmiş kart tavanını ve toplam kalan bütçeyi aşmadan satın alır.
2. Satın alınan tam kart kopyasını kulübe gönderir ve kulüp aramasında aynı örnek ID’si ile göründüğünü doğrular. Bu kartı yerel Gallery hafızasına da kaydeder.
3. Kullanıcının anlattığı kulübe giriş esasına göre bu doğrulamadan sonra satışa geçer; her kart için ayrıca manuel Gallery onayı istemez. Bu kontrol Gallery’nin ayrı derece/ödül servisini sorgulamaz.
4. Kartı Transfer Listesi’ne taşır ve gerçek satış ilanı açar. **Hemen Al = alış fiyatı**, **başlangıç = bir alt EA fiyat kademesi**, **süre = 1 saat**. Örneğin 1.000 coin alışta başlangıç 950, Hemen Al 1.000 olur. Açık artırmada daha düşük tutara satılabilir; ayrıca vergi uygulanır.
5. Transfer Listesi’ni yeniden okuyup aynı örnek ID’sinde, doğru Hemen Al fiyatıyla, geçerli trade ID’si olan aktif ilanı doğrular. Yalnız taşıma veya listeleme isteğinin olumlu yanıtı başarı sayılmaz.

Eski sürümde başlangıç ve Hemen Al eşit gönderiliyordu; EA’nın kendi listeleme ekranı bu fiyatları ayrı kademelerde tutuyor. Bu düzeltme ayrıca eksik fiyat aralığı verisini yükler ve taşıma sonrası güncel Transfer Listesi DTO’sunu kullanır.

Yeni akış önceden alınmış kartları tekrar satın almaz. Eski, aktifliği doğrulanmamış “satışta” kayıtlarını kontrol eder: ilan zaten aktifse kaydı doğrular; kart açıkça pasifse kulübe giriş / satış sırasından devam eder. Sonucu belirsiz alışlar otomatik tekrar alınmaz. Eski kayıtta örnek ID’si yoksa yalnız sahip olunan tam sürümün tek takas edilebilir kopyası bulunursa bağlanır; birden çok kopya arasında seçim yapılmaz.

**Sırayı durdur** başlamış isteği geri almaz; sıradaki yeni işlemi durdurur. Bütçe yalnız yeni alışların brüt toplamına uygulanır; henüz satılmamış ilanlardan gelecek coin varsayılmaz. Belirsiz alış veya satış sonucu kalıcı kilit bırakır ve sıra durur. Satışta işaretlenen kart henüz satılmış değildir.

Mevcut ayrı arama / alım / satış düğmeleri de kullanılabilir. Normal SBC düzenleme, puan SBC seçimi ve EasySBC içe aktarma akışları korunur. Testler örnek EA nesneleriyle ve örnek verili Brave arayüzüyle yapıldı; yeni satış düzeltmesi gerçek EA hesabında henüz doğrulanmadı.

## Takım takım işlem kapsamı (v0.7.1)

**Tümünü yap artık geçmiş alış listesini işlemez.** Yalnız en son getirip alış listesine eklediğin kadronun kartları aktif iş grubudur. Bir takımın işleri bitince durur; başka takım veya geçmiş oyuncuya geçmez. Ayrı toplu fiyat bulma, alım ve satış düğmeleri de aynı aktif grupla sınırlıdır.

EasySBC’de set, derece veya platform değiştiğinde ya da yeni **Seçilen kadroyu getir** isteği başladığında önceki aktif grup kaldırılır. Yeni kadroyu önizleyip **Eksik kartları alış listesine ekle** ile o takımın aktif grubunu oluştur. Normal Gallery önerilerini listeye eklemek de yeni bir aktif grup oluşturur ve öncekinin yerine geçer.

Eski oyuncunun aynı sete uyabilmesi onu yeni gruba katmaz. Önceki grupta alınmış veya satışa konmuş kartlar yeni takımın sırasına yeniden alınmaz. Aktif grubun içindeyken alınan kartlar ise aynı grubun devam eden satış işlemlerinde kalır; yarım kalan işi aynı grupta sürdürebilirsin.

Grup değişince alış bütçesi sıfırlanır; eski takımın yüksek limiti yeni takıma taşınmaz. Eski kayıtlar silinmez; **Geçmiş** bölümünde gösterilir ve işlem düğmeleri yoktur. Eski sürümden yükseltmede aktif grup otomatik tahmin edilmez: oyuncuları yeniden getirip ilgili kadroyu listeye ekle. Grup dışarıdan değişirse devam eden sıra da sonraki işleme geçmeden durur.

## Piyasa arama hataları ve fiyat kademeleri (v0.7.2)

En düşük fiyat araması artık yalnız EA’nın geçerli fiyat kademelerini kullanır; 200 coin Hemen Al altına veya 875 / 1.125 gibi geçersiz ara değerlere sorgu göndermez. Daraltma sorguları arasında 1 saniye bekler. Başarılı EA yanıtlarında `error=false`, `error=0` veya `error.code=0` hata sayılmaz.

Toplu işlem durduğunda oyuncu adı ve gerçek EA hata kodu **Son hata** satırında kalır; yalnız “0 başarılı · 1 hata” sayacı gösterilmez. 429 kodunda hız sınırı, 401/403 kodunda oturum/doğrulama açıklaması eklenir. Böyle bir sunucu hatasında kalan kartlara istek yağdırılmaz; sıra durur. Bu hata düzeltmeleri geçerli ilan bulunacağını veya EA’nın geçici sınırlarının kaldırıldığını garanti etmez.

## Doğrulama

`npm install --ignore-scripts` ardından `npm test`.

`npm run preview:gallery` gerçek hesap kullanmadan Brave üzerinde örnek verilerle toplu arama, alım, onay ve satışa koyma akışını denetler; 520px ve 360px ekran görüntülerini `artifacts/gallery` altına yazar. Brave yolu farklıysa `FUTFUSION_BROWSER` ortam değişkenini ayarla.

Yeni testler EA nesnelerini taklit ederek yuva sırası, tuğla yuvaları, depodan taşıma, yanlış SBC, gezinme, eşzamanlı tıklama, kaydetme hatası ve yeniden yükleme uyuşmazlığını denetler. Gerçek EA hesabında uçtan uca test yapılmamıştır. EA’nın özel Web App arayüzleri değişirse uyarlama gerekebilir.

İstek zaman aşımında sunucu işlemi yine de gerçekleşmiş olabilir. SBC’yi yeniden açıp sonucu kontrol et; depodan taşınan kartlar hatada otomatik geri taşınmaz.

## Kaynaklar ve lisans

- FutFox: https://github.com/abouhilalbadr/futfox — commit `3547df3bbfe126056470948e769ad17c88177874`, MIT. Orijinal lisans: LICENSE-FutFox.
- AutoPilot-SBC: https://github.com/icysymmetra/AutoPilot-SBC — commit `05877d575fd4602f6cd786d49291b7bf624ba571` (v1.12.3), GPL v3.
- Birleşik çalışma GPL-3.0-only ile sunulur; LICENSE dosyasına bak.
- AutoPilot’un tamamı birlikte enjekte edilmez. Kaynak kodundaki yerleştirme/kaydetme/yeniden yükleme akışı yeni adaptöre uyarlanmıştır.

Ayrıntılı teknik inceleme: INTEGRATION.md.
