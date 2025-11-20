const express = require("express");
const app = express();

const TARGET_DOMAIN = "ky-system-kam-premium.vercel.app";
const ALLOWED_LINKVERTISE_ID = "1349121/gR80QtCJWhbJ";
const requestHistory = {};
const MAX_REQUESTS_PER_MINUTE = 5;
const verificationTokens = new Map();
const VERIFICATION_TIMEOUT = 30000;
const linkvertiseAccessSessions = new Map();

function generateKey(seed) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  let currentSeed = seed;
  
  for (let i = 0; i < 10; i++) {
    const sinValue = Math.sin(currentSeed + i);
    const rand = Math.abs(Math.floor(sinValue * 10000)) % chars.length;
    key += chars[rand];
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
  }
  
  return key;
}

function getTenMinuteKey() {
  const date = new Date();
  const tenMinuteBlock = Math.floor(date.getUTCMinutes() / 10);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const seed = year * 1000000 + month * 10000 + day * 100 + hour * 10 + tenMinuteBlock;
  return generateKey(seed);
}

let cachedKey = null;
let cachedKeyTime = null;

function getCachedTenMinuteKey() {
  const date = new Date();
  const tenMinuteBlock = Math.floor(date.getUTCMinutes() / 10);
  const hour = date.getUTCHours();
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  const cacheKey = `${year}-${month}-${day}-${hour}-${tenMinuteBlock}`;
  
  if (cachedKey && cachedKeyTime === cacheKey) {
    return cachedKey;
  }
  
  cachedKey = getTenMinuteKey();
  cachedKeyTime = cacheKey;
  return cachedKey;
}

function getCurrentKeyBlockEndTime() {
  const date = new Date();
  const minutes = date.getUTCMinutes();
  const tenMinuteBlock = Math.floor(minutes / 10);
  const nextBlockStart = (tenMinuteBlock + 1) * 10;
  const nextBlockDate = new Date(date);
  nextBlockDate.setUTCMinutes(nextBlockStart);
  nextBlockDate.setUTCSeconds(0);
  nextBlockDate.setUTCMilliseconds(0);
  return Math.floor((nextBlockDate.getTime() - date.getTime()) / 1000);
}

