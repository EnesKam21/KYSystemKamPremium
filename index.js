const express = require("express");
const crypto = require("crypto");
const app = express();

let validTokens = new Set();

// Random token üret
app.get("/get-token", (req, res) => {
  const token = crypto.randomBytes(8).toString("hex"); // 16 karakter random
  validTokens.add(token);

  // Token 30 saniye sonra geçersiz olsun
  setTimeout(() => validTokens.delete(token), 30000);

  res.send(token);
});

// 5 dakikalık key
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

// Raw endpoint -> sadece geçerli token ile
app.get("/raw", (req, res) => {
  const token = req.query.token;
  if (!validTokens.has(token)) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  res.set("Content-Type", "text/plain");
  res.send(getFiveMinKey());
});

app.listen(3000, () => console.log("🚀 KamScripts Secure Key Server running"));
