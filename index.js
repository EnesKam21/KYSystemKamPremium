const express = require("express");

const app = express();

const activeSessions = {}; 

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

function isValid(ip) {
  const session = activeSessions[ip];
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    delete activeSessions[ip];
    return false;
  }
  return true;
}

app.get("/", (req, res) => {
  const ref = req.get("referer") || "";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  if (!isValid(ip)) {
    if (ref.includes("linkvertise.com")) {
      activeSessions[ip] = {
        expiresAt: Date.now() + 10 * 60 * 1000
      };
    } else {
      return res.redirect("https://kamscriptsbypass.xo.je");
    }
  }

  const session = activeSessions[ip];
  if (!session) return res.redirect("https://kamscriptsbypass.xo.je");

  const timeLeft = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  const key = getTenMinuteKey();

  res.send(`
    <html>
    <head>
      <title>KamScripts Premium Key</title>
      <meta http-equiv="refresh" content="${timeLeft + 1};url=https://kamscriptsbypass.xo.je">
    </head>
    <body style="background:#111; color:#ffd700; text-align:center; padding-top:100px; font-family:sans-serif">
      <div style="background:#222; display:inline-block; padding:30px; border-radius:15px; box-shadow:0 0 20px rgba(255,215,0,0.4)">
        <h1>KamScripts Premium Key</h1>
        <div style="color:#00ffea; font-size:22px; font-weight:bold">${key}</div>
        <p>⚡ This key refreshes every 10 minutes ⚡</p>
        <p id="timer" style="color:#ff4444; font-size:18px; margin-top:15px"></p>
      </div>
      <script>
        let remaining = ${timeLeft};
        let startTime = Date.now();
        let serverTimeLeft = ${timeLeft};
        
        function updateTimer() {
          // Calculate elapsed time since page load
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const currentRemaining = Math.max(0, serverTimeLeft - elapsed);
          
          if (currentRemaining <= 0) {
            window.location.href = "https://kamscriptsbypass.xo.je";
            return;
          }
          
          document.getElementById("timer").innerText = "⏳ Time left: " + currentRemaining + "s";
        }
        
        // Update timer every second
        setInterval(updateTimer, 1000);
        updateTimer();
        
        // Fallback: Force redirect after server time expires
        setTimeout(function() {
          window.location.href = "https://kamscriptsbypass.xo.je";
        }, ${timeLeft * 1000 + 1000});
      </script>
    </body>
    </html>
  `);
});

app.get("/raw", (req, res) => {
  const ua = req.get("user-agent") || "";
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  
  if (ua.includes("Mozilla") || ua.includes("Chrome") || ua.includes("Safari") || ua.includes("Edge")) {
    return res.redirect("https://kamscriptsbypass.xo.je");
  }

  
  if (!isValid(ip)) {
    return res.status(403).send("Session expired. Please visit the main page first.");
  }

  res.set("Content-Type", "text/plain");
  res.send(getTenMinuteKey());
});

app.listen(3000, () => console.log("🚀 KamScripts Premium Key Server running with 10-min countdown"));

