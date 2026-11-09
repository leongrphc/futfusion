# FutFusion SBC

[Releases / İndir](https://github.com/leongrphc/futfusion/releases/latest) · [Issues](https://github.com/leongrphc/futfusion/issues) · [GPL-3.0-only](LICENSE)

## Türkçe

FutFusion, EA SPORTS FC Ultimate Team Web App için geliştirilmiş bir Chrome/Brave uzantısıdır. Kulübündeki ve SBC deposundaki kartlarla kadro planlamanı, kadroyu düzenleyip oyuna yerleştirmeni ve Gallery için kart alış/satış sürecini takip etmeni sağlar.

**Güncel sürüm: 0.8.1** — Koyu/açık tema, beş ayrı üst sekme ve sürekli açık işlem adımları.

### Özellikler

| Sekme | İçerik |
| --- | --- |
| **CLUB** | Kulübü ve SBC deposunu yükleme, kart korumaları, kayıtlı koruma profilleri, dil ve yerel veri yönetimi. |
| **SBC** | Kadro çözümü, reyting/kimya kontrolü, elle oyuncu değiştirme, sabitleme, geri/ileri alma ve oyuna yerleştirme. |
| **GALLERY** | Koleksiyon kategorileri, Gallery setleri, kart eşleştirme, hedef derece ve eksik kart önerileri. |
| **EASYSBC** | Herkese açık Gallery kadrolarını getirme, Konsol/PC referans fiyatları, kişisel eksik kart planı ve set karşılaştırması. |
| **BUY/SELL** | Aktif takımın fiyat araması, bütçeli alış akışı, kulübe giriş/Gallery onayı, satışa koyma, satış kontrolü ve işlem günlüğü. |

- Üst bardaki **Koyu mod / Açık mod** düğmesiyle tema değişir; tercih tarayıcıda saklanır.
- **Adımları ayrı ayrı yönet** bölümü her zaman görünür; tekrar açman gerekmez.
- Alış/satış sırası yalnız seçilen aktif takımı işler. Eski kayıtlar geçmişte tutulur.
- Kulüp hafızası ve işlem kayıtları EA hesabına göre ayrılır. İşlem geçmişi dosya olarak yedeklenebilir.

### Kurulum

1. [Son release](https://github.com/leongrphc/futfusion/releases/latest) sayfasından **futfusion-sbc-0.8.1.zip** dosyasını indir ve ayrı bir klasöre çıkar.
2. Chrome’da `chrome://extensions`, Brave’de `brave://extensions` sayfasını aç; **Geliştirici modu** seçeneğini etkinleştir.
3. **Paketlenmemiş öğe yükle** ile `manifest.json` dosyasını içeren klasörü seç.
4. Çakışmayı önlemek için aynı Web App’e müdahale eden diğer FutFox/AutoPilot-SBC kopyalarını devre dışı bırak.
5. [EA Web App](https://www.ea.com/ea-sports-fc/ultimate-team/web-app/) sayfasını yenile ve FutFusion panelini aç.

Kaynak koddan kurulumda bu repoyu klonlayıp kök klasörü yükleyebilirsin; uzantının derleme adımı yoktur. Güncellerken yeni paketi çıkar, uzantı sayfasındaki **Yenile** düğmesine bas ve Web App’i yenile. Yerel kayıtlarını korumak için mevcut uzantı klasörünü kullan.

### Kullanım

1. **CLUB** bölümünden kulübünü yükle; koruma ve kaynak tercihlerini belirle.
2. Oyunda bir SBC aç. **SBC** sekmesinden görevleri yenile ve kadroyu hesaplat. İstersen oyuncuları elle değiştirip sabitle.
3. Oyunda aynı SBC açıkken panelin altındaki yerleştirme düğmesine bas. Kartları ve şartları kontrol et; **SBC’yi kendin gönder**.
4. **GALLERY** bölümünde setleri incele veya **EASYSBC** bölümünden bir kadro getir. Eksikleri alış listesine ekle.
5. **BUY/SELL** bölümünde bütçeyi belirle; canlı fiyatları araştır, alış ve satış adımlarını yönet. Gallery kaydını oyunda kontrol ettikten sonra doğrula.

### Veriler ve sınırlar

Ayarlar ve hesap bazlı kayıtlar tarayıcının yerel depolamasında tutulur. EasySBC entegrasyonu herkese açık Gallery verilerini okur; bu isteklere kulüp kartları, EA kimliği, şifre, çerez veya giriş tokenı eklenmez. Gallery setleri yayımlanmış FutFox kaynağından okunur; kulüp ve piyasa işlemleri EA Web App üzerinden yürür.

SBC gönderimi manueldir. Uzantı, senin başlattığın akışlarda kart satın alabilir, kulübe taşıyabilir, Transfer Listesi’nde listeleyebilir ve SBC kadrosunu kaydedebilir. Çözücü sezgiseldir; en ucuz çözümü garanti etmez. EasySBC fiyatları referanstır. Kulüpte görülmüş bir kart, şu anda satılabilir kopyaya sahip olduğun anlamına gelmez. Sonucu belirsiz işlemlerde oyundaki durumu kontrol et. Gerçek EA hesabında alış/satış uçtan uca doğrulaması yapılmamıştır; mevcut tarayıcı kontrolleri örnek hesap/piyasa verileri kullanır.

### Geliştirme

Node.js 24 ve npm kullanılır:

```sh
npm ci
npm test
npm run check:squad-editor
npm run preview:gallery
```

Tarayıcı kontrolleri varsayılan olarak Windows’taki Brave yolunu kullanır. Farklı bir Chromium tarayıcısı için `FUTFUSION_BROWSER` ortam değişkenini çalıştırılabilir dosyanın yoluna ayarla. Ek kontroller: `npm run check:background` ve `npm run check:easysbc` (herkese açık API erişimi gerektirir).

Windows’ta sürüm paketini oluştur:

```powershell
powershell -File scripts/package.ps1
```

Paket `dist/futfusion-sbc-<sürüm>.zip` konumuna yazılır. [Sürüm notları](docs/UPGRADE-0.8.1.md), [önceki geliştirmeler](docs/HISTORY-TR.md) ve [teknik entegrasyon notları](INTEGRATION.md) daha fazla ayrıntı içerir.

### Kaynaklar ve lisans

Birleşik proje **GPL-3.0-only** lisanslıdır; [LICENSE](LICENSE) dosyasına bak.

- [FutFox](https://github.com/abouhilalbadr/futfox), Badr Abouhilal — MIT; orijinal bildirim [LICENSE-FutFox](LICENSE-FutFox) dosyasında korunur. Kaynak commit: `3547df3bbfe126056470948e769ad17c88177874`.
- [AutoPilot-SBC](https://github.com/icysymmetra/AutoPilot-SBC) — GPL v3; yerleştirme/kaydetme/yeniden yükleme akışı uyarlanmıştır. İncelenen sürüm: v1.12.3, commit `05877d575fd4602f6cd786d49291b7bf624ba571`.

EA veya EasySBC ile bağlantılı resmî bir ürün değildir.

---

## English

FutFusion is a Chrome/Brave extension for the EA SPORTS FC Ultimate Team Web App. It helps you plan SBC squads using club and SBC storage cards, edit and place squads in the game, and track card purchases and sales for Gallery collections.

**Latest version: 0.8.1** — Light/dark themes, five separate navigation tabs, and permanently visible workflow steps.

### Features

| Tab | Contents |
| --- | --- |
| **CLUB** | Load club/storage cards, protect cards, save protection profiles, choose a language, and manage local data. |
| **SBC** | Solve squads, check rating/chemistry, replace and lock players, undo/redo edits, and place squads in the game. |
| **GALLERY** | Browse collection categories and sets, match cards, choose target grades, and suggest missing cards. |
| **EASYSBC** | Import public Gallery squads, view Console/PC reference prices, plan missing cards, and compare sets. |
| **BUY/SELL** | Search prices for the active team, manage a purchase budget, confirm club entry/Gallery registration, list cards, check sales, and review the transaction journal. |

- The header theme button switches between light and dark mode and saves your preference.
- The individual workflow steps remain visible without opening a disclosure panel.
- Batch operations process only the selected active team; older records remain in history.
- Club memory and trading records are scoped to the EA account. Trading history can be exported and restored.

### Installation

1. Download **futfusion-sbc-0.8.1.zip** from the [latest release](https://github.com/leongrphc/futfusion/releases/latest) and extract it into a dedicated folder.
2. Open `chrome://extensions` in Chrome or `brave://extensions` in Brave and enable **Developer mode**.
3. Select **Load unpacked** and choose the folder containing `manifest.json`.
4. Disable other FutFox/AutoPilot-SBC copies affecting the same Web App to avoid conflicts.
5. Reload the [EA Web App](https://www.ea.com/ea-sports-fc/ultimate-team/web-app/) and open the FutFusion panel.

You can also clone this repository and load its root folder directly; the extension has no build step. To update, extract the new package, click **Reload** on the extensions page, then reload the Web App. Reuse the existing extension folder to retain local records.

### Usage

1. Load your club in **CLUB** and choose protection and card source preferences.
2. Open an SBC in the game. Refresh challenges in **SBC**, solve a squad, and optionally replace or lock individual players.
3. Keep the same SBC open in the game and use the placement button at the bottom of the panel. Review the cards and requirements, then **submit the SBC yourself**.
4. Browse sets in **GALLERY** or import a squad in **EASYSBC**. Add missing cards to the purchase list.
5. In **BUY/SELL**, set a budget, search live prices, and manage purchase and listing steps. Confirm Gallery registration after checking it in the game.

### Data and limitations

Settings and account records are stored locally in the browser. EasySBC integration reads public Gallery data without attaching club cards, EA identity, passwords, cookies, or login tokens to those requests. Gallery sets come from the published FutFox source; club and market operations use the EA Web App.

SBC submission is manual. User-started workflows can purchase cards, move them to the club, list them on the Transfer List, and save SBC squads. The solver is heuristic and does not guarantee the cheapest solution. EasySBC prices are references. A remembered card does not prove you currently own a tradable copy. Check the game when an operation has an uncertain outcome. Purchases and sales have not been validated end to end on a real EA account; browser checks use synthetic account/market data.

### Development

Use Node.js 24 and npm:

```sh
npm ci
npm test
npm run check:squad-editor
npm run preview:gallery
```

Browser checks default to the Windows Brave executable. Set `FUTFUSION_BROWSER` to another Chromium browser executable if needed. Additional checks: `npm run check:background` and `npm run check:easysbc` (requires public API access).

Build the release package on Windows:

```powershell
powershell -File scripts/package.ps1
```

The archive is written to `dist/futfusion-sbc-<version>.zip`. See the [release notes](docs/UPGRADE-0.8.1.md), [historical Turkish notes](docs/HISTORY-TR.md), and [integration findings](INTEGRATION.md) for details.

### Credits and license

The combined project is licensed under **GPL-3.0-only**; see [LICENSE](LICENSE).

- [FutFox](https://github.com/abouhilalbadr/futfox) by Badr Abouhilal — MIT; the original notice is preserved in [LICENSE-FutFox](LICENSE-FutFox). Source commit: `3547df3bbfe126056470948e769ad17c88177874`.
- [AutoPilot-SBC](https://github.com/icysymmetra/AutoPilot-SBC) — GPL v3; its placement/save/reload flow was adapted. Examined version: v1.12.3, commit `05877d575fd4602f6cd786d49291b7bf624ba571`.

This is an independent project, not an official EA or EasySBC product.
