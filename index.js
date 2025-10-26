const { default: makeWASocket, useMultiFileAuthState } = require("@adiwajshing/baileys");
const fs = require("fs");
const ftp = require("basic-ftp");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const sock = makeWASocket({ auth: state });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const from = msg.key.remoteJid;

    if (text.startsWith("!whitelist ")) {
      const name = text.split(" ")[1];
      if (!name) return sock.sendMessage(from, { text: "❌ Format salah. Gunakan: !whitelist Nama_Karakter" });

      fs.appendFileSync("whitelist.txt", name + "\n");
      await sock.sendMessage(from, { text: `✅ ${name} berhasil di-whitelist.` });

      // === opsional upload ke server SAMP ===
      try {
        const client = new ftp.Client();
        await client.access({
          host: process.env.FTP_HOST,
          user: process.env.FTP_USER,
          password: process.env.FTP_PASS,
          secure: false
        });
        await client.uploadFrom("whitelist.txt", "/scriptfiles/whitelist.txt");
        client.close();
        await sock.sendMessage(from, { text: "📤 File whitelist berhasil di-upload ke server." });
      } catch (err) {
        console.error(err);
        await sock.sendMessage(from, { text: "⚠️ Gagal upload ke server SAMP." });
      }
    }
  });
}

startBot();
