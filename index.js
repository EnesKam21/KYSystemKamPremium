const express = require("express");
const app = express();

const activeSessions = new Map();

function generateKey(seed) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 10; i++) {
    const rand = Math.floor(Math.sin(seed + i) * 10000) % chars.length;
    key += chars[Math.abs(rand)];
  }
  return key;
}

function getTenMinuteKey() {
  const date = new Date();
  const tenMinuteBlock = Math.floor(date.getUTCMinutes() / 10);
  const seed = parseInt(
    date.getUTCFullYear().toString() +
    (date.getUTCMonth() + 1).toString().padStart(2, "0") +
    date.getUTCDate().toString() +
    date.getUTCHours().toString().padStart(2, "0") +
    tenMinuteBlock.toString()
  );
  return generateKey(seed);
}

function sessionCheck(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.ip; // Vercel gerçek IP
  const session = activeSessions.get(ip);
  const now = Date.now();

  if (session && session.expiresAt > now) {
    req.sessionValid = true;
    req.sessionKey = session.lastKey;
  } else {
    req.sessionValid = false;
  }
  next();
}

app.get("/", sessionCheck, (req, res) => {
  const ref = req.get("referer") || "";
  const ip = req.headers["x-forwarded-for"] || req.ip;
  const now = Date.now();

  if (!req.sessionValid && !ref.includes("linkvertise.com")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  if (!req.sessionValid && ref.includes("linkvertise.com")) {
    const newKey = getTenMinuteKey();
    activeSessions.set(ip, {
      expiresAt: now + 10 * 60 * 1000,
      lastKey: newKey,
    });
    req.sessionValid = true;
    req.sessionKey = newKey;
  }

  if (!req.sessionValid) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  res.send(`
    <html>
    <head><title>KamScripts Premium Key</title></head>
    <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif">
      <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4)">
        <h1>KamScripts Premium Key</h1>
        <div style="color:#00ffea; font-size:22px; font-weight:bold">${req.sessionKey}</div>
        <p>⚡ This key refreshes every 10 minutes ⚡</p>
      </div>
    </body>
    </html>
  `);
});

app.get("/raw", sessionCheck, (req, res) => {
  const ua = req.get("user-agent") || "";
  const ip = req.headers["x-forwarded-for"] || req.ip;

  if (ua.includes("Mozilla") || ua.includes("Chrome") || ua.includes("Safari")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  if (!req.sessionValid) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  res.set("Content-Type", "text/plain");
  res.send(activeSessions.get(ip).lastKey);
});

// ✅ Vercel için sadece export et
module.exports = app;
