// ── OTTO VOX — Proxy TTS ElevenLabs com Firebase Auth ──────────────────────
// Segurança: Firebase Auth + Rate Limiting + CORS restrito
// Pacientes laringectomizados precisam de login via OTTO PWA para usar este recurso.

import admin from 'firebase-admin';

// ── Firebase Admin SDK (inicialização lazy) ─────────────────────────────────
let firebaseInitialized = false;

function ensureFirebaseInitialized() {
  if (firebaseInitialized) return;
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!keyJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não configurado no servidor.');
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(keyJson)),
    });
  } catch (e) {
    // Se já inicializado por outro import, ignorar
    if (!e.message.includes('already exists')) throw e;
  }
  firebaseInitialized = true;
}

// ── Rate Limiter em memória (por UID) ───────────────────────────────────────
// Camada adicional de proteção contra abuso mesmo com auth válido.
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX = 20;           // máx. 20 requests por UID por minuto

function isRateLimited(uid) {
  const now = Date.now();
  const entry = rateLimitMap.get(uid);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(uid, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Limpa UIDs antigos a cada 5 minutos para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [uid, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(uid);
    }
  }
}, 300_000);

// ── Handler principal ───────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS restrito — apenas origens do ecossistema OTTO
  const ALLOWED_ORIGINS = [
    'https://otto.drdariohart.com',
    'https://ottos-plum.vercel.app',
    'https://ottopwa.vercel.app',
    'https://otto-voice-one.vercel.app',
    'https://otto-protto.vercel.app',
    'https://otto-cases.vercel.app',
    'https://otto-log.vercel.app',
    'https://otto-calc-hub.vercel.app',
    'http://localhost:5173',
    'http://localhost:5179',
  ];
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // ── Firebase Auth — verificar token ─────────────────────────────────────
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token Bearer ausente. Faça login no OTTO.' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  let uid;
  try {
    ensureFirebaseInitialized();
    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (error) {
    console.error('OTTO VOX Auth Error:', error.message);
    return res.status(401).json({ error: 'Token Firebase inválido ou expirado.' });
  }

  // ── Rate limiting por UID autenticado ───────────────────────────────────
  if (isRateLimited(uid)) {
    return res.status(429).json({ error: 'Muitas requisições. Aguarde 1 minuto.' });
  }

  const { text, voiceId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Nenhum texto fornecido.' });
  }

  // Limita tamanho do texto para evitar abuso de créditos ElevenLabs
  if (text.length > 1000) {
    return res.status(400).json({ error: 'Texto muito longo (máx. 1000 caracteres).' });
  }

  // Voz padrão "Rachel" se não informada
  const finalVoiceId = voiceId?.trim() || '21m00Tcm4TlvDq8ikWAM';

  // A chave ElevenLabs fica protegida DENTRO da Vercel e NUNCA vai pro cliente
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'API Key da ElevenLabs não configurada no servidor.' });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.1,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ElevenLabs (${response.status}): ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(buffer);

  } catch (error) {
    console.error('OTTO VOX Serverless TTS Error:', error);
    res.status(500).json({ error: error.message || 'Falha na comunicação com a IA de voz' });
  }
}
