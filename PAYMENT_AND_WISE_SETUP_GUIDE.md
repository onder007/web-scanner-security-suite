# Web Scanner — Wise & Ödeme Altyapısı Kurulum Kılavuzu

Bu kılavuz, **Web Scanner** uzantınızı en karlı, en düşük komisyonlu ve sıfır şirket masrafıyla nasıl ücretli hale getireceğinizi ve ödemeleri doğrudan **Wise** hesabınıza nasıl aktaracağınızı adım adım açıklar.

---

## 1. Neden "Merchant of Record (Gumroad / Lemon Squeezy) + Wise" En Karlı Modeldir?

Bir Chrome uzantısı doğrudan banka havalesi veya doğrudan kredi kartı çekimi yapamaz. Çünkü:
- 150+ ülkenin KDV/VAT vergi yükümlülüklerini (AB KDV'si, ABD Sales Tax) tek tek beyan etmek gerekir.
- Ters ibraz (chargeback), dolandırıcılık koruması ve kart altyapısı (Stripe/PayPal) şirket ve fatura zorunluluğu ister.

**En Karlı & Zahmetsiz Çözüm:**
1. **Gumroad / Lemon Squeezy (Merchant of Record):** Müşteriden kredi kartı, Apple Pay, Google Pay ve PayPal ile $14 tahsil eder. Tüm küresel vergileri kendi üstlenir. Size şirket kurdurmaz.
2. **Otomatik Lisans Üretimi:** Her ödeme yapan müşteriye benzersiz bir lisans anahtarı üretir ve anında e-postasına iletir.
3. **Wise Payout (Doğrudan Banka Transferi):** Gumroad/Lemon Squeezy kazancınızı her hafta doğrudan **Wise USD / EUR hesabınıza** (ACH / SEPA ile sıfıra yakın komisyonla) yatırır!
4. **Wise Kartı / IBAN:** Wise hesabınızdaki parayı ister Wise kartınızla harcarsınız, ister Türkiye'deki banka hesabınıza anında TL/USD olarak çekersiniz.

---

## 2. Adım Adım Kurulum (5 Dakikada Tamamlama)

### Adım 1: Wise Hesap Bilgilerinizi Alın
1. [Wise.com](https://wise.com) hesabınıza giriş yapın (yoksa ücretsiz bireysel hesap açın).
2. **"Hesaplar" (Balances)** bölümünden **USD** veya **EUR** seçin.
3. **"Hesap Detayları" (Account Details)** butonuna tıklayın:
   - **USD için:** Routing Number (ACH) + Account Number
   - **EUR için:** IBAN numaranız
4. Bu bilgileri bir kenara not edin.

---

### Adım 2: Gumroad'da Ürününüzü Oluşturun
1. [Gumroad.com](https://gumroad.com) üzerinde ücretsiz bir hesap açın.
2. **Products -> New Product** seçin.
3. Tür olarak **"Digital Product"** seçin.
   - İsim: `Web Scanner — Dead Links & Security Pro`
   - Fiyat: `$14` (Tek seferlik ömür boyu en yüksek dönüşüm getiren fiyattır)
4. Ürün ayarlarında:
   - **"Generate a unique license key for each sale"** seçeneğini mutlaka **AÇIK (Checked)** konuma getirin!
   - Bu ayar sayesinde her satın alan kullanıcıya Gumroad otomatik lisans anahtarı verir.
5. Ürünü **Publish** yapın ve ürün linkinizi alın (örn: `https://onder.gumroad.com/l/webscanner`).

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
