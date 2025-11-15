const express = require("express");

const app = express();

const activeSessions = {}; 

function generateKey(seed) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  
  // Seed'i daha stabil hale getir
  let currentSeed = seed;
  
  for (let i = 0; i < 10; i++) {
    // Daha deterministik bir yöntem kullan
    const sinValue = Math.sin(currentSeed + i);
    // Negatif değerleri pozitif yap ve mod al
    const rand = Math.abs(Math.floor(sinValue * 10000)) % chars.length;
    key += chars[rand];
    // Seed'i güncelle
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
  }
  
  return key;
}

function getTenMinuteKey() {
  const date = new Date();
  // 30 dakikalık blok hesaplama - daha stabil
  const thirtyMinuteBlock = Math.floor(date.getUTCMinutes() / 30);
  
  // Seed oluştur - string concatenation yerine matematiksel işlem
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  
  // Daha stabil seed hesaplama - 30 dakikalık bloklar için
  const seed = year * 1000000 + month * 10000 + day * 100 + hour * 10 + thirtyMinuteBlock;
  
  return generateKey(seed);
}

// Key'i cache'le - aynı 30 dakikalık blokta aynı key'i döndür
let cachedKey = null;
let cachedKeyTime = null;

function getCachedTenMinuteKey() {
  const date = new Date();
  const thirtyMinuteBlock = Math.floor(date.getUTCMinutes() / 30);
  const hour = date.getUTCHours();
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  
  // Cache key'i oluştur - 30 dakikalık bloklar için
  const cacheKey = `${year}-${month}-${day}-${hour}-${thirtyMinuteBlock}`;
  
  // Eğer cache geçerliyse, aynı key'i döndür
  if (cachedKey && cachedKeyTime === cacheKey) {
    return cachedKey;
  }
  
  // Yeni key oluştur ve cache'le
  cachedKey = getTenMinuteKey();
  cachedKeyTime = cacheKey;
  
  return cachedKey;
}

function isValid(ip) {
  const session = activeSessions[ip];
  if (!session) return false;
  
  if (Date.now() > session.expiresAt) {
    delete activeSessions[ip];
    return false;
  }
  
  return true;
}

// Key'i session ile birlikte döndür - aynı session boyunca aynı key
function getSessionKey(ip) {
  const session = activeSessions[ip];
  if (!session) {
    // Session yoksa yeni key oluştur
    return getCachedTenMinuteKey();
  }
  
  // Eğer session'da key varsa, onu döndür
  if (session.key) {
    return session.key;
  }
  
  // Session'da key yoksa, yeni key oluştur ve session'a kaydet
  session.key = getCachedTenMinuteKey();
  return session.key;
}

