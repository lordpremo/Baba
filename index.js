import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import axios from "axios";
import pino from "pino";

const PREFIX = ".";
const MENU_IMAGE =
  "https://upcdn.io/kW2K8mM/raw/uploads/2026/02/17/4j9r78e4Jt-image.jpg%20(20).png";

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("connection.update", (update) => {
    const { connection } = update;

    if (connection === "open") {
      console.log("🤖 BROKEN LORD BOT CONNECTED SUCCESSFULLY");
    }

    if (connection === "close") {
      console.log("⚠ Connection closed, trying to reconnect...");
      startBot();
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (msg) => {
    try {
      const m = msg.messages[0];
      if (!m.message) return;

      const jid = m.key.remoteJid;
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

      // MENU
      if (cmd === "menu") {
        return sock.sendMessage(jid, {
          image: { url: MENU_IMAGE },
          caption:
            `🔥 BROKEN LORD WHATSAPP BOT\n\n` +
            `Prefix: ${PREFIX}\n\n` +
            `Commands:\n` +
            `${PREFIX}yt <query>\n` +
            `${PREFIX}ai <text>\n` +
            `${PREFIX}suno <prompt>\n` +
            `${PREFIX}logo <prompt>\n` +
            `${PREFIX}math <question>\n` +
            `${PREFIX}img2prompt <url>\n` +
            `${PREFIX}creart <prompt>\n` +
            `${PREFIX}vcc <type>\n` +
            `${PREFIX}ytsearch <query>\n` +
            `${PREFIX}mp3 <yt_url>\n` +
            `${PREFIX}owner\n`
        });
      }

      // OWNER
      if (cmd === "owner") {
        return sock.sendMessage(jid, {
          text: "👑 BROKEN LORD\nWhatsApp: +255688422125"
        });
      }

      // YT PLAY
      if (cmd === "yt") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}yt Zuchu`
          });

        const r = await axios.get(
          `https://api.nexray.web.id/downloader/ytplay?q=${encodeURIComponent(
            arg
          )}`
        );
        return sock.sendMessage(jid, {
          image: r.data.thumbnail ? { url: r.data.thumbnail } : undefined,
          caption: `🎵 ${r.data.title || "-"}\n${r.data.url || ""}`
        });
      }

      // AI CHAT
      if (cmd === "ai") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}ai Hi`
          });

        const r = await axios.get(
          `https://api.nexray.web.id/ai/turbochat?text=${encodeURIComponent(
            arg
          )}`
        );
        return sock.sendMessage(jid, { text: r.data.result || "No response" });
      }

      // SUNO
      if (cmd === "suno") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}suno love`
          });

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

      // LOGO
      if (cmd === "logo") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}logo Spider`
          });

        const r = await axios.get(
          `https://api.nexray.web.id/ai/sologo?prompt=${encodeURIComponent(
            arg
          )}`
        );
        return sock.sendMessage(jid, {
          image: { url: r.data.url },
          caption: "Logo generated ✔"
        });
      }

      // MATH
      if (cmd === "math") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}math 2+2`
          });

        const r = await axios.get(
          `https://api.nexray.web.id/ai/mathgpt?text=${encodeURIComponent(
            arg
          )}`
        );
        return sock.sendMessage(jid, {
          text: r.data.answer || JSON.stringify(r.data)
        });
      }

      // IMAGE TO PROMPT
      if (cmd === "img2prompt") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}img2prompt <url>`
          });

        const r = await axios.get(
          `https://api.nexray.web.id/ai/image2prompt?url=${encodeURIComponent(
            arg
          )}`
        );
        return sock.sendMessage(jid, {
          text: r.data.prompt || JSON.stringify(r.data)
        });
      }

      // CREART
      if (cmd === "creart") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}creart Beatifull`
          });

        const r = await axios.get(
          `https://api.nexray.web.id/ai/creart?prompt=${encodeURIComponent(
            arg
          )}`
        );
        return sock.sendMessage(jid, {
          image: { url: r.data.url },
          caption: "Image generated ✔"
        });
      }

      // VCC
      if (cmd === "vcc") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}vcc visa | mastercard | amex | jsb`
          });

        const r = await axios.get(
          `https://api.nexray.web.id/tools/vcc?type=${encodeURIComponent(arg)}`
        );
        return sock.sendMessage(jid, {
          text: "VCC:\n" + JSON.stringify(r.data, null, 2)
        });
      }

      // YT SEARCH
      if (cmd === "ytsearch") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}ytsearch Zuchu`
          });

        const r = await axios.get(
          `https://api.nexray.web.id/search/youtube?q=${encodeURIComponent(
            arg
          )}`
        );
        return sock.sendMessage(jid, {
          text: "RESULTS:\n" + JSON.stringify(r.data, null, 2)
        });
      }

      // MP3
      if (cmd === "mp3") {
        if (!arg)
          return sock.sendMessage(jid, {
            text: `Tumia: ${PREFIX}mp3 <yt_url>`
          });

        const r = await axios.get(
          `https://api.nexray.web.id/downloader/v1/ytmp3?url=${encodeURIComponent(
            arg
          )}`
        );
        if (r.data.download_url) {
          return sock.sendMessage(jid, {
            audio: { url: r.data.download_url },
            mimetype: "audio/mpeg"
          });
        }
        return sock.sendMessage(jid, {
          text: "Hakuna download_url kwenye response"
        });
      }
    } catch (e) {
      console.log("ERROR:", e);
    }
  });
}

startBot();
