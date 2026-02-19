import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import readlineSync from "readline-sync";
import pino from "pino";

console.log("📱 BROKEN LORD WHATSAPP BOT PAIRING");
console.log("====================================\n");

const number = readlineSync.question(
  "👉 Ingiza namba ya WhatsApp (mfano: 2557XXXXXXXX): "
);

if (!number.startsWith("255")) {
  console.log("\n❌ Namba lazima ianze na 255");
  process.exit(0);
}

async function generateCode() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("connection.update", async (update) => {
    const { qr, connection } = update;

    if (qr) {
      try {
        const code = await sock.requestPairingCode(number);
        console.log("\n📌 Pairing Code Yako:");
        console.log("👉 " + code + "\n");
        console.log("⚡ Ingia WhatsApp > Linked Devices > Add Device");
        console.log("⚡ Weka code hiyo kuunganisha bot\n");
      } catch (e) {
        console.log("❌ Error generating pairing code:", e);
      }
    }

    if (connection === "open") {
      console.log("✅ Pairing complete! Sasa run: bash broken.sh");
      process.exit(0);
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

generateCode();
