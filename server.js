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

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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
  checkReset();

  if (usedCredits >= DAILY_LIMIT) {
    return res.status(403).json({
      error: "Limite giornaliero raggiunto",
      creditsLeft: 0
    });
  }

  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Messaggio vuoto" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: message
    });

    usedCredits++;

    res.json({
      reply: response.text,
      creditsLeft: DAILY_LIMIT - usedCredits
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 👇 QUESTO APRE L’INDEX.HTML
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => 
  console.log(`Server Google AI attivo sulla porta ${PORT}`)
);
