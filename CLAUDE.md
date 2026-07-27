# CLAUDE.md — OTTO VOX (OTTO VOICE)

> Contexto para LLMs. Última atualização: 2026-06-03.

## Descrição

Motor de **síntese vocal emocional** para pacientes laringectomizados ou com comprometimento vocal ORL.
Dois motores de voz:
- **Web Speech API** (gratuita, funciona offline, qualidade variável por dispositivo)
- **ElevenLabs Premium** (pago, modelo `eleven_multilingual_v2`, voz hiper-realista via proxy serverless)

O sistema possui um **Emotion Wheel** com 9 emoções mapeadas (neutro, alegria, felicidade, tristeza, ansiedade, dúvida, irritação, dor, angústia) × 3 níveis de intensidade (suave/moderada/intensa), além de controles manuais para pitch/rate/volume.

---

## Build & Test Commands

```bash
npm install            # Instala dependências
npm run dev            # Servidor de desenvolvimento (Vite)
npm run build          # Build de produção (vite build)
npm run test           # Vitest
npm run test:watch     # Vitest em modo watch
npm run test:coverage  # Cobertura de código
```

---

## Stack

| Camada      | Tecnologia                          |
|-------------|-------------------------------------|
| Framework   | React 18 + JSX (sem TypeScript)     |
| Bundler     | Vite 5                              |
| Testes      | Vitest 2 + Testing Library + jsdom  |
| Ícones      | lucide-react                        |
| Deploy      | Vercel (frontend + serverless unificados) |
| TTS Premium | ElevenLabs API v1 (`eleven_multilingual_v2`) |
| Auth        | Firebase Auth (token verificado no serverless) |

---

## Segurança & Auth

- **Firebase Auth: ✅ implementado** — o endpoint `/api/tts` exige `Authorization: Bearer <firebase_token>`
- Usa `firebase-admin` no serverless (`api/tts.js`) para `admin.auth().verifyIdToken()`
- Requests sem token ou com token inválido recebem `401 Unauthorized`
- Rate limiting adicional por UID (20 req/min) como camada extra de proteção
- CORS restrito a origens do ecossistema OTTO (allowlist explícita)
- O endpoint protege a chave ElevenLabs no servidor; a API key NUNCA é enviada ao client
- Sem dados de paciente persistidos — apenas `localStorage` para preferências

### Recebimento de Token via postMessage
O `usePremiumTTS` escuta `postMessage` do PWA Shell para receber o token Firebase:
```js
// PWA Shell envia:
postMessage({ type: 'otto-context', payload: { firebaseToken, userName, userId } })
// OTTO VOX responde:
postMessage({ type: 'otto-voice-ready' })
```

Se o token não estiver disponível, o motor Premium faz fallback transparente para Web Speech.

---

## Variáveis de Ambiente

| Variável            | Onde             | Descrição                                  |
|---------------------|------------------|--------------------------------------------|
| `ELEVENLABS_API_KEY` | Vercel (server) | Chave da API ElevenLabs para TTS premium   |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Vercel (server) | JSON inline do service account Firebase |
| `VITE_TTS_API_URL` | Vercel (build-time, opcional) | URL absoluta do endpoint TTS (default: `/api/tts`) |

---

## Endpoint Serverless — `/api/tts`

**Arquivo:** `api/tts.js` (Vercel Serverless Function)

```
POST /api/tts
Content-Type: application/json
Authorization: Bearer <firebase_token>

{
  "text": "Texto a sintetizar",
  "voiceId": "opcional — default: Rachel (21m00Tcm4TlvDq8ikWAM)"
}

Response: audio/mpeg (binary stream)
```

> ⚠️ Requer autenticação Firebase. Requests sem token válido retornam `401 Unauthorized`.

### Fluxo:
1. Client envia texto + voiceId + Bearer token
2. Serverless verifica token Firebase via `firebase-admin`
3. Rate limiting por UID (20/min)
4. Valida texto (máx 1000 chars)
5. Request server-to-server para `api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream`
6. Retorna stream de áudio MP3

### Fallback Automático:
Se o premium falhar (offline, timeout 8s, quota 429, auth 401, sem token), o `usePremiumTTS` aciona Web Speech API transparentemente com banner visual.

---

## Arquitetura de Pastas

