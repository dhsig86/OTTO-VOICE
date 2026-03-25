export const EMOTIONS = {
  neutro: { label: 'Neutro', pitch: 1.0, rate: 1.0, color: '#e6edf3' },
  alegria: { label: 'Alegria', pitch: 1.2, rate: 1.1, color: '#f1c40f' },
  felicidade: { label: 'Felicidade', pitch: 1.3, rate: 1.15, color: '#2ecc71' },
  tristeza: { label: 'Tristeza', pitch: 0.6, rate: 0.75, color: '#3498db' },
  ansiedade: { label: 'Ansiedade', pitch: 1.1, rate: 1.3, color: '#9b59b6' },
  duvida: { label: 'Dúvida', pitch: 1.3, rate: 0.9, color: '#e67e22' },
  irritacao: { label: 'Irritação', pitch: 0.8, rate: 1.2, color: '#e74c3c' },
  dor: { label: 'Dor', pitch: 0.7, rate: 0.7, color: '#c0392b' },
  angustia: { label: 'Angústia', pitch: 0.9, rate: 0.8, color: '#34495e' }
};

export function useEmotionEngine() {
  const getEmotionSettings = (emotionKey) => {
    return EMOTIONS[emotionKey] || EMOTIONS.neutro;
  };

  const getRandomEmotion = () => {
    const keys = Object.keys(EMOTIONS).filter(k => k !== 'neutro');
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return randomKey;
  };

  // Pode-se aplicar transformações de texto no futuro, como adicionar pausas "..."
  const applyTextModifiers = (text, emotionKey) => {
    if (!text) return text;
    
    switch (emotionKey) {
      case 'ansiedade':
        // Substituir algumas vírgulas por pausas curtas visuais antes de falar
        // Na Web Speech, a vírgula já dá uma pausa
        return text;
      case 'angustia':
      case 'dor':
        // Adiciona "..." ou vírgulas extras para forçar a engine a falar mais pausado
        return text.split(' ').join('... '); 
      case 'duvida':
        if (!text.endsWith('?')) return text + '?';
        return text;
      default:
        return text;
    }
  };

  return { EMOTIONS, getEmotionSettings, getRandomEmotion, applyTextModifiers };
}
