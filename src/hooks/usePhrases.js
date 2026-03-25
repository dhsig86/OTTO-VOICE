const STORAGE_KEY = 'ottovox_phrases';

// Frases pré-carregadas — divididas em categorias clínicas
export const PRESET_PHRASES = {
  saudacoes: {
    label: 'Saudações',
    icon: '👋',
    phrases: [
      { id: 'p1', text: 'Oi!' },
      { id: 'p2', text: 'Bom dia!' },
      { id: 'p3', text: 'Boa tarde!' },
      { id: 'p4', text: 'Boa noite!' },
      { id: 'p5', text: 'Estou bem, e você?' },
      { id: 'p6', text: 'Obrigado!' },
      { id: 'p7', text: 'Por favor.' },
      { id: 'p8', text: 'Com licença.' },
      { id: 'p9', text: 'Sim.' },
      { id: 'p10', text: 'Não.' },
    ],
  },
  clinicas: {
    label: 'Necessidades',
    icon: '🏥',
    phrases: [
      { id: 'c1', text: 'Preciso de ajuda.' },
      { id: 'c2', text: 'Chame o médico.' },
      { id: 'c3', text: 'Tenho dor.' },
      { id: 'c4', text: 'Estou com falta de ar.' },
      { id: 'c5', text: 'Preciso de água.' },
      { id: 'c6', text: 'Aguarde um momento.' },
      { id: 'c7', text: 'Não estou bem hoje.' },
      { id: 'c8', text: 'Pode repetir, por favor?' },
    ],
  },
};

export function usePhrases() {
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const save = (phrases) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phrases));
  };

  const addPhrase = (text) => {
    const current = load();
    const newPhrase = {
      id: `fav_${Date.now()}`,
      text: text.trim(),
    };
    save([...current, newPhrase]);
    return newPhrase;
  };

  const removePhrase = (id) => {
    const updated = load().filter(p => p.id !== id);
    save(updated);
    return updated;
  };

  return { load, addPhrase, removePhrase, PRESET_PHRASES };
}
