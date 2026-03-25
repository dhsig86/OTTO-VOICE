export const EMOTIONS = {
  neutro: {
    label: 'Neutro',
    pitch: 1.0, rate: 1.0, volume: 1.0,
    color: '#a0b4b2'
  },
  alegria: {
    label: 'Alegria',
    pitch: 1.25, rate: 1.1, volume: 1.0,
    color: '#f1c40f'
  },
  felicidade: {
    label: 'Felicidade',
    pitch: 1.3, rate: 1.12, volume: 1.0,
    color: '#2ecc71'
  },
  tristeza: {
    // Antes: pitch 0.6 / rate 0.75 — ficava mecânico demais
    // Agora: valores mais suaves e naturais
    label: 'Tristeza',
    pitch: 0.82, rate: 0.85, volume: 0.85,
    color: '#5dade2'
  },
  ansiedade: {
    label: 'Ansiedade',
    pitch: 1.1, rate: 1.35, volume: 0.95,
    color: '#9b59b6'
  },
  duvida: {
    label: 'Dúvida',
    pitch: 1.2, rate: 0.92, volume: 1.0,
    color: '#e67e22'
  },
  irritacao: {
    label: 'Irritação',
    pitch: 0.85, rate: 1.18, volume: 1.0,
    color: '#e74c3c'
  },
  dor: {
    label: 'Dor',
    pitch: 0.78, rate: 0.78, volume: 0.9,
    color: '#c0392b'
  },
  angustia: {
    // Antes: pitch 0.9 / rate 0.8 com "..." entre cada palavra — fragmentava demais
    // Agora: tom um pouco mais grave, lento mas fluente
    label: 'Angústia',
    pitch: 0.88, rate: 0.78, volume: 0.88,
    color: '#7f8c8d'
  }
};

export function useEmotionEngine() {
  const getEmotionSettings = (emotionKey) => {
    return EMOTIONS[emotionKey] || EMOTIONS.neutro;
  };

  const getRandomEmotion = () => {
    const keys = Object.keys(EMOTIONS).filter(k => k !== 'neutro');
    return keys[Math.floor(Math.random() * keys.length)];
  };

  /**
   * Modificadores de texto — usados para simular pausas orgânicas.
   * ATENÇÃO: Evitar exagero (ex: "..." entre cada palavra fragmenta a fala).
   * Usar apenas pontuação natural ao final ou em posições estratégicas.
   */
  const applyTextModifiers = (text, emotionKey) => {
    if (!text || !text.trim()) return text;

    switch (emotionKey) {
      case 'tristeza':
        // Adiciona vírgula após frases para dar respiro melancólico
        return text.replace(/([.!?])\s*/g, '$1... ').trim();

      case 'angustia':
        // Leve pausa entre sentenças, sem fragmentar palavras
        return text.replace(/([.!?])\s*/g, '$1, ').trim();

      case 'dor':
        // Pausa após sentenças (voz exausta)
        return text.replace(/([.!?])\s*/g, '$1... ').trim();

      case 'duvida':
        // Sobe ao final da frase como uma interrogação
        if (!text.trim().endsWith('?') && !text.trim().endsWith('...')) {
          return text.trim() + '?';
        }
        return text;

      case 'ansiedade':
        // Sem modificações de texto — a velocidade já transmite a sensação
        return text;

      default:
        return text;
    }
  };

  return { EMOTIONS, getEmotionSettings, getRandomEmotion, applyTextModifiers };
}
