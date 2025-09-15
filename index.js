const express = require("express");
const app = express();

// Saatlik key oluşturucu
function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const seed = new Date().toISOString().slice(0, 13); // yıl+ay+gün+saat
  let key = "";
  for (let i = 0; i < 10; i++) {
    const rand = Math.floor(Math.random() * chars.length);
    key += chars[rand];
  }
  return key;
}

// Ana endpoint
app.get("/", (req, res) => {
  const key = generateKey();

  // Eğer exploit (Roblox HttpGet) çağırıyorsa → sadece key dön
  const ua = req.headers["user-agent"] || "";
  if (ua.includes("Roblox")) {
    return res.send(key);
  }

  // Normal kullanıcıya HTML göster
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>KamScripts Premium Key</title>
      <style>
        body {
          background: #0f0f0f;
          color: #ffd700;
          font-family: Arial, sans-serif;
          text-align: center;
          padding-top: 100px;
        }
        .box {
          background: #111;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 0 20px rgba(255,215,0,0.4);
          display: inline-block;
        }
        .key {
          font-size: 22px;
          font-weight: bold;
          color: #00ffea;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>KamScripts Premium Key</h1>
        <div class="key">${key}</div>
        <p>⚡ This key refreshes every 1 hour ⚡</p>
      </div>
    </body>
    </html>
  `);
});

// Vercel port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
