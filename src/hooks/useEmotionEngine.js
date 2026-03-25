// ─── Mapeamento estático de emoções ──────────────────────────────────────────
// Cada emoção tem: label, desvio base de pitch e rate em relação ao neutro,
// volume, cor de UI e emoji.
// O "desvio" é multiplicado pelo fator de intensidade (suave=0.5, moderada=1, intensa=1.5)

const BASE_EMOTIONS = {
  neutro:     { label: 'Neutro',    emoji: '😐', pitchDelta:  0,    rateDelta:  0,    volume: 1.0,  color: '#a0b4b2' },
  alegria:    { label: 'Alegria',   emoji: '😄', pitchDelta:  0.25, rateDelta:  0.1,  volume: 1.0,  color: '#f1c40f' },
  felicidade: { label: 'Feliz',     emoji: '😊', pitchDelta:  0.3,  rateDelta:  0.12, volume: 1.0,  color: '#2ecc71' },
  tristeza:   { label: 'Tristeza',  emoji: '😢', pitchDelta: -0.18, rateDelta: -0.15, volume: 0.85, color: '#5dade2' },
  ansiedade:  { label: 'Ansiedade', emoji: '😰', pitchDelta:  0.1,  rateDelta:  0.35, volume: 0.95, color: '#9b59b6' },
  duvida:     { label: 'Dúvida',    emoji: '🤔', pitchDelta:  0.2,  rateDelta: -0.08, volume: 1.0,  color: '#e67e22' },
  irritacao:  { label: 'Irritação', emoji: '😠', pitchDelta: -0.15, rateDelta:  0.18, volume: 1.0,  color: '#e74c3c' },
  dor:        { label: 'Dor',       emoji: '😣', pitchDelta: -0.22, rateDelta: -0.22, volume: 0.9,  color: '#c0392b' },
  angustia:   { label: 'Angústia',  emoji: '😩', pitchDelta: -0.12, rateDelta: -0.22, volume: 0.88, color: '#7f8c8d' },
};

const INTENSITY_MULTIPLIER = { suave: 0.5, moderada: 1.0, intensa: 1.5 };

const STYLE_PRESETS = {
  formal:    { rateOffset: -0.08, textPauses: true },
  casual:    { rateOffset:  0,    textPauses: false },
  narrativo: { rateOffset: -0.05, textPauses: true },
};

// ─── Motor principal ─────────────────────────────────────────────────────────
export function useEmotionEngine() {
  // Constrói o mapa de emoções com pitch/rate absolutos (base=1.0)
  const buildEMOTIONS = () => {
    const result = {};
    for (const [key, e] of Object.entries(BASE_EMOTIONS)) {
      result[key] = {
        ...e,
        // pitch e rate absolutos para a intensidade moderada (padrão do motor)
        pitch: 1.0 + e.pitchDelta,
        rate:  1.0 + e.rateDelta,
      };
    }
    return result;
  };

  const EMOTIONS = buildEMOTIONS();

  /**
   * Retorna pitch, rate e volume finais aplicando intensidade e estilo.
   * @param {string} emotionKey
   * @param {string} intensity  'suave'|'moderada'|'intensa'
   * @param {string} style      'formal'|'casual'|'narrativo'
   */
  const getEmotionSettings = (emotionKey, intensity = 'moderada', style = 'casual') => {
    const base = BASE_EMOTIONS[emotionKey] || BASE_EMOTIONS.neutro;
    const mult = INTENSITY_MULTIPLIER[intensity] ?? 1.0;
    const preset = STYLE_PRESETS[style] ?? STYLE_PRESETS.casual;

    const pitch  = parseFloat(Math.min(Math.max(1.0 + base.pitchDelta * mult, 0.5), 2.0).toFixed(2));
    const rate   = parseFloat(Math.min(Math.max(1.0 + base.rateDelta  * mult + preset.rateOffset, 0.5), 2.5).toFixed(2));
    const volume = base.volume;

    return { pitch, rate, volume };
  };

  const getRandomEmotion = () => {
    const keys = Object.keys(BASE_EMOTIONS).filter(k => k !== 'neutro');
    return keys[Math.floor(Math.random() * keys.length)];
  };

  /**
   * Modificadores de texto: pausa orgânica entre sentenças, nunca entre palavras.
   */
  const applyTextModifiers = (text, emotionKey, style = 'casual') => {
    if (!text || !text.trim()) return text;
    const preset = STYLE_PRESETS[style] ?? STYLE_PRESETS.casual;

    let result = text;

    // Pausa estilística entre sentenças para estilo formal/narrativo
    if (preset.textPauses) {
      result = result.replace(/([.!])\s+/g, '$1... ');
    }

    switch (emotionKey) {
      case 'tristeza':
      case 'angustia':
      case 'dor':
        // Respiração lenta: pausa só no final de orações (ponto final)
        result = result.replace(/\.\s+/g, '... ');
        break;
      case 'duvida':
        if (!result.trim().endsWith('?') && !result.trim().endsWith('...')) {
          result = result.trim() + '?';
        }
        break;
      default:
        break;
    }

    return result;
  };

  return { EMOTIONS, BASE_EMOTIONS, getEmotionSettings, getRandomEmotion, applyTextModifiers };
}
