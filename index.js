const express = require("express");
const app = express();

function generateKey(seed) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 10; i++) {
    const rand = Math.floor(Math.sin(seed + i) * 10000) % chars.length;
    key += chars[Math.abs(rand)];
  }
  return key;
}

function getFiveMinKey() {
  const date = new Date();
  const fiveMinBlock = Math.floor(date.getUTCMinutes() / 5);
  const seed = parseInt(
    date.getUTCFullYear().toString() +
    (date.getUTCMonth() + 1).toString().padStart(2, "0") +
    date.getUTCDate().toString() +
    date.getUTCHours().toString() +
    fiveMinBlock.toString()
  );
  return generateKey(seed);
}

// INDEX → sadece linkvertise referrer ile göster
app.get("/", (req, res) => {
  const ref = req.get("referer") || "";
  if (!ref.includes("linkvertise.com")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  const key = getFiveMinKey();
  res.send(`
    <html>
    <head><title>KamScripts Premium Key</title></head>
    <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif">
      <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4)">
        <h1>KamScripts Premium Key</h1>
        <div style="color:#00ffea; font-size:22px; font-weight:bold">${key}</div>
        <p>⚡ This key refreshes every 5 minutes ⚡</p>
      </div>
    </body>
    </html>
  `);
});

// RAW → sadece executor
app.get("/raw", (req, res) => {
  const ua = req.get("user-agent") || "";

  // Eğer tarayıcı (Mozilla/Chrome) → redirect
  if (ua.includes("Mozilla") || ua.includes("Chrome")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  // Executor (Roblox veya boş UA) → key ver
  res.set("Content-Type", "text/plain");
  res.send(getFiveMinKey());
});

app.listen(3000, () => console.log("🚀 KamScripts Linkvertise-Locked Key Server running"));
