# FutFusion SBC

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
- Market şablonları, eksik kartlar, aynı kartın tekrar kullanımı, desteklenmeyen kurallar ve farklı açık SBC reddedilir.
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

Set içindeki liste yalnız o setle ilişkili kartları gösterir. Gallery ana sayfasındaki liste bütün setlerdeki alışları toplar. Alış toplamı tüm girilmiş alış fiyatlarının toplamıdır; gerekli en yüksek anlık bütçenin hesabı değildir. Net maliyet, alış eksi vergi sonrası satış beklentisidir; eksik fiyatlı kartlar bu hesaba dahil edilmez. Eksi maliyet tahmini kârdır.

Liste bu tarayıcıda EA hesabına göre ayrı saklanır. Orijinal Gallery Export/Import dosyasına dahil değildir. Durum sıfırlama ve listeden çıkarma düğmeleri yalnız bu listeyi değiştirir; oyuna ve mevcut Gallery kayıtlarına dokunmaz. Mevcut öneriler ilk sayfadaki kartlara dayanabilir; en ucuz piyasa alışını veya en iyi set kombinasyonunu garanti etmez. Hedef derece önerisi bulunmayan setlerde bu sürümden yeni alış listesi üretilemez.

### En ucuzu bul → fiyatı gör → Satın al

Alış listesindeki her kartta **En ucuzu bul** düğmesi vardır. Bu düğme yalnız arar, satın almaz. EA’nın Satın Al ilanları içinde tam kart ID’si, reyting, sürüm ve holografik durumu kontrol edilir. İlk sayfanın en ucuz olduğunu varsaymak yerine fiyat üst sınırı daraltılarak daha düşük ilanlar araştırılır. Başlangıç arama sınırı 15.000.000 coin’dir. Arama bir piyasa anlık görüntüsüdür; değişen ilanlar ve EA’nın arama sonuçları nedeniyle tüm piyasa için kalıcı en düşük fiyat garantisi değildir.

Fiyat bulunduğunda **1.250 coin — Satın al** benzeri bir düğme görünür. Yalnız bu düğmeye basınca, gösterilen ilan aynı tutarda yeniden aranır ve EA’nın satın alma servisine tek istek gönderilir. İlan yoksa, fiyat değişmişse veya 60 saniye geçmişse alış yapılmaz; daha pahalı başka kartla otomatik devam edilmez. Başarılı alışın gerçek tutarı listeye yazılır ve kart kulübe gönderilir. Kulübe gönderme başarısızsa kart zaten alınmıştır; Transfer Hedefleri’nden kendin gönder.

Alış isteği sırasında yenileme veya yanıt hatası olursa sonuç belirsiz olabilir. Liste kalıcı bir bekleme işareti tutar ve tekrar satın almayı engeller. Kulübü ve Transfer Hedefleri’ni kontrol et: kart alındıysa **Aldım**, alınmadığından eminsen **Durumu sıfırla** ile devam et. Otomatik tekrar alış yoktur. Piyasa araması da bu düğmeler dışında kendiliğinden başlamaz.

### Toplu işlemler ve alış fiyatından satışa koyma

Set sayfasında yalnız o sete bağlı kartlar, Gallery ana sayfasında bütün alış listesi işlenir. Üst bölüm toplam alım tavanını, fiyatı bulunan kart sayısını, satışa hazır kartları ve tahmini vergi kaybını gösterir.

1. **Kartların fiyatını bul**: listedeki alınmamış ve belirsiz alış kilidi olmayan kartları sırayla arar. Bu adım para harcamaz.
2. **Kartları al · en fazla … coin**: fiyatı bulunmuş kartlar için gösterilen tutarları kart başına tavan olarak sabitler. Her kartın ilanı yeniden aranır; o tutara veya daha ucuza varsa alınır. Daha pahalı kartla devam edilmez. Tekli aramadaki 60 saniyeyi geçen toplu önizlemeler, aynı tavanla yeniden doğrulanabilir. Gösterilen toplam aşılmaz; henüz fiyatı olmayan kartlar bu tıklamaya dahil değildir.
3. **Alınanların Gallery kaydını kontrol ettim · hepsini doğrula**: oyunda gerçekten kontrol ettikten sonra bas. Bu yalnız yerel onay kaydıdır.
4. **Kartları alış fiyatından satışa koy**: Gallery onayı, geçerli alış fiyatı ve satın alınan kart örnek ID’si olan kartları sırayla Transfer Listesi’ne gönderir ve **1 saatliğine** listeler. Her kartın başlangıç fiyatı ve Hemen Al fiyatı kendi kayıtlı alış tutarına eşittir. Bu fiyat EA’nın güncel aralığına uymuyorsa otomatik başka fiyat seçilmez.

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
- Her kaldırma ve eklemede reyting, kimya, maliyet ve şartlar yeniden hesaplanır. EA’nın kimya hesabı mevcutsa onu esas alır. Boş veya şartları karşılamayan kadro otomatik uygulanmaz.
- Aynı oyuncunun iki farklı kart sürümü birlikte kullanılamaz.

Belirli takım şartı kartın gerçek takım ID’siyle değerlendirilir; kimya için kullanılan bağlı takım ID’si bu şartın yerine kullanılmaz. Çözücü eksik belirli takım/lig/ülke/kalite şartlarına uyan oyuncuları daha doğrudan araştırır. Ancak kulüpte ve seçili filtrelerde uygun oyuncu yoksa çözüm uydurulmaz; kırmızı şartı elle düzeltmen veya kulübü yenilemen gerekir.

Bu elle düzenleyici normal formasyon SBC’leri içindir; puan SBC’lerinin mevcut seçim akışı korunur. **Kaldır**, Web App’teki gerçek kadroya anında yazmaz; paneldeki öneriyi değiştirir. Son kadroyu uygulamak için **Solve Squad** kullan.

`npm run check:squad-editor` gerçek paneli ve çözücüyü örnek kulüp verisiyle Brave’de açar; kaldırma, korunan oyuncuyu elle seçme, takım şartının güncellenmesi ve sabit kartın yeniden çözmede korunmasını denetler. Gerçek EA hesabı kullanmaz.

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
