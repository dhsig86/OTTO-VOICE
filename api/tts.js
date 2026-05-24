// ── Rate Limiter em memória (por IP) ─────────────────────────────────────────
// Protege a chave ElevenLabs de abuso sem exigir login.
// Pacientes laringectomizados usam este módulo sem conta Google.
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX = 30;           // máx. 30 requests por IP por minuto

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// Limpa IPs antigos a cada 5 minutos para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 300_000);

export default async function handler(req, res) {
  // CORS restrito — apenas origens do ecossistema OTTO
  const ALLOWED_ORIGINS = [
    'https://otto.drdariohart.com',
    'https://ottos-plum.vercel.app',
    'https://ottopwa.vercel.app',
    'https://dhsig86.github.io',
    'http://localhost:5173',
    'http://localhost:5179',
  ];
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Apenas aceita requisições POST com texto
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Rate limiting por IP
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.headers['x-real-ip']
                || req.socket?.remoteAddress
                || 'unknown';
  if (isRateLimited(clientIp)) {
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

  // Se o paciente não informou uma Voice_ID clonada no Setup, usamos a voz natural "Rachel"
  const finalVoiceId = voiceId?.trim() || '21m00Tcm4TlvDq8ikWAM';
  
  // A chave fica protegida DENTRO da Vercel e NUNCA vai pro celular do paciente
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'API Key da ElevenLabs não configurada no servidor.' });
  }

  try {
    // Comunicação Server-to-Server com ElevenLabs garantindo segurança
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Suporta PT-BR hiper-realista nativamente
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.1, // Sutil melhora nas inflexões contextuais do texto
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ElevenLabs (${response.status}): ${errText}`);
    }

    // Retorna o fluxo (Stream) de áudio cru/binário para o Front-End
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(buffer);

  } catch (error) {
    console.error('OTTO VOX Serverless TTS Error:', error);
    res.status(500).json({ error: error.message || 'Falha na comunicação com a IA de voz' });
  }
}
