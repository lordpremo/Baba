import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import express from "express";
import axios from "axios";
import cors from "cors";
import pino from "pino";

const logger = pino({ transport: { target: "pino-pretty" } });

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// SETTINGS
// =========================
const PREFIX = "."; // mfano: .menu, .yt, .ai
const MENU_IMAGE = "https://upcdn.io/kW2K8mM/raw/uploads/2026/02/17/4j9r78e4Jt-image.jpg%20(20).png";

// =========================
// GLOBAL SOCKET CACHE
// =========================
const sessions = {};

// =========================
// PAIR CODE ENDPOINT
// =========================
app.get("/pair", async (req, res) => {
  try {
    const phone = req.query.phone;
    if (!phone) return res.json({ error: "Phone number required ?phone=2557xxxx" });

    const { state, saveCreds } = await useMultiFileAuthState("./auth/" + phone);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger
    });

    let sent = false;

    sock.ev.on("connection.update", (update) => {
      const { qr, connection } = update;

      if (!sent && qr) {
        sent = true;
        sessions[phone] = sock;
        return res.json({
          phone,
          pair_code: qr,
          note: "Scan hii QR kwenye WhatsApp > Linked Devices"
        });
      }

      if (connection === "open") {
        logger.info("CONNECTED: " + phone);
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// =========================
// START BOT SESSION MANUALLY (OPTIONAL)
// =========================
app.get("/start-bot", async (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.json({ error: "phone required" });

  await startBot(phone);
  return res.json({ status: "bot started for " + phone });
});

// =========================
// BOT LOGIC
// =========================
async function startBot(sessionId) {
  const { state, saveCreds } = await useMultiFileAuthState("./auth/" + sessionId);

  const sock = makeWASocket({
    auth: state,
    logger
  });

  sessions[sessionId] = sock;

  sock.ev.on("messages.upsert", async (msg) => {
    try {
      const m = msg.messages[0];
      if (!m.message) return;

      const jid = m.key.remoteJid;
      const fromMe = m.key.fromMe;

      if (fromMe) return;

      const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        "";

      if (!text.startsWith(PREFIX)) return;

      const body = text.slice(PREFIX.length).trim();
      const [cmd, ...rest] = body.split(" ");
      const arg = rest.join(" ").trim();

      console.log("CMD:", cmd, "ARG:", arg);

      // ========== BASIC COMMANDS ==========
      if (cmd === "ping") {
        return sock.sendMessage(jid, { text: "PONG ✅" });
      }

      if (cmd === "help") {
        return sock.sendMessage(jid, {
          text:
            `🔥 BROKEN LORD WHATSAPP BOT\n\n` +
            `Prefix: ${PREFIX}\n\n` +
            `Commands:\n` +
            `${PREFIX}menu\n` +
            `${PREFIX}yt <query>\n` +
            `${PREFIX}ai <text>\n` +
            `${PREFIX}suno <prompt>\n` +
            `${PREFIX}logo <prompt>\n` +
            `${PREFIX}math <question>\n` +
            `${PREFIX}img2prompt <url>\n` +
            `${PREFIX}creart <prompt>\n` +
            `${PREFIX}vcc <visa/mastercard/amex/jsb>\n` +
            `${PREFIX}ytsearch <query>\n` +
            `${PREFIX}mp3 <yt_url>\n` +
            `${PREFIX}owner\n`
        });
      }

      if (cmd === "owner") {
        return sock.sendMessage(jid, {
          text: "👑 BOT BY: BROKEN LORD\nWhatsApp: +2557XXXXXXXX"
        });
      }

      // ========== MENU ==========
      if (cmd === "menu") {
        return sock.sendMessage(jid, {
          image: { url: MENU_IMAGE },
          caption:
            `🔥 BROKEN LORD WHATSAPP BOT\n\n` +
            `Prefix: ${PREFIX}\n\n` +
            `📌 MAIN COMMANDS:\n` +
            `${PREFIX}yt <query>\n` +
            `${PREFIX}ai <text>\n` +
            `${PREFIX}suno <prompt>\n` +
            `${PREFIX}logo <prompt>\n` +
            `${PREFIX}math <question>\n` +
            `${PREFIX}img2prompt <url>\n` +
            `${PREFIX}creart <prompt>\n` +
            `${PREFIX}vcc <visa/mastercard/amex/jsb>\n` +
            `${PREFIX}ytsearch <query>\n` +
            `${PREFIX}mp3 <yt_url>\n` +
            `\nType ${PREFIX}help for full list.`
        });
      }

      // ========== NEXRAY API COMMANDS ==========

      // YT PLAY
      if (cmd === "yt") {
        if (!arg) return sock.sendMessage(jid, { text: "Tumia: " + PREFIX + "yt Zuchu" });
        const r = await axios.get(
          `https://api.nexray.web.id/downloader/ytplay?q=${encodeURIComponent(arg)}`
        );
        const data = r.data;
        let caption = `🎵 YT PLAY RESULT\n\nTitle: ${data.title || "-"}\n`;
        if (data.url) caption += `URL: ${data.url}\n`;
        return sock.sendMessage(jid, {
          image: data.thumbnail ? { url: data.thumbnail } : undefined,
          caption
        });
      }

      // AI CHAT
      if (cmd === "ai") {
        if (!arg) return sock.sendMessage(jid, { text: "Tumia: " + PREFIX + "ai Hi" });
        const r = await axios.get(
          `https://api.nexray.web.id/ai/turbochat?text=${encodeURIComponent(arg)}`
        );
        return sock.sendMessage(jid, { text: r.data.result || "No response" });
      }

      // SUNO MUSIC
      if (cmd === "suno") {
        if (!arg) return sock.sendMessage(jid, { text: "Tumia: " + PREFIX + "suno love" });
        const r = await axios.get(
          `https://api.nexray.web.id/ai/suno?prompt=${encodeURIComponent(arg)}`
        );
        if (r.data.audio_url) {
          return sock.sendMessage(jid, {
            audio: { url: r.data.audio_url },
            mimetype: "audio/mpeg"
          });
        }
        return sock.sendMessage(jid, { text: "Hakuna audio_url kwenye response" });
      }

      // SOLO LOGO
      if (cmd === "logo") {
        if (!arg) return sock.sendMessage(jid, { text: "Tumia: " + PREFIX + "logo Spider" });
        const r = await axios.get(
          `https://api.nexray.web.id/ai/sologo?prompt=${encodeURIComponent(arg)}`
        );
        return sock.sendMessage(jid, {
          image: { url: r.data.url },
          caption: "✅ Logo generated"
        });
      }

      // MATH GPT
      if (cmd === "math") {
        if (!arg) return sock.sendMessage(jid, { text: "Tumia: " + PREFIX + "math 2+2" });
        const r = await axios.get(
          `https://api.nexray.web.id/ai/mathgpt?text=${encodeURIComponent(arg)}`
        );
        return sock.sendMessage(jid, { text: r.data.answer || JSON.stringify(r.data) });
      }

      // IMAGE TO PROMPT
      if (cmd === "img2prompt") {
        if (!arg) return sock.sendMessage(jid, { text: "Tumia: " + PREFIX + "img2prompt <url>" });
        const r = await axios.get(
          `https://api.nexray.web.id/ai/image2prompt?url=${encodeURIComponent(arg)}`
        );
        return sock.sendMessage(jid, { text: r.data.prompt || JSON.stringify(r.data) });
      }

      // CREART (TEXT → IMAGE)
      if (cmd === "creart") {
        if (!arg) return sock.sendMessage(jid, { text: "Tumia: " + PREFIX + "creart Beatifull" });
        const r = await axios.get(
          `https://api.nexray.web.id/ai/creart?prompt=${encodeURIComponent(arg)}`
        );
        return sock.sendMessage(jid, {
          image: { url: r.data.url },
          caption: "✅ Image generated"
        });
      }

      // VCC
      if (cmd === "vcc") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: "Tumia: " + PREFIX + "vcc visa | mastercard | amex | jsb"
          });
        const r = await axios.get(
          `https://api.nexray.web.id/tools/vcc?type=${encodeURIComponent(arg)}`
        );
        return sock.sendMessage(jid, { text: "VCC:\n" + JSON.stringify(r.data, null, 2) });
      }

      // YT SEARCH
      if (cmd === "ytsearch") {
        if (!arg) return sock.sendMessage(jid, { text: "Tumia: " + PREFIX + "ytsearch Zuchu" });
        const r = await axios.get(
          `https://api.nexray.web.id/search/youtube?q=${encodeURIComponent(arg)}`
        );
        return sock.sendMessage(jid, {
          text: "RESULTS:\n" + JSON.stringify(r.data, null, 2)
        });
      }

      // MP3
      if (cmd === "mp3") {
        if (!arg) return sock.sendMessage(jid, { text: "Tumia: " + PREFIX + "mp3 <yt_url>" });
        const r = await axios.get(
          `https://api.nexray.web.id/downloader/v1/ytmp3?url=${encodeURIComponent(arg)}`
        );
        if (r.data.download_url) {
          return sock.sendMessage(jid, {
            audio: { url: r.data.download_url },
            mimetype: "audio/mpeg"
          });
        }
        return sock.sendMessage(jid, { text: "Hakuna download_url kwenye response" });
      }

      // ========== EXTRA SIMPLE COMMANDS (NO API) ==========
      if (cmd === "time") {
        return sock.sendMessage(jid, { text: "⏰ Server time: " + new Date().toLocaleString() });
      }

      if (cmd === "about") {
        return sock.sendMessage(jid, {
          text: "🤖 BROKEN LORD BOT\nMulti-API WhatsApp bot bila key, built for Tanzania & world."
        });
      }
    } catch (e) {
      console.log("ERROR IN MESSAGE HANDLER:", e);
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

// =========================
// SERVER START
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("BROKEN LORD BOT API RUNNING ON PORT " + PORT);
});
