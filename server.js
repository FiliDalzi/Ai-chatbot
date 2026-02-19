import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path, { join } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public"))); // serve index.html e video

// ====== ROUTA ROOT ======
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

// ====== ROUTA /chat ======
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage || userMessage.trim() === "") {
    return res.status(400).json({ reply: "Messaggio vuoto" });
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-125M",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: userMessage }),
      }
    );

    const data = await response.json();
    console.log("HF response:", data); // utile per debug

    let reply = "Nessuna risposta";

    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    } else if (data?.error?.includes("loading")) {
      reply = "Sto caricando il modello, riprova tra qualche secondo";
    }

    res.json({ reply });
  } catch (err) {
    console.error("Errore /chat:", err);
    res.status(500).json({ reply: "Errore nella connessione al server" });
  }
});

// ====== AVVIO SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server attivo sulla porta ${PORT}`));
