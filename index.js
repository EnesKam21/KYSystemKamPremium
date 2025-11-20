require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key-change-this";
const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY || "";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

const requestHistory = {};
const MAX_REQUESTS_PER_MINUTE = 5;
const nonceStore = new Map();
const NONCE_TIMEOUT = 300000;
const verifiedSessions = new Map();
const SESSION_TIMEOUT = 300000;

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

function generateNonce() {
  return crypto.randomBytes(32).toString("hex");
}

function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

async function verifyTurnstile(token, ip) {
  if (!TURNSTILE_SECRET_KEY) {
    console.log("⚠️ TURNSTILE_SECRET_KEY not set, skipping verification");
    return true;
  }
  
  if (!token) {
    return false;
  }
  
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip
      })
    });
    
    const data = await response.json();
    return data.success === true;
  } catch (e) {
    console.log("❌ Turnstile verification error:", e);
    return false;
  }
}

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
         req.headers["x-real-ip"] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         "unknown";
}

app.get("/start", (req, res) => {
  const ip = getClientIP(req);
  
  if (!checkRateLimit(ip)) {
    console.log("❌ Rate limit exceeded - IP:", ip);
    return res.status(429).json({ error: "Rate limit exceeded" });
  }
  
  const nonce = generateNonce();
  const expiresAt = Date.now() + NONCE_TIMEOUT;
  
  nonceStore.set(nonce, {
    ip: ip,
    createdAt: Date.now(),
    expiresAt: expiresAt,
    used: false
  });
  
  setTimeout(() => {
    nonceStore.delete(nonce);
  }, NONCE_TIMEOUT);
  
  console.log("✅ Nonce generated - IP:", ip, "nonce:", nonce.substring(0, 8) + "...");
  
  res.json({
    nonce: nonce,
    turnstileSiteKey: TURNSTILE_SITE_KEY
  });
});

