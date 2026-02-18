import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

if (!process.env.GOOGLE_API_KEY) {
  console.error("❌ GOOGLE_API_KEY non trovata");
  process.exit(1);
}

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Cartella pubblica
const publicPath = join(__dirname, 'public');

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath)); // Serve index.html, video, css, ecc.

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

// ====== CREDITI ======
const DAILY_LIMIT = 20;
let usedCredits = 0;
let lastReset = new Date().toDateString();

function checkReset() {
  const today = new Date().toDateString();
  if (today !== lastReset) {
    usedCredits = 0;
    lastReset = today;
  }
}

app.post('/chat', async (req, res) => {
  console.log("🔥 /chat chiamata");
  console.log("Body ricevuto:", req.body);

  if (!req.body.message) {
    console.log("Messaggio vuoto");
    return res.status(400).json({ error: "Messaggio vuoto" });
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: req.body.message
    });

    console.log("Risposta completa Gemini:", JSON.stringify(result, null, 2));

    const text =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text
      || "Nessuna risposta generata.";

    res.json({
      reply: text
    });

  } catch (error) {
    console.error("❌ ERRORE COMPLETO:", error);
    res.status(500).json({ error: error.message });
  }
});

// 👇 Serve l'index.html principale
app.get('/', (req, res) => {
  res.sendFile(join(publicPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => 
  console.log(`Server Google AI attivo sulla porta ${PORT}`)
);
