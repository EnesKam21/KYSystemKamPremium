const express = require("express");
const app = express();

// Key generator
function generateKey(seed) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 10; i++) {
    const rand = Math.floor(Math.sin(seed + i) * 10000) % chars.length;
    key += chars[Math.abs(rand)];
  }
  return key;
}

// 10 dakikalık blok bazlı key
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
  return { key: generateKey(seed), block: tenMinuteBlock, hour: date.getUTCHours() };
}

// Middleware: cookie check
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/", (req, res) => {
  const ref = req.get("referer") || "";
  if (!ref.includes("linkvertise.com")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  const { key, block, hour } = getTenMinuteKey();

  // Cookie ile kontrol et
  const lastHour = req.cookies?.lastHour;
  const lastBlock = req.cookies?.lastBlock;

  if (lastHour && lastBlock) {
    // Eğer yeni blok başladıysa -> bypass
    if (parseInt(lastHour) !== hour || parseInt(lastBlock) !== block) {
      return res.redirect("https://kamscriptsbypass.xo.je");
    }
  }

  // Cookie set et
  res.cookie("lastHour", hour.toString(), { maxAge: 10 * 60 * 1000, httpOnly: true });
  res.cookie("lastBlock", block.toString(), { maxAge: 10 * 60 * 1000, httpOnly: true });

  // Key sayfası
  res.send(`
    <html>
    <head><title>KamScripts Premium Key</title></head>
    <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif">
      <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4)">
        <h1>KamScripts Premium Key</h1>
        <div style="color:#00ffea; font-size:22px; font-weight:bold">${key}</div>
        <p>⚡ This key refreshes every 10 minutes ⚡</p>
      </div>
    </body>
    </html>
  `);
});

app.get("/raw", (req, res) => {
  const ua = req.get("user-agent") || "";

  // Tarayıcı engelle
  if (ua.includes("Mozilla") || ua.includes("Chrome")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  res.set("Content-Type", "text/plain");
  res.send(getTenMinuteKey().key);
});

app.listen(3000, () => console.log("🚀 KamScripts Linkvertise-Locked Key Server running (10 min refresh + cookie check)"));
