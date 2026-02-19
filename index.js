import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import axios from "axios";
import pino from "pino";
import qrcode from "qrcode-terminal";

const PREFIX = ".";
const MENU_IMAGE = "https://upcdn.io/kW2K8mM/raw/uploads/2026/02/17/4j9r78e4Jt-image.jpg%20(20).png";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" })
    });

    sock.ev.on("connection.update", (update) => {
        const { qr, connection } = update;

        if (qr) {
            console.log("📌 Scan QR Code Below:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("🤖 BROKEN LORD BOT CONNECTED SUCCESSFULLY");
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
                "";

            if (!text.startsWith(PREFIX)) return;

            const body = text.slice(PREFIX.length).trim();
            const [cmd, ...rest] = body.split(" ");
            const arg = rest.join(" ");

            console.log("CMD:", cmd, "ARG:", arg);

            // MENU
            if (cmd === "menu") {
                return sock.sendMessage(jid, {
                    image: { url: MENU_IMAGE },
                    caption:
                        `🔥 BROKEN LORD WHATSAPP BOT\n\n` +
                        `Prefix: ${PREFIX}\n\n` +
                        `Commands:\n` +
                        `${PREFIX}yt\n` +
                        `${PREFIX}ai\n` +
                        `${PREFIX}suno\n` +
                        `${PREFIX}logo\n` +
                        `${PREFIX}math\n` +
                        `${PREFIX}img2prompt\n` +
                        `${PREFIX}creart\n` +
                        `${PREFIX}vcc\n` +
                        `${PREFIX}ytsearch\n` +
                        `${PREFIX}mp3\n` +
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
                const r = await axios.get(`https://api.nexray.web.id/downloader/ytplay?q=${arg}`);
                return sock.sendMessage(jid, {
                    image: { url: r.data.thumbnail },
                    caption: `🎵 ${r.data.title}\n${r.data.url}`
                });
            }

            // AI CHAT
            if (cmd === "ai") {
                const r = await axios.get(`https://api.nexray.web.id/ai/turbochat?text=${arg}`);
                return sock.sendMessage(jid, { text: r.data.result });
            }

            // SUNO
            if (cmd === "suno") {
                const r = await axios.get(`https://api.nexray.web.id/ai/suno?prompt=${arg}`);
                return sock.sendMessage(jid, {
                    audio: { url: r.data.audio_url },
                    mimetype: "audio/mpeg"
                });
            }

            // LOGO
            if (cmd === "logo") {
                const r = await axios.get(`https://api.nexray.web.id/ai/sologo?prompt=${arg}`);
                return sock.sendMessage(jid, {
                    image: { url: r.data.url },
                    caption: "Logo generated ✔"
                });
            }

            // MATH
            if (cmd === "math") {
                const r = await axios.get(`https://api.nexray.web.id/ai/mathgpt?text=${arg}`);
                return sock.sendMessage(jid, { text: r.data.answer });
            }

            // IMAGE TO PROMPT
            if (cmd === "img2prompt") {
                const r = await axios.get(`https://api.nexray.web.id/ai/image2prompt?url=${arg}`);
                return sock.sendMessage(jid, { text: r.data.prompt });
            }

            // CREART
            if (cmd === "creart") {
                const r = await axios.get(`https://api.nexray.web.id/ai/creart?prompt=${arg}`);
                return sock.sendMessage(jid, {
                    image: { url: r.data.url },
                    caption: "Image generated ✔"
                });
            }

            // VCC
            if (cmd === "vcc") {
                const r = await axios.get(`https://api.nexray.web.id/tools/vcc?type=${arg}`);
                return sock.sendMessage(jid, { text: JSON.stringify(r.data, null, 2) });
            }

            // YT SEARCH
            if (cmd === "ytsearch") {
                const r = await axios.get(`https://api.nexray.web.id/search/youtube?q=${arg}`);
                return sock.sendMessage(jid, { text: JSON.stringify(r.data, null, 2) });
            }

            // MP3
            if (cmd === "mp3") {
                const r = await axios.get(`https://api.nexray.web.id/downloader/v1/ytmp3?url=${arg}`);
                return sock.sendMessage(jid, {
                    audio: { url: r.data.download_url },
                    mimetype: "audio/mpeg"
                });
            }

        } catch (e) {
            console.log("ERROR:", e);
        }
    });
}

startBot();
