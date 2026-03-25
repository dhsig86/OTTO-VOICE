import { describe, it, expect, beforeEach } from 'vitest';
import { useEmotionEngine } from '../hooks/useEmotionEngine';

describe('useEmotionEngine', () => {
  const { EMOTIONS, BASE_EMOTIONS, getEmotionSettings, getRandomEmotion, applyTextModifiers } = useEmotionEngine();

  // ── EMOTIONS map ──────────────────────────────────────────────────────────

  describe('EMOTIONS map', () => {
    it('deve conter exatamente 9 emoções', () => {
      expect(Object.keys(EMOTIONS)).toHaveLength(9);
    });

    it('todas as emoções devem ter label, emoji, pitch, rate, volume e color', () => {
      for (const [key, emote] of Object.entries(EMOTIONS)) {
        expect(emote, `Emoção "${key}" sem label`).toHaveProperty('label');
        expect(emote, `Emoção "${key}" sem emoji`).toHaveProperty('emoji');
        expect(emote, `Emoção "${key}" sem color`).toHaveProperty('color');
        expect(typeof emote.pitch, `Emoção "${key}" pitch inválido`).toBe('number');
        expect(typeof emote.rate,  `Emoção "${key}" rate inválido`).toBe('number');
        expect(typeof emote.volume,`Emoção "${key}" volume inválido`).toBe('number');
      }
    });

    it('emoção neutro deve ter pitch e rate exatamente 1.0', () => {
      const { pitch, rate } = EMOTIONS.neutro;
      expect(pitch).toBe(1.0);
      expect(rate).toBe(1.0);
    });
  });

  // ── getEmotionSettings ────────────────────────────────────────────────────

  describe('getEmotionSettings', () => {
    it('deve retornar valores neutros quando emoção é "neutro"', () => {
      const result = getEmotionSettings('neutro', 'moderada', 'casual');
      expect(result.pitch).toBe(1.0);
      expect(result.rate).toBe(1.0);
      expect(result.volume).toBe(1.0);
    });

    it('intensidade "suave" deve produzir menor desvio que "intensa"', () => {
      const suave   = getEmotionSettings('alegria', 'suave',   'casual');
      const intensa = getEmotionSettings('alegria', 'intensa', 'casual');
      expect(suave.pitch).toBeLessThan(intensa.pitch);
      expect(suave.rate).toBeLessThan(intensa.rate);
    });

    it('pitch deve estar sempre dentro do intervalo [0.5, 2.0]', () => {
      for (const emotionKey of Object.keys(BASE_EMOTIONS)) {
        for (const intensity of ['suave', 'moderada', 'intensa']) {
          const { pitch } = getEmotionSettings(emotionKey, intensity, 'casual');
          expect(pitch, `pitch out of range para ${emotionKey}/${intensity}`).toBeGreaterThanOrEqual(0.5);
          expect(pitch, `pitch out of range para ${emotionKey}/${intensity}`).toBeLessThanOrEqual(2.0);
        }
      }
    });

    it('rate deve estar sempre dentro do intervalo [0.5, 2.5]', () => {
      for (const emotionKey of Object.keys(BASE_EMOTIONS)) {
        for (const intensity of ['suave', 'moderada', 'intensa']) {
          const { rate } = getEmotionSettings(emotionKey, intensity, 'casual');
          expect(rate, `rate out of range para ${emotionKey}/${intensity}`).toBeGreaterThanOrEqual(0.5);
          expect(rate, `rate out of range para ${emotionKey}/${intensity}`).toBeLessThanOrEqual(2.5);
        }
      }
    });

    it('emoção desconhecida deve retornar valores neutros (fallback seguro)', () => {
      const result = getEmotionSettings('xyz_invalida', 'moderada', 'casual');
      expect(result.pitch).toBe(1.0);
      expect(result.rate).toBe(1.0);
    });

    it('estilo "formal" deve produzir rate menor que "casual"', () => {
      const formal = getEmotionSettings('neutro', 'moderada', 'formal');
      const casual = getEmotionSettings('neutro', 'moderada', 'casual');
      expect(formal.rate).toBeLessThan(casual.rate);
    });

    it('tristeza deve ter pitch < 1.0 (tom mais grave)', () => {
      const { pitch } = getEmotionSettings('tristeza', 'moderada', 'casual');
      expect(pitch).toBeLessThan(1.0);
    });

    it('alegria deve ter pitch > 1.0 (tom mais agudo)', () => {
      const { pitch } = getEmotionSettings('alegria', 'moderada', 'casual');
      expect(pitch).toBeGreaterThan(1.0);
    });

    it('ansiedade deve ter rate > 1.0 (mais rápido)', () => {
      const { rate } = getEmotionSettings('ansiedade', 'moderada', 'casual');
      expect(rate).toBeGreaterThan(1.0);
    });
  });

  // ── getRandomEmotion ──────────────────────────────────────────────────────

  describe('getRandomEmotion', () => {
    it('nunca deve retornar "neutro"', () => {
      for (let i = 0; i < 50; i++) {
        expect(getRandomEmotion()).not.toBe('neutro');
      }
    });

    it('deve retornar sempre uma chave válida de emoção', () => {
      const validKeys = Object.keys(BASE_EMOTIONS);
      for (let i = 0; i < 50; i++) {
        expect(validKeys).toContain(getRandomEmotion());
      }
    });
  });

  // ── applyTextModifiers ────────────────────────────────────────────────────

  describe('applyTextModifiers', () => {
    it('deve retornar string vazia inalterada', () => {
      expect(applyTextModifiers('', 'alegria')).toBe('');
    });

    it('não deve modificar texto para emoção "alegria"', () => {
      const text = 'Estou muito feliz.';
      expect(applyTextModifiers(text, 'alegria', 'casual')).toBe(text);
    });

    it('deve adicionar "?" ao final para dúvida (quando não há pontuação final)', () => {
      const result = applyTextModifiers('Você tem certeza', 'duvida', 'casual');
      expect(result.endsWith('?')).toBe(true);
    });

    it('não deve duplicar "?" se texto já termina em "?"', () => {
      const result = applyTextModifiers('Você tem certeza?', 'duvida', 'casual');
      const trimmed = result.trim();
      expect(trimmed[trimmed.length - 1]).toBe('?');
      // Não deve ter "??" no final
      expect(trimmed.endsWith('??')).toBe(false);
    });

    it('não deve fragmentar palavras (nenhum "..." entre cada palavra)', () => {
      const text = 'Tenho muita dor hoje.';
      const modified = applyTextModifiers(text, 'dor', 'casual');
      // Garantir que não há "... " entre palavras simples
      expect(modified).not.toMatch(/\w\.\.\. \w/);
    });
  });
});