app.get("/", (req, res) => {
  const ref = req.get("referer") || "";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  // Referrer kontrolü - sadece lootlabs ve türevlerine izin ver
  // Direkt erişim veya başka sitelerden gelenler engellenir
  const isLootlabs = ref.toLowerCase().includes("lootlabs") || 
                      ref.toLowerCase().includes("loot-lab") ||
                      ref.toLowerCase().includes("lootlabs.io") ||
                      ref.toLowerCase().includes("lootlabs.com");

  // Eğer geçerli bir session varsa, direkt key'i göster (sayfa yenileme durumu)
  if (isValid(ip)) {
    const session = activeSessions[ip];
    const timeLeft = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
    const key = getSessionKey(ip); // Session key'ini kullan
    
    return res.send(`
      <html>
      <head>
        <title>KamScripts Premium Key</title>
        <meta http-equiv="refresh" content="${timeLeft + 1};url=https://kamscriptsbypass.xo.je">
      </head>
      <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif">
        <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4)">
          <h1>KamScripts Premium Key</h1>
          <div style="color:#00ffea; font-size:22px; font-weight:bold">${key}</div>
          <p>⚡ This key refreshes every 30 minutes ⚡</p>
          <p id="timer" style="color:#ff4444; font-size:18px; margin-top:15px"></p>
        </div>
        <script>
          let remaining = ${timeLeft};
          let startTime = Date.now();
          let serverTimeLeft = ${timeLeft};
          
          function updateTimer() {
            // Calculate elapsed time since page load
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const currentRemaining = Math.max(0, serverTimeLeft - elapsed);
            
            if (currentRemaining <= 0) {
              window.location.href = "https://kamscriptsbypass.xo.je";
              return;
            }
            
            document.getElementById("timer").innerText = "⏳ Time left: " + currentRemaining + "s";
          }
          
          // Update timer every second
          setInterval(updateTimer, 1000);
          updateTimer();
          
          // Fallback: Force redirect after server time expires
          setTimeout(function() {
            window.location.href = "https://kamscriptsbypass.xo.je";
          }, ${timeLeft * 1000 + 1000});
        </script>
      </body>
      </html>
    `);
  }

  // Yeni session oluştur - sadece lootlabs'tan geliyorsa
  if (isLootlabs) {
    // Key'i önce oluştur, sonra session'a kaydet
    const newKey = getCachedTenMinuteKey();
    activeSessions[ip] = {
      expiresAt: Date.now() + 30 * 60 * 1000,  // 30 dakika
      key: newKey  // Key'i session'a kaydet
    };
    
    const session = activeSessions[ip];
    const timeLeft = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
    const key = session.key; // Session'dan key'i al

    return res.send(`
      <html>
      <head>
        <title>KamScripts Premium Key</title>
        <meta http-equiv="refresh" content="${timeLeft + 1};url=https://kamscriptsbypass.xo.je">
      </head>
      <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif">
        <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4)">
          <h1>KamScripts Premium Key</h1>
          <div style="color:#00ffea; font-size:22px; font-weight:bold">${key}</div>
          <p>⚡ This key refreshes every 30 minutes ⚡</p>
          <p id="timer" style="color:#ff4444; font-size:18px; margin-top:15px"></p>
        </div>
        <script>
          let remaining = ${timeLeft};
          let startTime = Date.now();
          let serverTimeLeft = ${timeLeft};
          
          function updateTimer() {
            // Calculate elapsed time since page load
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const currentRemaining = Math.max(0, serverTimeLeft - elapsed);
            
            if (currentRemaining <= 0) {
              window.location.href = "https://kamscriptsbypass.xo.je";
              return;
            }
            
            document.getElementById("timer").innerText = "⏳ Time left: " + currentRemaining + "s";
          }
          
          // Update timer every second
          setInterval(updateTimer, 1000);
          updateTimer();
          
          // Fallback: Force redirect after server time expires
          setTimeout(function() {
            window.location.href = "https://kamscriptsbypass.xo.je";
          }, ${timeLeft * 1000 + 1000});
        </script>
      </body>
      </html>
    `);
  }

  
  return res.redirect("https://kamscriptsbypass.xo.je");
});

app.get("/raw", (req, res) => {
  const ua = req.get("user-agent") || "";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  
  if (ua) {
    const isBrowser = (ua.includes("Mozilla") && ua.includes("Chrome")) || 
                      (ua.includes("Mozilla") && ua.includes("Safari")) ||
                      (ua.includes("Mozilla") && ua.includes("Firefox")) ||
                      (ua.includes("Edge"));
    const isExecutor = ua.includes("Roblox") || 
                       ua.includes("executor") || 
                       ua.includes("script") ||
                       ua.includes("HttpService") ||
                       ua.length < 20; // Kısa user-agent'lar genelde executor'lardan gelir
    
    if (isBrowser && !isExecutor) {
      return res.redirect("https://kamscriptsbypass.xo.je");
    }
  }
  

  if (!isValid(ip)) {
    // Yeni key oluştur ve session'a kaydet
    const newKey = getCachedTenMinuteKey();
    activeSessions[ip] = {
      expiresAt: Date.now() + 30 * 60 * 1000,  
      key: newKey  
    };
  }
  
  res.set("Content-Type", "text/plain");
  res.set("Access-Control-Allow-Origin", "*"); 
  
  res.send(getSessionKey(ip));
});

app.listen(3000, () => console.log("🚀 KamScripts Premium Key Server running with 30-min countdown"));

