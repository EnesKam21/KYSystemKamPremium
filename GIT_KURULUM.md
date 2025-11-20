# Git Kurulumu ve GitHub'a Push Rehberi

## 1. Git'i İndirme ve Yükleme

### Adım 1: Git'i İndirin
1. https://git-scm.com/download/win adresine gidin
2. "64-bit Git for Windows Setup" butonuna tıklayın (otomatik indirme başlar)
3. İndirilen `.exe` dosyasını çalıştırın

### Adım 2: Git'i Yükleyin
1. Kurulum sihirbazı açılacak
2. **"Next"** butonlarına tıklayarak ilerleyin
3. **Önemli ayarlar:**
   - **Default editor:** Varsayılan olarak bırakın (Notepad++ veya VS Code seçebilirsiniz)
   - **PATH environment:** "Git from the command line and also from 3rd-party software" seçin
   - **Line ending conversions:** "Checkout Windows-style, commit Unix-style line endings" seçin
   - **Terminal emulator:** "Use Windows' default console window" seçin
4. **"Install"** butonuna tıklayın
5. Kurulum tamamlandığında **"Finish"** butonuna tıklayın

### Adım 3: Git'in Yüklendiğini Kontrol Edin
1. PowerShell veya Command Prompt'u açın
2. Şu komutu yazın:
   ```bash
   git --version
   ```
3. Eğer versiyon numarası görünüyorsa (örn: `git version 2.42.0`), Git başarıyla yüklendi demektir!

## 2. Git'i Yapılandırma

İlk kez Git kullanıyorsanız, kullanıcı adınızı ve e-posta adresinizi ayarlamanız gerekir:

```bash
git config --global user.name "Adınız Soyadınız"
git config --global user.email "email@example.com"
```

**Örnek:**
```bash
git config --global user.name "Enes K"
git config --global user.email "enes@example.com"
```

## 3. GitHub'da Repository Oluşturma

### Adım 1: GitHub'a Giriş Yapın
1. https://github.com/ adresine gidin
2. Hesabınızla giriş yapın (yoksa ücretsiz hesap oluşturun)

### Adım 2: Yeni Repository Oluşturun
1. Sağ üst köşedeki **"+"** simgesine tıklayın
2. **"New repository"** seçeneğini seçin
3. Formu doldurun:
   - **Repository name:** `kamscripts-key-server` (veya istediğiniz isim)
   - **Description:** "KamScripts Premium Key Server" (opsiyonel)
   - **Public** veya **Private** seçin
   - **"Add a README file"** kutusunu işaretlemeyin (zaten dosyalarınız var)
   - **"Add .gitignore"** kutusunu işaretlemeyin (zaten var)
4. **"Create repository"** butonuna tıklayın

### Adım 3: Repository URL'sini Kopyalayın
Repository oluşturulduktan sonra, sayfanın üstünde bir URL göreceksiniz:
```
https://github.com/kullanici_adiniz/kamscripts-key-server.git
```
Bu URL'yi kopyalayın (daha sonra kullanacağız)

## 4. Projeyi Git ile Başlatma ve Push Etme

### Adım 1: Proje Klasörüne Gidin
PowerShell'de proje klasörünüze gidin:
```powershell
cd "C:\Users\enesk\OneDrive\Desktop\yeni"
```

### Adım 2: Git Repository'sini Başlatın
```bash
git init
```

### Adım 3: Tüm Dosyaları Git'e Ekleyin
```bash
git add .
```

### Adım 4: İlk Commit'i Yapın
```bash
git commit -m "Initial commit: KamScripts Key Server with bypass protection"
```

### Adım 5: GitHub Repository'sini Bağlayın
```bash
git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADI.git
```
**ÖNEMLİ:** `KULLANICI_ADINIZ` ve `REPO_ADI` yerine GitHub'dan kopyaladığınız URL'deki değerleri yazın!

**Örnek:**
```bash
git remote add origin https://github.com/enesk/kamscripts-key-server.git
```

### Adım 6: Branch'i Main Olarak Ayarlayın
```bash
git branch -M main
```

### Adım 7: GitHub'a Push Edin
```bash
git push -u origin main
```

İlk kez push yapıyorsanız, GitHub kullanıcı adı ve şifre (veya Personal Access Token) isteyecektir.

## 5. GitHub Authentication (İlk Push İçin)

GitHub artık şifre ile push kabul etmiyor. **Personal Access Token** kullanmanız gerekiyor:

### Personal Access Token Oluşturma:
1. GitHub'a giriş yapın
2. Sağ üst köşedeki profil resminize tıklayın
3. **"Settings"** seçeneğine tıklayın
4. Sol menüden **"Developer settings"** seçin
5. **"Personal access tokens"** → **"Tokens (classic)"** seçin
6. **"Generate new token"** → **"Generate new token (classic)"** tıklayın
7. Formu doldurun:
   - **Note:** "KamScripts Key Server" (açıklama)
   - **Expiration:** İstediğiniz süre (90 days önerilir)
   - **Scopes:** `repo` kutusunu işaretleyin (tüm alt kutular otomatik işaretlenir)
8. **"Generate token"** butonuna tıklayın
9. **ÖNEMLİ:** Token'ı hemen kopyalayın! (bir daha gösterilmeyecek)

### Push Sırasında Token Kullanımı:
```bash
git push -u origin main
```
- **Username:** GitHub kullanıcı adınız
- **Password:** Oluşturduğunuz Personal Access Token (şifre değil!)

## 6. Sonraki Push'lar İçin

Artık sadece şu komutları kullanın:

```bash
git add .
git commit -m "Değişiklik açıklaması"
git push
```

## Önemli Notlar

- ✅ `.env` dosyası `.gitignore`'da olduğu için GitHub'a yüklenmeyecek
- ✅ Secret key'leriniz güvende kalacak
- ✅ Her push'tan önce `git add .` ve `git commit -m "mesaj"` yapın
- ✅ Personal Access Token'ı güvenli tutun, kimseyle paylaşmayın

