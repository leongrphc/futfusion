# FutFusion 0.8.0

## Kullanım

1. Uzantıyı ve Web App'i yenile. Kulüp sekmesinden kartlarını yükle.
2. SBC'de görevi ve çözüm önceliğini seç. Kadro oluştur; kartların Düzenle menüsünden düzeltme yap.
3. Gerekiyorsa geri al/ileri al veya liste görünümünü kullan. Panelin altındaki yerleştirme düğmesine bas; EA ekranında kontrol edip kendin gönder.
4. Gallery'de EasySBC veya mevcut önerilerden bir kadro seç. İstersen getirdiğin çözümleri karşılaştırmaya ekle. Kişisel token kazanımını kendin gir.
5. Eksikleri aktif listeye ekle, toplam takım bütçesini belirle ve işlemi başlat. Ayrı alım/satış adımları açılır bölümde bulunur.
6. Alınmış kartlarda satış hedefini seçebilir, mevcut satış durumunu okuyabilir ve hesap özetini inceleyebilirsin.

## Değişikliklerin sınırları

- Otomatik SBC gönderimi ve takımlar arasında otomatik alış kuyruğu eklenmedi. İşlem kuyruğu yalnız seçilmiş aktif takımı işler.
- Normal SBC çözücüsü sezgiseldir. Yeni hedefler aramayı yönlendirir; küresel en ucuz sonucu kanıtlamaz.
- Oyuncu açıklamaları pozisyonu, kaynağı ve sağladığı kart şartlarını gösterir; kimya farkı mevcut değerlendiriciden gelir.
- EasySBC kişisel bütçesi kaynak referans fiyatları üzerinden hesaplanır. Eksik fiyat varsa bütçe bilinmiyor gösterilir. Kaynak fiyatları canlı alış fiyatı veya onay değildir.
- Coin/token hesabı, eksik kartların aynı referans fiyattan tekrar satıldığı ve %5 vergi uygulandığı varsayımıdır. Önceden kazanılan token kullanıcı girdisidir; Gallery ödül servisi okunmaz.
- Koleksiyon hafızası kartın geçmişte görüldüğünü belirtir. Şu an satılabilir bir kopyaya sahip olunduğunu kanıtlamaz.
- Başabaş Hemen Al hedefi, hedef fiyat üzerinden satış varsayımıdır. Başlangıç teklifi daha düşüktür; açık artırmada gerçekleşen fiyat da daha düşük olabilir.
- Satış kontrolü yalnız tam örnek ID'si, doğru kart sürümü ve kesin satış bilgisi bulunan kayıtları satıldı işaretler. Transfer Listesi'nde bulunmayan bir kart belirsiz kalır. Belirsiz alışlar otomatik tekrar edilmez; oyunda kontrol edilmelidir.
- Gerçekleşen net sonuç yalnız satış olarak doğrulanmış ve alış/satış fiyatları bilinen kayıtları içerir. Elle Sattım işaretlenen kayıtlarda fiyatın doğruluğu kullanıcıya aittir.
- İşlem yedeği alış defteri ve günlüğünü taşır; dil/koruma profilleri, token ilerlemesi ve eski Gallery hafıza dosyası ayrı saklanır.
- Hesaplama iptali sayfanın sonucu kullanmasını durdurur. Arka plan işçisinde başlamış hesaplama tamamlanabilir. Alış/satış isteği iptal edilerek geri alınmaz.
- Panel stilleri ayrı modüle taşındı. EA adaptörü ve bazı eski panel bölümleri mevcut yapıyı kullanmaya devam eder.

## Doğrulama

- `npm test`: 199 test; çözücü, kimya, koruma akışları, alış/satış, bütçe, hesap ayrımı, kişisel plan ve yedek biçimi.
- `npm run check:squad-editor`: örnek kulüple gerçek panel; kaldırma, geri/ileri alma, 10 oyunculuk kısmi yerleştirme, elle seçim, yeniden çözmede sabit kart, 360px liste ve Türkçe yerleştirme düğmesi.
- `npm run preview:gallery`: örnek piyasa; tek aktif takım, harcama tavanı, önceki takımın korunması, hata görünürlüğü, 360px ekran, gerçek dosya indirme ve yedek yükleme.
- `npm run check:background`: yüklenmiş gerçek uzantı üzerinden arka plan çözücü; aynı tohumda aynı sonuç, EA nesne referanslarının geri bağlanması, sayfanın yanıt vermesi, sonuç iptali ve iki sekmede ortak hesap kilidi.
- `npm run check:easysbc`: herkese açık API üzerinden set listesi, kadro önizleme, kişisel karşılaştırma, 15 kartlık aktarım ve tekrar aktarımda tekilleştirme.

Bu kontrollerde gerçek EA hesabı veya gerçek coin kullanılmadı. EA hesabında gerçek satın alma, kulübe taşıma, listeleme ve satılmış ilan verisinin okunması ayrıca doğrulanmalıdır. EA'nın özel arayüzü değişirse adaptör güncellemesi gerekebilir.

## Paket

`powershell -File scripts/package.ps1` manifest sürümünü okuyarak `dist/futfusion-sbc-0.8.0.zip` üretir. Yeni modüller `src` altında olduğundan pakete otomatik dahil edilir. Chrome'da paketlenmemiş uzantı için ZIP'i ayrı klasöre çıkarıp o klasörü seç.
