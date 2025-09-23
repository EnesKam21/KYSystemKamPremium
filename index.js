const express = require("express");
const app = express();

const sessions = new Map(); // IP -> { expire, block }

function generateKey(seed) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 10; i++) {
    const rand = Math.floor(Math.sin(seed + i) * 10000) % chars.length;
    key += chars[Math.abs(rand)];
  }
  return key;
}

function getBlockID() {
  const date = new Date();
  const tenMinuteBlock = Math.floor(date.getUTCMinutes() / 10);
  return (
    date.getUTCFullYear().toString() +
    (date.getUTCMonth() + 1).toString().padStart(2, "0") +
    date.getUTCDate().toString() +
    date.getUTCHours().toString().padStart(2, "0") +
    tenMinuteBlock.toString()
  );
}

function getTenMinuteKey() {
  return generateKey(parseInt(getBlockID()));
}

app.get("/", (req, res) => {
  const ip = req.ip;
  const ref = req.get("referer") || "";
  const nowBlock = getBlockID();

  const session = sessions.get(ip);

  // Eğer session varsa
  if (session) {
    // Eğer block aynıysa → key göster
    if (session.block === nowBlock) {
      return res.send(`<h1 style="color:lime">KEY: ${getTenMinuteKey()}<br>(Block ${nowBlock})</h1>`);
    }
    // Block değişmiş → artık tekrar Linkvertise zorunlu
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  // İlk defa → Linkvertise kontrol
  if (!ref.includes("linkvertise.com")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  // Yeni session: geçerli blockID kaydet
  sessions.set(ip, { block: nowBlock });

  return res.send(`<h1 style="color:cyan">KEY: ${getTenMinuteKey()}<br>(New session, Block ${nowBlock})</h1>`);
});

app.get("/raw", (req, res) => {
  const ip = req.ip;
  const nowBlock = getBlockID();
  const session = sessions.get(ip);

  if (!session || session.block !== nowBlock) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  res.set("Content-Type", "text/plain");
  res.send(getTenMinuteKey());
});

app.listen(3000, () => console.log("🚀 KamScripts Key Server running (block-based refresh)"));
