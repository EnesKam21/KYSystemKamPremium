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
    date.getUTCDate().toString().padStart(2, "0") +
    date.getUTCHours().toString() +
    fiveMinBlock.toString()
  );
  return generateKey(seed);
}


app.use((req, res, next) => {
  if (req.path === "/raw") return next(); 
  const ref = req.get("referer") || "";
  const ua = req.get("user-agent") || "";

  if (ua.includes("Roblox")) return next();

  if (!ref.includes("linkvertise.com")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  next();
});


app.get("/", (req, res) => {
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


app.get("/raw", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send(getFiveMinKey());
});


app.listen(3000, () => console.log("🚀 KamScripts Key Server running on port 3000"));
