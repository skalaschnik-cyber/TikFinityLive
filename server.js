const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { WebcastPushConnection } = require("tiktok-live-connector");

// TikTok Username OHNE @
const TIKTOK_UNIQUE_ID = process.env.TIKTOK_UNIQUE_ID;

if (!TIKTOK_UNIQUE_ID) {
  console.error("❌ Fehler: TIKTOK_UNIQUE_ID fehlt");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Web-App aus /public ausliefern
app.use(express.static("public"));

// TikTok Live Verbindung
const tiktok = new WebcastPushConnection(TIKTOK_UNIQUE_ID);

// Hilfsfunktion: Event an alle Browser senden
function send(type, payload) {
  io.emit("event", {
    type,
    payload,
    time: Date.now()
  });
}

// Verbinden
tiktok.connect()
  .then(() => {
    console.log("✅ Verbunden mit TikTok LIVE:", TIKTOK_UNIQUE_ID);
  })
  .catch(err => {
    console.error("❌ TikTok Verbindung fehlgeschlagen:", err);
  });

// EVENTS
tiktok.on("chat", d => send("chat", {
  user: d.uniqueId,
  name: d.nickname,
  text: d.comment
}));

tiktok.on("gift", d => send("gift", {
  user: d.uniqueId,
  name: d.nickname,
  gift: d.giftName,
  count: d.repeatCount || 1
}));

tiktok.on("like", d => send("like", {
  user: d.uniqueId,
  name: d.nickname,
  totalLikes: d.totalLikeCount
}));

tiktok.on("follow", d => send("follow", {
  user: d.uniqueId,
  name: d.nickname
}));

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🌐 Server läuft auf Port", PORT);
});
