const express = require("express");
const app = express();

const sessions = new Map(); // IP -> expireTime (timestamp)

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

function isActive(ip) {
  const exp = sessions.get(ip);
  if (!exp) return false;
  if (Date.now() > exp) {
    sessions.delete(ip);
    return false;
  }
  return true;
}

app.get("/", (req, res) => {
  const ip = req.ip;
  const ref = req.get("referer") || "";

  // Eğer aktif session varsa → direkt key ver
  if (isActive(ip)) {
    const key = getTenMinuteKey();
    return res.send(`
      <html>
      <head><title>KamScripts Premium Key</title></head>
      <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif">
        <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4)">
          <h1>KamScripts Premium Key</h1>
          <div style="color:#00ffea; font-size:22px; font-weight:bold">${key}</div>
          <p>⚡ This key refreshes every 10 minutes ⚡</p>
          <p style="color:lime">Session valid until ${new Date(sessions.get(ip)).toLocaleTimeString()} UTC</p>
        </div>
      </body>
      </html>
    `);
  }

  // İlk defa → Linkvertise kontrol
  if (!ref.includes("linkvertise.com")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  // Yeni session: 10 dakika aktif
  sessions.set(ip, Date.now() + 10 * 60 * 1000);

  const key = getTenMinuteKey();
  res.send(`
    <html>
    <head><title>KamScripts Premium Key</title></head>
    <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif">
      <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4)">
        <h1>KamScripts Premium Key</h1>
        <div style="color:#00ffea; font-size:22px; font-weight:bold">${key}</div>
        <p>⚡ This key refreshes every 10 minutes ⚡</p>
        <p style="color:lime">Session valid until ${new Date(sessions.get(ip)).toLocaleTimeString()} UTC</p>
      </div>
    </body>
    </html>
  `);
});

app.get("/raw", (req, res) => {
  const ip = req.ip;

  if (!isActive(ip)) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  res.set("Content-Type", "text/plain");
  res.send(getTenMinuteKey());
});

app.listen(3000, () => console.log("🚀 KamScripts Key Server running (10-min sessions)"));
