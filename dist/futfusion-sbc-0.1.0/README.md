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
- Yeni düğme hesaplanmış normal SBC kadrosunu uygular; tekrar çözüm başlatmaz.
- SBC deposundaki seçili kartlar gerektiğinde kulübe taşınır. EA taşıma işlemini reddederse kaydetme yapılmaz; depodaki kartlarla kulüp kopyaları arasındaki çakışmalar otomatik takas edilmez.
- Market şablonları, eksik kartlar, aynı kartın tekrar kullanımı, desteklenmeyen kurallar ve farklı açık SBC reddedilir.
- Puan/Streamlined SBC’lerde orijinal elle seçim akışı devam eder.
- Multi, Entire Set, Sequence Solver ve otomatik gönderim bu birleşime dahil değildir.
- Yeni yerleştirme arayüzü Türkçedir; mevcut FutFox ekranları orijinal dil desteğini korur.

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
