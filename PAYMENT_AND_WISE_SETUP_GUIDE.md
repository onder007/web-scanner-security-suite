# Web Scanner — Lemon Squeezy & Doğrudan Banka Ödeme Altyapısı Kılavuzu

Bu kılavuz, **Web Scanner & Security Suite** eklentinizi en karlı, en düşük komisyonlu (%5 + $0.50) ve sıfır şirket masrafıyla nasıl ücretli hale getirdiğimizi ve ödemelerin doğrudan **Türk Banka (Ziraat Bankası IBAN)** hesabınıza nasıl aktarıldığını açıklar.

---

## 1. Neden "Lemon Squeezy (Stripe) + Doğrudan Türk IBAN'ı" En Karlı Modeldir?

Bir Chrome uzantısı doğrudan banka havalesi veya kredi kartı çekimi yapamaz çünkü küresel KDV (VAT) ve vergi yükümlülükleri bulunur.

**Kurulan En Karlı & Zahmetsiz Sistem:**
1. **Lemon Squeezy (Stripe MoR):** Dünyadaki müşteriden kredi kartı, Apple Pay veya Google Pay ile ödemeyi tahsil eder. Tüm küresel vergileri kendi üstlenir. Şirket kurma zorunluluğu yoktur.
2. **Otomatik Lisans Üretimi:** Her ödeme yapan müşteriye benzersiz bir lisans anahtarı üretir ve anında e-postasına iletir.
3. **Doğrudan Banka Payout:** Lemon Squeezy, Stripe altyapısı üzerinden kazancınızı doğrudan **Türkiye'deki Ziraat Bankası IBAN** hesabınıza yatırır. Aracıya veya ek komisyonlara gerek kalmaz.

---

## 2. Entegre Edilen Canlı Mağaza Bağlantısı

- **Canlı Satın Alma Bağlantısı:** `https://onder.lemonsqueezy.com/checkout/buy/c3a944ae-1513-488a-b147-f457c72baefb`
- **Lisans Doğrulama API:** `https://api.lemonsqueezy.com/v1/licenses/activate`
- **Model:** Lifetime ($14 / Single Payment)
- **Aktivasyon Limiti:** 5 cihaz/tarayıcı (kullanıcı dostu & paylaşım korumalı)

---

### Adım 3: Gumroad Ödemelerini Wise'a Bağlayın
1. Gumroad'da **Settings -> Payouts** sekmesine gidin.
2. Ülke veya para birimi olarak Wise detaylarınıza göre seçim yapın:
   - ABD Doları (USD) Wise hesap bilgileriniz varsa: ABD banka transferi (ACH Routing + Account Number).
   - Euro Wise IBAN'ınız varsa: SEPA IBAN transferi.
3. Kaydedin. Artık Gumroad'daki tüm satış gelirleriniz haftalık olarak otomatik şekilde Wise hesabınıza yatırılacaktır.

---

### Adım 4: Uzantıdaki Satın Alma Linkini Güncelleyin
Projenizdeki [src/utils/paymentConfig.js](file:///Users/xon/dead-links-scanner-1/src/utils/paymentConfig.js) dosyasını açın:

```javascript
export const PAYMENT_CONFIG = {
  provider: 'gumroad',
  // Buraya kendi Gumroad linkinizi yapıştırın:
  checkoutUrl: 'https://gumroad.com/l/KENDI_LINKINIZ',
  gumroadPermalink: 'KENDI_PERMALINK_SLUG',
  price: '$14',
  planName: 'Pro Lifetime License'
};
```

Kullanıcı uzantıda **"PRO • $14"** veya modal içindeki **"Lisans Satın Al ($14 Ömür Boyu)"** butonuna bastığında doğrudan sizin bu sayfanıza gidecek, ödemesini yapıp aldığı anahtarı uzantıya girerek PRO sürümü anında açacaktır.

---

## 3. Gizli Admin Anahtarınız Hakkında Önemli Bilgi

- **Önceki Sorun:** `onder123` anahtarı arayüzde bir buton olarak herkese açık görünüyordu.
- **Yapılan Güvenlik İyileştirmesi:**
  - Arayüzdeki tüm admin butonları, yazıları ve ipuçları tamamen silindi.
  - Kod tabanından `onder123` kelimesi tamamen kaldırıldı.
  - Sisteme **SHA-256 Kriptografik Karma Doğrulaması** entegre edildi (`3fdb203b8621f85ee300d05c7337e6684f874f4011959321d2aef56c443d331d`).
  - Uzantıyı derleyip inceleyen birisi kaynak kodda asla sizin admin şifrenizi göremez.
  - **Nasıl Kullanacaksınız?**
    Lisans modalındaki normal lisans kutusuna `onder123` yazıp **"Etkinleştir"** butonuna bastığınız anda sistem anahtarın SHA-256 hash'ini eşleştirir ve size anında **"Yönetici (Admin Full Access)"** yetkisi verir!