```
OTTO VOICE/
├── api/
│   └── tts.js                  # Vercel Serverless — proxy ElevenLabs com Firebase Auth
├── src/
│   ├── App.jsx                 # App principal — orquestra tudo
│   ├── main.jsx                # Entry point React
│   ├── index.css               # Estilos globais (CSS puro, tema claro/escuro)
│   ├── components/
│   │   ├── EmotionWheel.jsx    # Roleta de 9 emoções com scroll snap horizontal
│   │   ├── ManualControls.jsx  # Sliders manuais (pitch/rate/volume)
│   │   ├── PlayerControls.jsx  # Botões play/pause/stop (long-press stop)
│   │   ├── QuickPhrases.jsx    # Frases rápidas clínicas (saudações + necessidades)
│   │   ├── Recorder.jsx        # Gravador de voz do navegador
│   │   └── SetupScreen.jsx     # Wizard inicial (gênero, estilo, idioma)
│   ├── hooks/
│   │   ├── useEmotionEngine.js # Motor de emoções — 9 emoções × 3 intensidades × 3 estilos
│   │   ├── usePhrases.js       # CRUD de frases favoritas (localStorage)
│   │   ├── usePremiumTTS.js    # Motor ElevenLabs com Firebase Auth + fallback Web Speech
│   │   ├── useRecorder.js      # MediaRecorder API
│   │   ├── useSettings.js      # Persistência de configurações (localStorage)
│   │   └── useTTS.js           # Motor Web Speech API (detecção de vozes PT-BR)
│   └── tests/
│       ├── setup.js
│       ├── auditoria.clinica.test.js
│       ├── useEmotionEngine.test.js
│       ├── usePhrases.test.js
│       └── useSettings.test.js
├── package.json
├── vercel.json                 # CSP + frame-ancestors para integração PWA
└── vite.config.js
```

---

## Motor de Emoções — `useEmotionEngine`

### 9 Emoções Mapeadas

| Emoção      | Emoji | pitchDelta | rateDelta | volume | Cor UI   |
|-------------|-------|------------|-----------|--------|----------|
| neutro      | 😐    | 0.00       | 0.00      | 1.00   | #a0b4b2  |
| alegria     | 😄    | +0.45      | +0.25     | 1.00   | #f1c40f  |
| felicidade  | 😊    | +0.35      | +0.18     | 1.00   | #2ecc71  |
| tristeza    | 😢    | -0.40      | -0.30     | 0.80   | #5dade2  |
| ansiedade   | 😰    | +0.25      | +0.50     | 0.95   | #9b59b6  |
| dúvida      | 🤔    | +0.20      | -0.15     | 0.95   | #e67e22  |
| irritação   | 😠    | -0.20      | +0.35     | 1.00   | #e74c3c  |
| dor         | 😣    | -0.45      | -0.35     | 0.85   | #c0392b  |
| angústia    | 😩    | -0.30      | -0.28     | 0.82   | #7f8c8d  |

### Fórmula de Cálculo

```
pitch_final = clamp(1.0 + pitchDelta × intensityMultiplier, 0.5, 2.0)
rate_final  = clamp(1.0 + rateDelta × intensityMultiplier + styleOffset, 0.5, 2.5)
```

**Multiplicadores de Intensidade:** suave=0.5, moderada=1.0, intensa=1.5

**Presets de Estilo:** formal (rateOffset: -0.08, pausas), casual (0, sem pausas), narrativo (-0.05, pausas)

---

## Deploy

| Ambiente   | Plataforma | URL                                |
|------------|------------|------------------------------------|
| Frontend   | Vercel     | `https://otto-voice-one.vercel.app` |
| Serverless | Vercel     | `/api/tts` (mesma origin)          |

> Deploy unificado na Vercel resolve o problema de CORS do deploy split anterior (GitHub Pages + Vercel).

---

## Integração PWA Shell (postMessage)

**Implementada** via listener em `usePremiumTTS.js`:
- Recebe `otto-context` com `firebaseToken` do PWA Shell
- Usa o token para autenticação no `/api/tts`
- Se não receber token (standalone), funciona com Web Speech API apenas

---

## Pontos de Atenção

1. **Web Speech varia por dispositivo:** Vozes PT-BR podem não existir em todos os Android
2. **ElevenLabs quota:** Rate limiting por UID (20/min) — monitorar uso
3. **JSX sem TypeScript:** Único módulo clínico sem tipagem estática (migração futura)
4. **Parâmetros de emoções:** Não validados clinicamente — valores baseados em heurísticas
5. **Gravador:** Áudio fica apenas local no dispositivo — sem upload/persistência
