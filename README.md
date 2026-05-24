# OTTO VOX — Síntese Vocal Emocional para Reabilitação ORL

<div align="center">

**Motor de voz artificial com emoção para pacientes com comprometimento vocal**

*Plataforma OTTO · Otorrinolaringologia · Dr. Dario Hart Signorini*

</div>

---

## 🎯 Proposta Clínica

O **OTTO VOX** é uma ferramenta de comunicação assistiva projetada para pacientes que perderam ou tiveram comprometimento significativo da voz, incluindo:

- **Laringectomizados** (totais ou parciais)
- **Pacientes em recuperação** de cirurgias laríngeas ou de vias aéreas
- **Pacientes com paralisia de pregas vocais**
- **Pacientes traqueostomizados** com limitação vocal temporária

### Por que emoção na voz artificial?

A comunicação humana não se resume a palavras — a prosódia emocional (tom, velocidade, volume) é essencial para transmitir intenção e afeto. Pacientes que dependem de sintetizadores de voz frequentemente relatam frustração pela "voz robótica" que não consegue expressar sentimentos como dor, urgência ou alegria.

O OTTO VOX resolve isso com um **Motor de Emoções** que ajusta pitch, rate e volume de acordo com 9 estados emocionais em 3 níveis de intensidade, trazendo naturalidade à comunicação assistida.

---

## ✨ Recursos Principais

### 🎡 Roleta de Emoções (Modo Automático)
- **9 emoções mapeadas:** Neutro, Alegria, Felicidade, Tristeza, Ansiedade, Dúvida, Irritação, Dor, Angústia
- **3 níveis de intensidade:** Suave, Moderada, Intensa
- **3 estilos de fala:** Casual, Formal, Narrativo
- Roleta horizontal com scroll snap e botão "Sortear"

### 🎛️ Controle Manual (Modo Especialista)
- Ajuste livre de **Pitch** (0.5–2.0), **Rate** (0.5–2.5) e **Volume**
- Ideal para fonoaudiólogos e médicos personalizarem a voz do paciente

### 🗣️ Dois Motores de Voz
| Motor | Qualidade | Custo | Offline |
|-------|-----------|-------|---------|
| **Web Speech API** | Boa (varia por dispositivo) | Gratuito | ✅ Sim |
| **ElevenLabs Premium** | Hiper-realista (neural) | Pago | ❌ Não |

- Troca entre motores com um clique na tela principal
- Fallback automático: se o Premium falhar (sem internet, timeout, quota), usa Web Speech transparentemente

### ⚡ Frases Rápidas Clínicas
Frases pré-configuradas para comunicação imediata no ambiente hospitalar:

- **Saudações:** "Bom dia!", "Obrigado!", "Sim", "Não"
- **Necessidades Clínicas:** "Preciso de ajuda", "Chame o médico", "Tenho dor", "Estou com falta de ar", "Preciso de água"
- **Favoritas personalizadas:** o paciente salva suas próprias frases frequentes

### 🎤 Gravador de Voz
- Gravação de áudio do navegador para referência clínica

### 💾 Persistência Local
- Todas as configurações (emoção, intensidade, modo, motor de voz) são salvas automaticamente no dispositivo
- Ao reabrir, o app restaura as preferências exatas do paciente

### 🌙 Tema Claro/Escuro
- Conforto visual para uso em ambientes hospitalares com iluminação variada

---

## 🏥 Cenários de Uso Clínico

1. **Pós-operatório imediato de laringectomia:** paciente usa frases rápidas para comunicar necessidades básicas à equipe
2. **Reabilitação fonoaudiológica:** terapeuta usa o modo manual para demonstrar diferentes prosódias ao paciente
3. **Comunicação no dia a dia:** paciente digita texto livre e ouve a fala com emoção adequada ao contexto
4. **Teleconsulta:** paciente usa o VOX durante consulta virtual quando a voz natural está comprometida

---

## 🚀 Instalação e Deploy

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Desenvolvimento Local

```bash
# Clonar repositório
git clone https://github.com/dhsig86/OTTO-VOICE.git
cd OTTO-VOICE

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
# → Acesse http://localhost:5173
```

### Configurar Voz Premium (opcional)

Para ativar a voz ElevenLabs Premium, é necessário deploy na Vercel:

1. Faça deploy do projeto na **Vercel** (o diretório `api/` será automaticamente detectado)
2. Configure a variável de ambiente:
   ```
   ELEVENLABS_API_KEY=sk_sua_chave_aqui
   ```
3. O botão "Premium" na interface se torna funcional

### Build de Produção

```bash
npm run build     # Gera pasta dist/
npm run preview   # Preview local da build
```

### Deploy GitHub Pages

```bash
npm run deploy    # Build + publica em gh-pages
```

> **Nota:** O deploy em GitHub Pages funciona apenas com Web Speech API. Para ElevenLabs Premium, use Vercel.

---

## 📋 Estrutura do Projeto

```
OTTO VOICE/
├── api/tts.js              # Proxy serverless ElevenLabs (Vercel)
├── src/
│   ├── App.jsx             # Orquestrador principal
│   ├── components/         # EmotionWheel, QuickPhrases, PlayerControls, etc.
│   └── hooks/              # useEmotionEngine, useTTS, usePremiumTTS, etc.
├── package.json
└── vite.config.js
```

---

## ⚠️ Notas Importantes

- Este módulo **não requer autenticação Firebase** — pode ser usado de forma independente
- **Não há persistência de dados em servidor** — tudo fica no `localStorage` do dispositivo do paciente
- A qualidade da Web Speech API **varia significativamente** entre dispositivos (Chrome Desktop tem vozes excelentes, alguns Android podem ter vozes limitadas)
- O volume máximo do ElevenLabs está limitado a parâmetros seguros para proteção auditiva

---

## 📚 Referências Científicas

- **TTS e reabilitação de laringectomizados:** Brown et al., "Quality of Life After Total Laryngectomy", *Head & Neck*, 2003
- **Prosódia emocional e comunicação:** Scherer, K.R., "Vocal communication of emotion", *Speech Communication*, 2003
- **Web Speech API:** [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- **ElevenLabs Multilingual v2:** [ElevenLabs Docs](https://elevenlabs.io/docs)

---

<div align="center">

*OTTO VOX — Devolvendo emoção à voz de quem precisa*

**Parte do ecossistema OTTO** · Clínica ORL Digital · Dr. Dario Hart Signorini

</div>