app.post("/verify", async (req, res) => {
  const { nonce, turnstileToken } = req.body;
  const ip = getClientIP(req);
  
  if (!nonce || !turnstileToken) {
    console.log("❌ Missing nonce or turnstileToken - IP:", ip);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  if (!nonceStore.has(nonce)) {
    console.log("❌ Invalid nonce - IP:", ip);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  const nonceData = nonceStore.get(nonce);
  
  if (nonceData.used) {
    console.log("❌ Nonce already used - IP:", ip);
    nonceStore.delete(nonce);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  if (Date.now() > nonceData.expiresAt) {
    console.log("❌ Nonce expired - IP:", ip);
    nonceStore.delete(nonce);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  if (nonceData.ip !== ip) {
    console.log("❌ IP mismatch - stored IP:", nonceData.ip, "request IP:", ip);
    nonceStore.delete(nonce);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  const turnstileValid = await verifyTurnstile(turnstileToken, ip);
  
  if (!turnstileValid) {
    console.log("❌ Turnstile verification failed - IP:", ip);
    nonceStore.delete(nonce);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  const sessionId = generateSessionId();
  const expiresAt = Date.now() + SESSION_TIMEOUT;
  
  nonceData.used = true;
  nonceStore.delete(nonce);
  
  verifiedSessions.set(sessionId, {
    ip: ip,
    createdAt: Date.now(),
    expiresAt: expiresAt
  });
  
  setTimeout(() => {
    verifiedSessions.delete(sessionId);
  }, SESSION_TIMEOUT);
  
  console.log("✅ Verification successful - IP:", ip, "sessionId:", sessionId.substring(0, 8) + "...");
  
  return res.redirect(`/?session=${sessionId}`);
});

app.get("/", (req, res) => {
  const sessionId = req.query.session;
  const ip = getClientIP(req);
  
  if (!sessionId) {
    console.log("❌ No session ID - IP:", ip);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  if (!verifiedSessions.has(sessionId)) {
    console.log("❌ Invalid session ID - IP:", ip);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  const session = verifiedSessions.get(sessionId);
  
  if (Date.now() > session.expiresAt) {
    console.log("❌ Session expired - IP:", ip);
    verifiedSessions.delete(sessionId);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  if (session.ip !== ip) {
    console.log("❌ Session IP mismatch - stored IP:", session.ip, "request IP:", ip);
    verifiedSessions.delete(sessionId);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  if (!checkRateLimit(ip)) {
    console.log("❌ Rate limit exceeded - IP:", ip);
    return res.redirect("https://kamscriptsbypass.xo.je");
  }
  
  const key = getCachedTenMinuteKey();
  const timeLeft = getCurrentKeyBlockEndTime();
  
  verifiedSessions.delete(sessionId);
  
  console.log("✅ Key displayed - IP:", ip);
  
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>KamScripts Premium Key</title>
      <meta http-equiv="refresh" content="${timeLeft + 1};url=https://kamscriptsbypass.xo.je">
      <meta name="referrer" content="no-referrer">
    </head>
    <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif; margin:0; padding:100px 20px 20px 20px">
      <script>
        if (window.top !== window.self) {
          window.top.location.href = "https://kamscriptsbypass.xo.je";
        }
      </script>
      <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4); max-width:600px; width:100%">
        <h1 style="margin:0 0 20px 0">KamScripts Premium Key</h1>
        <div style="color:#00ffea; font-size:22px; font-weight:bold; margin:15px 0">${key}</div>
        <p style="margin:15px 0">⚡ This key refreshes every 10 minutes ⚡</p>
        <p id="timer" style="color:#ff4444; font-size:18px; margin-top:15px"></p>
        <div style="margin-top:30px; padding:15px; background:#1a1a1a; border-radius:8px; border:1px solid #333">
          <p style="color:#ffd700; font-size:14px; line-height:1.6; margin:0">
            ⚠️ If you came from any YouTube channel or someone other than KamScripts Discord, do not follow that person again because they are a fake script developer! The only real one is: <a href="https://discord.gg/BR2Vmfbetp" target="_blank" style="color:#00ffea; text-decoration:underline">https://discord.gg/BR2Vmfbetp</a>
          </p>
        </div>
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
          
          const timerEl = document.getElementById("timer");
          if (timerEl) {
            timerEl.innerText = "⏳ Time left: " + currentRemaining + "s";
          }
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
  const ip = getClientIP(req);
  
  if (!checkRateLimit(ip)) {
    return res.status(429).send("Rate limit exceeded");
  }
  
  res.set("Content-Type", "text/plain");
  res.set("Access-Control-Allow-Origin", "*");
  res.send(getCachedTenMinuteKey());
});

app.get("/verify-page", (req, res) => {
  if (!TURNSTILE_SITE_KEY) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification</title>
        <meta name="referrer" content="no-referrer">
      </head>
      <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif; margin:0; padding:100px 20px 20px 20px">
        <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4); max-width:600px; width:100%">
          <h1 style="margin:0 0 20px 0">Verification Required</h1>
          <p style="color:#ff4444;">Turnstile is not configured. Please contact administrator.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Verification</title>
      <meta name="referrer" content="no-referrer">
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    </head>
    <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif; margin:0; padding:100px 20px 20px 20px">
      <script>
        if (window.top !== window.self) {
          window.top.location.href = "https://kamscriptsbypass.xo.je";
        }
      </script>
      <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4); max-width:600px; width:100%">
        <h1 style="margin:0 0 20px 0">Verification Required</h1>
        <div id="turnstile-container" style="margin:20px 0; display:flex; justify-content:center;"></div>
        <div id="error" style="color:#ff4444; margin-top:20px; display:none;"></div>
      </div>
      <script>
        let nonce = null;
        let turnstileWidgetId = null;
        
        async function initVerification() {
          try {
            const response = await fetch("/start");
            if (!response.ok) {
              throw new Error("Failed to get nonce");
            }
            const data = await response.json();
            nonce = data.nonce;
            
            if (!data.turnstileSiteKey) {
              document.getElementById("error").style.display = "block";
              document.getElementById("error").textContent = "Turnstile not configured";
              return;
            }
            
            turnstileWidgetId = turnstile.render("#turnstile-container", {
              sitekey: data.turnstileSiteKey,
              callback: async function(token) {
                try {
                  const verifyResponse = await fetch("/verify", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      nonce: nonce,
                      turnstileToken: token
                    })
                  });
                  
                  if (verifyResponse.redirected) {
                    window.location.href = verifyResponse.url;
                  } else {
                    throw new Error("Verification failed");
                  }
                } catch (e) {
                  document.getElementById("error").style.display = "block";
                  document.getElementById("error").textContent = "Verification failed. Please try again.";
                  if (turnstileWidgetId) {
                    turnstile.reset(turnstileWidgetId);
                  }
                }
              },
              "error-callback": function() {
                document.getElementById("error").style.display = "block";
                document.getElementById("error").textContent = "Verification failed. Please try again.";
                if (turnstileWidgetId) {
                  turnstile.reset(turnstileWidgetId);
                }
              }
            });
          } catch (e) {
            document.getElementById("error").style.display = "block";
            document.getElementById("error").textContent = "Failed to initialize verification. Please refresh the page.";
          }
        }
        
        if (typeof turnstile !== "undefined") {
          initVerification();
        } else {
          window.addEventListener("load", function() {
            if (typeof turnstile !== "undefined") {
              initVerification();
            } else {
              setTimeout(function() {
                document.getElementById("error").style.display = "block";
                document.getElementById("error").textContent = "Failed to load Turnstile. Please refresh the page.";
              }, 3000);
            }
          });
        }
      </script>
    </body>
    </html>
  `);
});

setInterval(() => {
  const now = Date.now();
  for (const [nonce, data] of nonceStore.entries()) {
    if (now > data.expiresAt) {
      nonceStore.delete(nonce);
    }
  }
  for (const [sessionId, session] of verifiedSessions.entries()) {
    if (now > session.expiresAt) {
      verifiedSessions.delete(sessionId);
    }
  }
}, 60000);

app.listen(3000, () => console.log("🚀 KamScripts Premium Key Server running with secure nonce + Turnstile system"));