function isValidReferrerDomain(ref) {
  if (!ref || ref.trim() === "") return false;
  
  try {
    const url = new URL(ref);
    const hostname = url.hostname.toLowerCase();
    
    const allowedDomains = [
      "linkvertise.com",
      "linkvertise.io",
      "linkvertise.net",
      "link-vertise.com",
      "link-vertise.io",
      "lootlabs.io",
      "lootlabs.com",
      "loot-link.com",
      "loot-link.io",
      "lootlink.com",
      "lootlink.io"
    ];
    
    for (const domain of allowedDomains) {
      if (hostname === domain || hostname.endsWith("." + domain)) {
        return true;
      }
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

function checkRateLimit(ip) {
  const now = Date.now();
  const minuteAgo = now - 60000;
  
  if (!requestHistory[ip]) {
    requestHistory[ip] = [];
  }
  
  requestHistory[ip] = requestHistory[ip].filter(time => time > minuteAgo);
  
  if (requestHistory[ip].length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  requestHistory[ip].push(now);
  return true;
}

function generateVerificationToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function isSuspiciousRequest(req) {
  const ref = req.get("referer") || req.get("referrer") || "";
  const ua = req.get("user-agent") || "";
  
  if (!ref || ref.trim() === "") {
    return true;
  }
  
  try {
    const refUrlObj = new URL(ref);
    const refHostname = refUrlObj.hostname.toLowerCase();
    const refPath = refUrlObj.pathname.toLowerCase();
    
    if (!refHostname.includes("linkvertise.com")) {
      return true;
    }
    
    if (refPath.includes("/success")) {
      return false;
    }
    if (!refPath.includes(ALLOWED_LINKVERTISE_ID.toLowerCase()) && !refPath.includes("/access/" + ALLOWED_LINKVERTISE_ID.toLowerCase())) {
      return true;
    }
  } catch (e) {
    return true;
  }
  
  const refUrl = ref.toLowerCase();
  const currentUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  
  if (refUrl.includes(currentUrl.toLowerCase())) {
    return true;
  }
  
  if (ua.includes("Tampermonkey") || ua.includes("Greasemonkey") || ua.includes("Violentmonkey")) {
    return true;
  }
  
  if (ua.length < 10) {
    return true;
  }
  
  return false;
}

const linkvertiseVisits = new Map();

app.get("/verify", (req, res) => {
  const ref = req.get("referer") || req.get("referrer") || "";
  const origin = req.get("origin") || "";
  const ua = req.get("user-agent") || "";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const cookies = req.get("cookie") || "";
  
  if (!ref || ref.trim() === "") {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  try {
    const refUrlObj = new URL(ref);
    const refHostname = refUrlObj.hostname.toLowerCase();
    const refPath = refUrlObj.pathname.toLowerCase();
    
    if (!refHostname.includes("linkvertise.com")) {
      console.log("❌ Not from linkvertise - IP:", ip);
      return res.redirect("https://kamscriptsbypass.xo.je");
    }
    
    if (!refPath.includes(ALLOWED_LINKVERTISE_ID.toLowerCase()) && !refPath.includes("/success")) {
      console.log("❌ Not from allowed linkvertise link - IP:", ip, "Path:", refPath);
      return res.redirect("https://kamscriptsbypass.xo.je");
    }
    
  } catch (e) {
    console.log("❌ Invalid referrer URL - IP:", ip, "Error:", e.message);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  if (isSuspiciousRequest(req)) {
    console.log("❌ Suspicious request detected - IP:", ip);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  const token = generateVerificationToken();
  const expiresAt = Date.now() + VERIFICATION_TIMEOUT;
  
  verificationTokens.set(token, {
    ref: ref,
    origin: origin,
    expiresAt: expiresAt,
    createdAt: Date.now()
  });
  
  setTimeout(() => {
    verificationTokens.delete(token);
  }, VERIFICATION_TIMEOUT);
  
  return res.redirect(`/?token=${token}`);
});

app.get("/", (req, res) => {
  const token = req.query.token;
  const ref = req.get("referer") || req.get("referrer") || "";
  const origin = req.get("origin") || "";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  
  if (!token) {
    try {
      if (ref && ref.trim() !== "") {
        const refUrlObj = new URL(ref);
        const refHostname = refUrlObj.hostname.toLowerCase();
        const refPath = refUrlObj.pathname.toLowerCase();
        
        if (refHostname.includes("linkvertise.com")) {
          if (refPath.includes(ALLOWED_LINKVERTISE_ID.toLowerCase()) || refPath.includes("/success")) {
            return res.redirect("/verify?ref=" + encodeURIComponent(ref));
          }
        }
      }
    } catch (e) {
    }
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  const verification = verificationTokens.get(token);
  
  if (!verification) {
    console.log("❌ Invalid or expired token");
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  if (Date.now() > verification.expiresAt) {
    console.log("❌ Token expired");
    verificationTokens.delete(token);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  verificationTokens.delete(token);
  
  if (!checkRateLimit(ip)) {
    console.log("❌ Rate limit aşıldı - IP:", ip);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  if (isSuspiciousRequest(req)) {
    console.log("❌ Suspicious request detected - IP:", ip);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  const key = getCachedTenMinuteKey();
  const timeLeft = getCurrentKeyBlockEndTime();
  
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
        <p>⚡ This key refreshes every 10 minutes ⚡</p>
        <p id="timer" style="color:#ff4444; font-size:18px; margin-top:15px"></p>
      </div>
      <div style="position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#ff4444; color:#fff; padding:15px 25px; border-radius:10px; max-width:90%; text-align:center; font-size:14px; box-shadow:0 4px 15px rgba(255,68,68,0.4); z-index:1000;">
        <strong>⚠️ WARNING:</strong> If you came from any YouTube channel or someone other than KamScripts, do not follow that person again. Our only official Discord: <a href="https://discord.gg/BR2Vmfbetp" style="color:#ffd700; text-decoration:underline;" target="_blank">https://discord.gg/BR2Vmfbetp</a>
      </div>
      <script>
        let remaining = ${timeLeft};
        let startTime = Date.now();
        let serverTimeLeft = ${timeLeft};
        
        function updateTimer() {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const currentRemaining = Math.max(0, serverTimeLeft - elapsed);
          
          if (currentRemaining <= 0) {
            window.location.href = "https://kamscriptsbypass.xo.je";
            return;
          }
          
          document.getElementById("timer").innerText = "⏳ Time left: " + currentRemaining + "s";
        }
        
        setInterval(updateTimer, 1000);
        updateTimer();
        
        setTimeout(function() {
          window.location.href = "https://kamscriptsbypass.xo.je";
        }, ${timeLeft * 1000 + 1000});
      </script>
    </body>
    </html>
  `);
});

app.get("/raw", (req, res) => {
  const ref = req.get("referer") || req.get("referrer") || "";
  const origin = req.get("origin") || "";
  const ua = req.get("user-agent") || "";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  
  if (!checkRateLimit(ip)) {
    return res.status(429).send("Rate limit exceeded");
  }
  
  if (ua) {
    const isBrowser = (ua.includes("Mozilla") && ua.includes("Chrome")) || 
                      (ua.includes("Mozilla") && ua.includes("Safari")) ||
                      (ua.includes("Mozilla") && ua.includes("Firefox")) ||
                      (ua.includes("Edge"));
    const isExecutor = ua.includes("Roblox") || 
                       ua.includes("executor") || 
                       ua.includes("script") ||
                       ua.includes("HttpService") ||
                       ua.length < 20 ||
                       !ua.includes("Mozilla");
    
    if (isExecutor) {
      res.set("Content-Type", "text/plain");
      res.set("Access-Control-Allow-Origin", "*");
      return res.send(getCachedTenMinuteKey());
    }
    
    if (isBrowser && !isExecutor) {
      if (!ref || ref.trim() === "") {
        return res.status(403).send("Access denied");
      }
      
      try {
        const refUrlObj = new URL(ref);
        const refHostname = refUrlObj.hostname.toLowerCase();
        const refPath = refUrlObj.pathname.toLowerCase();
        
        if (!refHostname.includes("linkvertise.com")) {
          return res.status(403).send("Access denied");
        }
        
        if (!refPath.includes(ALLOWED_LINKVERTISE_ID.toLowerCase()) && !refPath.includes("/success")) {
          return res.status(403).send("Access denied");
        }
      } catch (e) {
        return res.status(403).send("Access denied");
      }
    }
  } else {
    res.set("Content-Type", "text/plain");
    res.set("Access-Control-Allow-Origin", "*");
    return res.send(getCachedTenMinuteKey());
  }
  
  res.set("Content-Type", "text/plain");
  res.set("Access-Control-Allow-Origin", "*");
  res.send(getCachedTenMinuteKey());
});

setInterval(() => {
  const now = Date.now();
  for (const [token, data] of verificationTokens.entries()) {
    if (now > data.expiresAt) {
      verificationTokens.delete(token);
    }
  }
}, 60000);

app.listen(3000, () => console.log("🚀 KamScripts Premium Key Server running with bypass protection"));
