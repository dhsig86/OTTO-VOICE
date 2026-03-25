import { describe, it, expect, beforeEach } from 'vitest';
import { useEmotionEngine } from '../hooks/useEmotionEngine';
import { useSettings, DEFAULT_SETTINGS } from '../hooks/useSettings';
import { usePhrases, PRESET_PHRASES } from '../hooks/usePhrases';

/**
 * AUDITORIA DE SEGURANÇA CLÍNICA
 * Garante que o app OTTO VOX é seguro para pacientes laringectomizados.
 * Estas checagens são de natureza diferente dos testes unitários —
 * são verificações de contrato e safety que nunca devem ser quebradas.
 */
describe('[AUDITORIA CLINICA] Contratos de Segurança', () => {
  const { getEmotionSettings, applyTextModifiers } = useEmotionEngine();

  // ── 1. Segurança de Síntese de Voz ─────────────────────────────────────────

  describe('Síntese de Voz — Valores de Segurança', () => {
    it('[CRITICO] pitch nunca deve sair de [0.5, 2.0] para nenhuma combinação possível', () => {
      const emotions = ['neutro','alegria','felicidade','tristeza','ansiedade','duvida','irritacao','dor','angustia'];
      const intensities = ['suave','moderada','intensa'];
      const styles = ['formal','casual','narrativo'];
      for (const e of emotions) {
        for (const i of intensities) {
          for (const s of styles) {
            const { pitch } = getEmotionSettings(e, i, s);
            expect(pitch, `[pitch OOB] e=${e} i=${i} s=${s}`).toBeGreaterThanOrEqual(0.5);
            expect(pitch, `[pitch OOB] e=${e} i=${i} s=${s}`).toBeLessThanOrEqual(2.0);
          }
        }
      }
    });

    it('[CRITICO] rate nunca deve sair de [0.5, 2.5] para nenhuma combinação possível', () => {
      const emotions = ['neutro','alegria','felicidade','tristeza','ansiedade','duvida','irritacao','dor','angustia'];
      const intensities = ['suave','moderada','intensa'];
      const styles = ['formal','casual','narrativo'];
      for (const e of emotions) {
        for (const i of intensities) {
          for (const s of styles) {
            const { rate } = getEmotionSettings(e, i, s);
            expect(rate, `[rate OOB] e=${e} i=${i} s=${s}`).toBeGreaterThanOrEqual(0.5);
            expect(rate, `[rate OOB] e=${e} i=${i} s=${s}`).toBeLessThanOrEqual(2.5);
          }
        }
      }
    });

    it('[CRITICO] volume deve estar sempre em [0, 1]', () => {
      const emotions = ['neutro','alegria','felicidade','tristeza','ansiedade','duvida','irritacao','dor','angustia'];
      for (const e of emotions) {
        const { volume } = getEmotionSettings(e, 'intensa', 'narrativo');
        expect(volume, `[volume OOB] e=${e}`).toBeGreaterThanOrEqual(0);
        expect(volume, `[volume OOB] e=${e}`).toBeLessThanOrEqual(1);
      }
    });

    it('[CRITICO] texto vazio nunca deve causar erro no modificador', () => {
      const emotions = ['neutro','alegria','tristeza','dor','ansiedade','duvida'];
      for (const e of emotions) {
        expect(() => applyTextModifiers('', e, 'casual')).not.toThrow();
        expect(() => applyTextModifiers(null, e, 'casual')).not.toThrow();
        expect(() => applyTextModifiers(undefined, e, 'casual')).not.toThrow();
      }
    });
  });

  // ── 2. Segurança de Configurações ──────────────────────────────────────────

  describe('Configurações — Persistência e Defaults', () => {
    beforeEach(() => localStorage.clear());

    it('[CRITICO] app deve sempre ter fallback para DEFAULT_SETTINGS (nunca undefined)', () => {
      const { load } = useSettings();
      const result = load();
      expect(result).toBeDefined();
      expect(result.gender).toBeDefined();
      expect(result.style).toBeDefined();
      expect(result.intensity).toBeDefined();
    });

    it('[CRITICO] setupDone=false deve ser o padrão para novo usuário', () => {
      const { load } = useSettings();
      expect(load().setupDone).toBe(false);
    });
  });

  // ── 3. Frases Clínicas Críticas ─────────────────────────────────────────────

  describe('Frases Clínicas — Presença Obrigatória', () => {
    const all = [
      ...PRESET_PHRASES.saudacoes.phrases,
      ...PRESET_PHRASES.clinicas.phrases,
    ].map(p => p.text.toLowerCase());

    const required = [
      { frase: 'preciso de ajuda', razao: 'Emergência comunicativa básica' },
      { frase: 'médico', razao: 'Acesso ao cuidado de saúde' },
      { frase: 'dor', razao: 'Relato de dor' },
      { frase: 'água', razao: 'Necessidade fisiológica básica' },
      { frase: 'sim', razao: 'Resposta afirmativa mínima' },
      { frase: 'não', razao: 'Resposta negativa mínima' },
    ];

    for (const { frase, razao } of required) {
      it(`[CLINICO] deve conter frase com "${frase}" — ${razao}`, () => {
        expect(all.some(t => t.includes(frase))).toBe(true);
      });
    }
  });

  // ── 4. Acessibilidade Mínima ────────────────────────────────────────────────

  describe('Acessibilidade — Contratos de UI', () => {
    it('[A11Y] todos os presets de frases devem ter id único', () => {
      const ids = [
        ...PRESET_PHRASES.saudacoes.phrases.map(p => p.id),
        ...PRESET_PHRASES.clinicas.phrases.map(p => p.id),
      ];
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('[A11Y] nenhuma frase pré-definida deve ser string vazia', () => {
      const all = [
        ...PRESET_PHRASES.saudacoes.phrases,
        ...PRESET_PHRASES.clinicas.phrases,
      ];
      for (const p of all) {
        expect(p.text.trim().length, `Frase vazia com id: ${p.id}`).toBeGreaterThan(0);
      }
    });
  });
});
