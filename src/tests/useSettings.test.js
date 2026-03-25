import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useSettings, DEFAULT_SETTINGS } from '../hooks/useSettings';

describe('useSettings', () => {
  const KEY = 'ottovox_settings';

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  const { load, save, reset } = useSettings();

  describe('load()', () => {
    it('deve retornar DEFAULT_SETTINGS quando localStorage está vazio', () => {
      const result = load();
      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it('deve retornar valores salvos corretamente', () => {
      localStorage.setItem(KEY, JSON.stringify({ gender: 'male', style: 'formal' }));
      const result = load();
      expect(result.gender).toBe('male');
      expect(result.style).toBe('formal');
    });

    it('deve fazer merge com DEFAULT_SETTINGS para campos faltantes', () => {
      localStorage.setItem(KEY, JSON.stringify({ gender: 'male' }));
      const result = load();
      // Campo não salvo deve vir do default
      expect(result.intensity).toBe(DEFAULT_SETTINGS.intensity);
    });

    it('deve retornar DEFAULT_SETTINGS em caso de JSON corrompido', () => {
      localStorage.setItem(KEY, '{INVALIDO}');
      const result = load();
      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('save()', () => {
    it('deve persistir as configurações no localStorage', () => {
      save({ gender: 'female', style: 'narrativo', setupDone: true });
      const raw = JSON.parse(localStorage.getItem(KEY));
      expect(raw.gender).toBe('female');
      expect(raw.style).toBe('narrativo');
      expect(raw.setupDone).toBe(true);
    });

    it('deve fazer merge preservando dados previamente salvos', () => {
      save({ gender: 'male' });
      save({ style: 'formal' }); // segunda chamada
      const raw = JSON.parse(localStorage.getItem(KEY));
      expect(raw.gender).toBe('male');  // preservado
      expect(raw.style).toBe('formal'); // novo
    });

    it('deve aceitar todos os campos válidos sem erros', () => {
      expect(() => {
        save({ gender: 'all', lang: 'pt', style: 'casual', intensity: 'intensa', setupDone: true });
      }).not.toThrow();
    });
  });

  describe('reset()', () => {
    it('deve apagar os dados do localStorage', () => {
      save({ gender: 'male', setupDone: true });
      reset();
      expect(localStorage.getItem(KEY)).toBeNull();
    });

    it('após reset, load() deve retornar DEFAULT_SETTINGS', () => {
      save({ gender: 'male', setupDone: true });
      reset();
      const result = load();
      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('setupDone flag', () => {
    it('deve ser false por padrão (novo usuário)', () => {
      expect(load().setupDone).toBe(false);
    });

    it('deve ser true após completar o Setup', () => {
      save({ setupDone: true });
      expect(load().setupDone).toBe(true);
    });
  });
});
