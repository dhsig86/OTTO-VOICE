# CLAUDE.md — OTTO VOX (OTTO VOICE)

> Contexto para LLMs. Última atualização: 2026-05-24.

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
npm run test           # Vitest (29/30 passando)
npm run test:watch     # Vitest em modo watch
npm run test:coverage  # Cobertura de código
npm run deploy         # Deploy para GitHub Pages (gh-pages -d dist)
```

---

## Stack

| Camada      | Tecnologia                          |
|-------------|-------------------------------------|
| Framework   | React 18 + JSX (sem TypeScript)     |
| Bundler     | Vite 5                              |
| Testes      | Vitest 2 + Testing Library + jsdom  |
| Ícones      | lucide-react                        |
| Deploy FE   | GitHub Pages (`https://dhsig86.github.io/OTTO-VOICE/`) |
| Serverless  | Vercel Serverless Functions (`/api/tts`) |
| TTS Premium | ElevenLabs API v1 (`eleven_multilingual_v2`) |

---

## Segurança & Auth

- **Firebase Auth: ✅ presente** — o endpoint `/api/tts` exige `Authorization: Bearer <firebase_token>`
- Usa `firebase-admin` no serverless (`api/tts.js`) para `auth.verify_id_token()`
- Requests sem token ou com token inválido recebem `401 Unauthorized`
- O endpoint serverless protege a chave ElevenLabs no servidor; a API key NUNCA é enviada ao client
- Sem CORS configurado explicitamente (Vercel Serverless padrão same-origin)
- Sem dados de paciente persistidos — apenas `localStorage` para preferências do usuário

---

## Variáveis de Ambiente

| Variável            | Onde             | Descrição                                  |
|---------------------|------------------|--------------------------------------------|
| `ELEVENLABS_API_KEY` | Vercel (server) | Chave da API ElevenLabs para TTS premium   |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Vercel (server) | JSON inline do service account Firebase para verificação de tokens |

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
1. Client envia texto + voiceId opcional
2. Serverless valida texto e presença de `ELEVENLABS_API_KEY`
3. Faz request server-to-server para `api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream`
4. Retorna stream de áudio MP3 para o client
5. Client cria `Audio()` com blob URL e reproduz

### Fallback Automático:
Se o premium falhar (offline, timeout 8s, quota 429, auth 401), o `usePremiumTTS` aciona Web Speech API transparentemente com banner visual para o usuário.

---

## Arquitetura de Pastas

```
OTTO VOICE/
├── api/
│   └── tts.js                  # Vercel Serverless — proxy ElevenLabs
├── src/
│   ├── App.jsx                 # App principal — orquestra tudo
│   ├── main.jsx                # Entry point React
│   ├── index.css               # Estilos globais (CSS puro, tema claro/escuro)
│   ├── components/
│   │   ├── EmotionWheel.jsx    # Roleta de 9 emoções com scroll snap horizontal
│   │   ├── ManualControls.jsx  # Sliders manuais (pitch/rate/volume)
│   │   ├── PlayerControls.jsx  # Botões play/pause/stop
│   │   ├── QuickPhrases.jsx    # Frases rápidas clínicas (saudações + necessidades)
│   │   ├── Recorder.jsx        # Gravador de voz do navegador
│   │   └── SetupScreen.jsx     # Wizard inicial (gênero, estilo, idioma)
│   ├── hooks/
│   │   ├── useEmotionEngine.js # Motor de emoções — mapa de 9 emoções × 3 intensidades × 3 estilos
│   │   ├── usePhrases.js       # CRUD de frases favoritas (localStorage)
│   │   ├── usePremiumTTS.js    # Motor ElevenLabs com fallback automático para Web Speech
│   │   ├── useRecorder.js      # MediaRecorder API
│   │   ├── useSettings.js      # Persistência de configurações (localStorage)
│   │   └── useTTS.js           # Motor Web Speech API (detecção de vozes PT-BR, gênero, qualidade)
│   └── tests/
│       ├── audit-runner.mjs
│       ├── auditoria.clinica.test.js
│       ├── setup.js
│       ├── useEmotionEngine.test.js
│       ├── usePhrases.test.js
│       └── useSettings.test.js
├── package.json
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

### Modificadores de Texto
- Estilo formal/narrativo: pausa `...` entre sentenças
- Tristeza/angústia/dor: pausas respiratórias longas
- Dúvida: adição de `?` final se ausente

---

## Hooks Principais

### `useTTS()` — Motor Web Speech
- Carrega vozes assincronamente do navegador
- Filtra por idioma PT-BR, fallback para todas as vozes
- Detecta gênero via heurística de nomes (MALE_NAMES / FEMALE_NAMES)
- Marca vozes "premium" (natural/neural/online)
- **Workaround Android Chrome GC Bug:** `window._ottoUtterance = utterance`
- **Workaround Safari/Chrome Mobile:** `speechSynthesis.resume()` antes do `speak()`

### `usePremiumTTS()` — Motor ElevenLabs + Fallback
- Timeout de 8s (AbortSignal.timeout)
- Detecção de: offline (navigator.onLine), quota (429), auth (401), timeout, network
- Fallback transparente para Web Speech com banner visual
- Audio via blob URL + `new Audio()`

### `useSettings()` — Persistência
- `localStorage` key: `ottovox_settings`
- Persiste: gênero, idioma, estilo, intensidade, modo manual, pitch/rate/volume, usePremiumVoice, customVoiceId

### `usePhrases()` — Frases Rápidas
- 18 frases pré-definidas em 2 categorias: Saudações (10) e Necessidades Clínicas (8)
- Frases favoritas do usuário (CRUD em localStorage, key: `ottovox_phrases`)

---

## Quick Phrases — Frases Clínicas Pré-definidas

**Saudações:** Oi!, Bom dia!, Boa tarde!, Boa noite!, Estou bem e você?, Obrigado!, Por favor, Com licença, Sim, Não

**Necessidades Clínicas:** Preciso de ajuda, Chame o médico, Tenho dor, Estou com falta de ar, Preciso de água, Aguarde um momento, Não estou bem hoje, Pode repetir por favor?

---

## Testes (Vitest)

- **29/30 testes passando** (último dado disponível)
- Cobertura: hooks `useEmotionEngine`, `usePhrases`, `useSettings`
- Auditoria clínica integrada (`auditoria.clinica.test.js`)

---

## Deploy

| Ambiente   | Plataforma     | URL                                           |
|------------|----------------|-----------------------------------------------|
| Frontend   | GitHub Pages   | `https://dhsig86.github.io/OTTO-VOICE/`       |
| Serverless | Vercel         | mesma origin (precisa Vercel para `/api/tts`)  |

> ⚠️ **Atenção:** O deploy em GitHub Pages **não suporta** Vercel Serverless Functions. Para usar o motor premium ElevenLabs, é necessário deploy completo na Vercel ou configurar o proxy `/api/tts` em outra plataforma.

---

## postMessage API

**NÃO implementada.** Este módulo não está integrado ao PWA Shell via iframe. Opera como aplicação standalone.

---

## Pontos de Atenção

1. **Deploy split:** Frontend em GitHub Pages, mas serverless precisa de Vercel — pode causar CORS se origins divergirem
2. ~~**Sem Firebase Auth**~~ — ✅ **Resolvido**: `/api/tts` agora exige Firebase Auth Bearer token
3. **ElevenLabs quota:** Sem rate limiting no proxy — um abuso pode consumir toda a quota
4. **Web Speech varia por dispositivo:** Vozes PT-BR podem não existir em todos os dispositivos Android
5. **JSX sem TypeScript:** Único módulo clínico sem tipagem estática
