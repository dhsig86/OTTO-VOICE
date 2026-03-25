import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePhrases, PRESET_PHRASES } from '../hooks/usePhrases';

describe('usePhrases', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  const { load, addPhrase, removePhrase } = usePhrases();

  // ── PRESET_PHRASES ─────────────────────────────────────────────────────────

  describe('PRESET_PHRASES', () => {
    it('deve conter as categorias "saudacoes" e "clinicas"', () => {
      expect(PRESET_PHRASES).toHaveProperty('saudacoes');
      expect(PRESET_PHRASES).toHaveProperty('clinicas');
    });

    it('saudações deve conter ao menos 8 frases', () => {
      expect(PRESET_PHRASES.saudacoes.phrases.length).toBeGreaterThanOrEqual(8);
    });

    it('frases clínicas devem cobrir necessidades críticas', () => {
      const textos = PRESET_PHRASES.clinicas.phrases.map(p => p.text);
      const criticals = ['Preciso de ajuda', 'Chame o médico', 'Tenho dor'];
      for (const c of criticals) {
        expect(textos.some(t => t.includes(c.split(' ')[0])), `Frase crítica ausente: ${c}`).toBe(true);
      }
    });

    it('todos os presets devem ter id único', () => {
      const allIds = [
        ...PRESET_PHRASES.saudacoes.phrases.map(p => p.id),
        ...PRESET_PHRASES.clinicas.phrases.map(p => p.id),
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  // ── load() ─────────────────────────────────────────────────────────────────

  describe('load()', () => {
    it('deve retornar array vazio quando não há favoritas salvas', () => {
      expect(load()).toEqual([]);
    });

    it('deve retornar as frases salvas corretamente', () => {
      localStorage.setItem('ottovox_phrases', JSON.stringify([{ id: 'f1', text: 'Teste' }]));
      const result = load();
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Teste');
    });
  });

  // ── addPhrase() ────────────────────────────────────────────────────────────

  describe('addPhrase()', () => {
    it('deve adicionar uma nova frase e retorná-la', () => {
      const phrase = addPhrase('Boa tarde!');
      expect(phrase).toHaveProperty('id');
      expect(phrase.text).toBe('Boa tarde!');
    });

    it('deve persistir a frase no localStorage', () => {
      addPhrase('Preciso de água.');
      const stored = load();
      expect(stored.some(p => p.text === 'Preciso de água.')).toBe(true);
    });

    it('deve fazer trim do texto antes de salvar', () => {
      const phrase = addPhrase('  Olá!  ');
      expect(phrase.text).toBe('Olá!');
    });

    it('deve acumular múltiplas frases', () => {
      addPhrase('Frase 1');
      addPhrase('Frase 2');
      addPhrase('Frase 3');
      expect(load()).toHaveLength(3);
    });

    it('cada frase deve ter id único gerado via timestamp', () => {
      const p1 = addPhrase('A');
      const p2 = addPhrase('B');
      expect(p1.id).not.toBe(p2.id);
    });
  });

  // ── removePhrase() ─────────────────────────────────────────────────────────

  describe('removePhrase()', () => {
    it('deve remover a frase pelo id e retornar array atualizado', () => {
      const added = addPhrase('Frase para remover');
      const updated = removePhrase(added.id);
      expect(updated.some(p => p.id === added.id)).toBe(false);
    });

    it('não deve remover frases com id diferente', () => {
      addPhrase('Manter esta');
      const toRemove = addPhrase('Remover esta');
      removePhrase(toRemove.id);
      const remaining = load();
      expect(remaining.some(p => p.text === 'Manter esta')).toBe(true);
    });

    it('remover id inexistente não deve lançar erro', () => {
      addPhrase('Segura');
      expect(() => removePhrase('id_que_nao_existe')).not.toThrow();
    });
  });
});
