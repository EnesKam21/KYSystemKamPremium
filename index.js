const express = require("express");
const session = require("express-session");
const app = express();

// Session middleware
app.use(session({
  secret: "kam-super-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 10 * 60 * 1000 } // 10 dk
}));

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

// Ana sayfa
app.get("/", (req, res) => {
  const ref = req.get("referer") || "";

  // Eğer session geçerli değilse ve referer linkvertise değilse → bypass
  if (!req.session.valid && !ref.includes("linkvertise.com")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  // Eğer session yoksa yeni session aç
  if (!req.session.valid && ref.includes("linkvertise.com")) {
    req.session.valid = true;
    req.session.startTime = Date.now();
  }

  // Eğer session 10 dk geçtiyse → bypass
  if (req.session.startTime && Date.now() - req.session.startTime > 10 * 60 * 1000) {
    req.session.destroy(() => {});
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  // Key üret
  const key = getTenMinuteKey();
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

// Raw endpoint
app.get("/raw", (req, res) => {
  const ua = req.get("user-agent") || "";

  // Tarayıcıyla giriyorsa bypass
  if (ua.includes("Mozilla") || ua.includes("Chrome")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  // Eğer session geçerli değilse → bypass
  if (!req.session.valid) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  // Session süresi dolmuşsa → bypass
  if (req.session.startTime && Date.now() - req.session.startTime > 10 * 60 * 1000) {
    req.session.destroy(() => {});
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  res.set("Content-Type", "text/plain");
  res.send(getTenMinuteKey());
});

app.listen(3000, () => console.log("🚀 KamScripts Premium Key Server running with 10-min session limit"));
