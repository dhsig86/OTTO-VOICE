const STORAGE_KEY = 'ottovox_settings';

export const DEFAULT_SETTINGS = {
  gender: 'female',
  lang: 'pt',
  style: 'casual',
  intensity: 'moderada',
  setupDone: false,
  isDark: false,
  selectedEmotion: 'neutro',
  isManualMode: false,
  manualPitch: 1.0,
  manualRate: 1.0,
  manualVolume: 1.0,
  usePremiumVoice: false,
  customVoiceId: '',
};

export function useSettings() {
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  };

  const save = (settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...load(), ...settings }));
    } catch (e) {
      console.warn('OTTO VOX: não foi possível salvar configurações.', e);
    }
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { load, save, reset };
}
