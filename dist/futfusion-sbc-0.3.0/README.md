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

## Gallery alış–satış listesi (v0.3.0)

Gallery kartlarını kadroya yerleştirmez: kulübe giriş üzerinden ilerleyen alış–satış takibi sunar.

1. Gallery’de bir seti aç. **Suggest cards for** alanından hedef dereceyi seçerek eksik kart önerilerini hesaplat.
2. **Önerilen eksikleri listeye ekle** düğmesine bas. Kulüp hafızasında bulunan sürümler atlanır; aynı kart tekrar eklenmez.
3. Liste aynı kartın başka hangi setlerin boş yuvalarına uyduğunu gösterir; birden fazla sete katkı adayları öne çıkar. Bu sayı ekleme anındaki eşleşmedir, tüm setlerin tamamlanacağı anlamına gelmez.
4. **Alış fiyatı** ve **Satış fiyatı / beklenti** alanlarını doldur. Vergi varsayımı başlangıçta %5’tir ve değiştirilebilir. Elle girilen fiyatlar tahmindir; En ucuzu bul canlı ilan araması yapar, başarılı satın almada gerçek alış fiyatını otomatik yazar. Satış değerini işlemden sonra güncelle. Vergi yuvarlaması temkinli bir tahmindir.
5. Kartı oyunda satın alıp kulübe gönder. **Aldım** ile işaretle; **Club → Load my club** ile kart hafızasını yenile.
6. **Kart hafızada** bilgisi yalnızca bu sürümün görüldüğünü söyler. Oyundaki Gallery kaydını kontrol edip **Gallery’de doğruladım** düğmesine bas.
7. Oyunda satışı gerçekleştirdikten sonra gerçek fiyatları girip **Sattım** ile kapat. Satış ve Gallery doğrulaması elle yapılır. Satın alma aşağıdaki düğmeyle yapılabilir; Gallery’ye doğrudan kayıt yazılmaz.

Set içindeki liste yalnız o setle ilişkili kartları gösterir. Gallery ana sayfasındaki liste bütün setlerdeki alışları toplar. Alış toplamı tüm girilmiş alış fiyatlarının toplamıdır; gerekli en yüksek anlık bütçenin hesabı değildir. Net maliyet, alış eksi vergi sonrası satış beklentisidir; eksik fiyatlı kartlar bu hesaba dahil edilmez. Eksi maliyet tahmini kârdır.

Liste bu tarayıcıda EA hesabına göre ayrı saklanır. Orijinal Gallery Export/Import dosyasına dahil değildir. Durum sıfırlama ve listeden çıkarma düğmeleri yalnız bu listeyi değiştirir; oyuna ve mevcut Gallery kayıtlarına dokunmaz. Mevcut öneriler ilk sayfadaki kartlara dayanabilir; en ucuz piyasa alışını veya en iyi set kombinasyonunu garanti etmez. Hedef derece önerisi bulunmayan setlerde bu sürümden yeni alış listesi üretilemez.

### En ucuzu bul → fiyatı gör → Satın al

Alış listesindeki her kartta **En ucuzu bul** düğmesi vardır. Bu düğme yalnız arar, satın almaz. EA’nın Satın Al ilanları içinde tam kart ID’si, reyting, sürüm ve holografik durumu kontrol edilir. İlk sayfanın en ucuz olduğunu varsaymak yerine fiyat üst sınırı daraltılarak daha düşük ilanlar araştırılır. Başlangıç arama sınırı 15.000.000 coin’dir. Arama bir piyasa anlık görüntüsüdür; değişen ilanlar ve EA’nın arama sonuçları nedeniyle tüm piyasa için kalıcı en düşük fiyat garantisi değildir.

Fiyat bulunduğunda **1.250 coin — Satın al** benzeri bir düğme görünür. Yalnız bu düğmeye basınca, gösterilen ilan aynı tutarda yeniden aranır ve EA’nın satın alma servisine tek istek gönderilir. İlan yoksa, fiyat değişmişse veya 60 saniye geçmişse alış yapılmaz; daha pahalı başka kartla otomatik devam edilmez. Başarılı alışın gerçek tutarı listeye yazılır ve kart kulübe gönderilir. Kulübe gönderme başarısızsa kart zaten alınmıştır; Transfer Hedefleri’nden kendin gönder.

Alış isteği sırasında yenileme veya yanıt hatası olursa sonuç belirsiz olabilir. Liste kalıcı bir bekleme işareti tutar ve tekrar satın almayı engeller. Kulübü ve Transfer Hedefleri’ni kontrol et: kart alındıysa **Aldım**, alınmadığından eminsen **Durumu sıfırla** ile devam et. Otomatik tekrar alış yoktur. Piyasa araması da bu düğmeler dışında kendiliğinden başlamaz.

## Doğrulama

`npm install --ignore-scripts` ardından `npm test`.

Yeni testler EA nesnelerini taklit ederek yuva sırası, tuğla yuvaları, depodan taşıma, yanlış SBC, gezinme, eşzamanlı tıklama, kaydetme hatası ve yeniden yükleme uyuşmazlığını denetler. Gerçek EA hesabında uçtan uca test yapılmamıştır. EA’nın özel Web App arayüzleri değişirse uyarlama gerekebilir.

İstek zaman aşımında sunucu işlemi yine de gerçekleşmiş olabilir. SBC’yi yeniden açıp sonucu kontrol et; depodan taşınan kartlar hatada otomatik geri taşınmaz.

## Kaynaklar ve lisans

- FutFox: https://github.com/abouhilalbadr/futfox — commit `3547df3bbfe126056470948e769ad17c88177874`, MIT. Orijinal lisans: LICENSE-FutFox.
- AutoPilot-SBC: https://github.com/icysymmetra/AutoPilot-SBC — commit `05877d575fd4602f6cd786d49291b7bf624ba571` (v1.12.3), GPL v3.
- Birleşik çalışma GPL-3.0-only ile sunulur; LICENSE dosyasına bak.
- AutoPilot’un tamamı birlikte enjekte edilmez. Kaynak kodundaki yerleştirme/kaydetme/yeniden yükleme akışı yeni adaptöre uyarlanmıştır.

Ayrıntılı teknik inceleme: INTEGRATION.md.
