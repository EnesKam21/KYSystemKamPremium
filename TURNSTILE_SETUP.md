# Cloudflare Turnstile ve Environment Variables Kurulum Rehberi

## 1. Cloudflare Turnstile Key'lerini Alma

### Adım 1: Cloudflare Dashboard'a Giriş
1. https://dash.cloudflare.com/ adresine gidin
2. Cloudflare hesabınızla giriş yapın (yoksa ücretsiz hesap oluşturun)

### Adım 2: Turnstile Widget Oluşturma
1. Sol menüden **"Turnstile"** sekmesine tıklayın
2. **"Add site"** veya **"Add widget"** butonuna tıklayın
3. Formu doldurun:
   - **Site name:** Örn: "KamScripts Key System"
   - **Domain:** `ky-system-kam-premium.vercel.app` (veya kendi domain'iniz)
   - **Widget mode:** "Managed" seçin (önerilir)
4. **"Create"** butonuna tıklayın

### Adım 3: Key'leri Kopyalama
Widget oluşturulduktan sonra:
- **Site Key:** Bu key'i kopyalayın (public key, herkese açık)
- **Secret Key:** Bu key'i kopyalayın (private key, gizli tutulmalı)

## 2. HMAC Secret Key Oluşturma

Güvenli bir secret key oluşturmak için terminal'de şu komutu çalıştırın:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Bu komut size rastgele bir secret key üretecek. Bu key'i kopyalayın.

## 3. Environment Variables Ayarlama

### Yerel Bilgisayarda (Windows PowerShell)

1. Proje klasöründe `.env` dosyası oluşturun:
   ```powershell
   New-Item -Path .env -ItemType File
   ```

2. `.env` dosyasını bir metin editörüyle açın ve şunları ekleyin:
   ```
   TURNSTILE_SITE_KEY=your_site_key_here
   TURNSTILE_SECRET_KEY=your_secret_key_here
   SECRET_KEY=your_hmac_secret_key_here
   ```

3. `index.js` dosyasını güncelleyin - `.env` dosyasını yüklemek için:
   - `package.json`'a `dotenv` paketini ekleyin
   - `index.js` dosyasının en üstüne `require('dotenv').config();` ekleyin

### Vercel'de (Production)

1. Vercel Dashboard'a gidin: https://vercel.com/dashboard
2. Projenizi seçin
3. **Settings** sekmesine tıklayın
4. Sol menüden **"Environment Variables"** seçin
5. Her bir değişkeni ekleyin:
   - **Name:** `TURNSTILE_SITE_KEY` → **Value:** (Cloudflare'dan aldığınız Site Key)
   - **Name:** `TURNSTILE_SECRET_KEY` → **Value:** (Cloudflare'dan aldığınız Secret Key)
   - **Name:** `SECRET_KEY` → **Value:** (Oluşturduğunuz HMAC secret key)
6. Her değişken için **"Save"** butonuna tıklayın
7. Projeyi yeniden deploy edin

## 4. dotenv Paketini Ekleme (Yerel için)

Terminal'de şu komutu çalıştırın:
```bash
npm install dotenv
```

Sonra `index.js` dosyasının en üstüne ekleyin:
```javascript
require('dotenv').config();
```

## Önemli Notlar

- **Secret Key'leri asla GitHub'a veya public yerlere yüklemeyin!**
- `.env` dosyasını `.gitignore` dosyasına ekleyin
- Vercel'de environment variable'lar otomatik olarak yüklenir
- Yerel test için `.env` dosyası kullanılır

