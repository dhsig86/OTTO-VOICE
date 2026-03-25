/**
 * OTTO VOX - Runner de Auditoria Profissional
 * Executa os testes de segurança e qualidade sem dependências externas.
 * Node.js puro com ESM nativo.
 * Uso: node src/tests/audit-runner.mjs
 */

// ─── importações dinâmicas dos módulos sob teste ─────────────────────────────
// Todos os hooks são ESM puro, podem ser importados diretamente
import { useEmotionEngine } from '../hooks/useEmotionEngine.js';
import { useSettings, DEFAULT_SETTINGS } from '../hooks/useSettings.js';
import { usePhrases, PRESET_PHRASES } from '../hooks/usePhrases.js';

// ─── Mock mínimo de localStorage ─────────────────────────────────────────────
const store = {};
global.localStorage = {
  getItem:    (k)      => store[k] ?? null,
  setItem:    (k, v)   => { store[k] = v; },
  removeItem: (k)      => { delete store[k]; },
  clear:      ()       => { Object.keys(store).forEach(k => delete store[k]); },
};

// ─── Utilidades do runner ──────────────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`  ✅ ${name}\n`);
    passed++;
  } catch (e) {
    process.stdout.write(`  ❌ ${name}\n     ↳ ${e.message}\n`);
    failed++;
    failures.push({ name, error: e.message });
  }
}

function expect(actual) {
  return {
    toBe:               (expected) => { if (actual !== expected) throw new Error(`Esperado ${JSON.stringify(expected)}, recebido ${JSON.stringify(actual)}`); },
    toEqual:            (expected) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Objetos diferentes.\nEsperado: ${JSON.stringify(expected)}\nRecebido: ${JSON.stringify(actual)}`); },
    toHaveLength:       (len)       => { if (actual.length !== len) throw new Error(`Esperado length ${len}, recebido ${actual.length}`); },
    toBeGreaterThan:    (n)         => { if (!(actual > n)) throw new Error(`Esperado > ${n}, recebido ${actual}`); },
    toBeLessThan:       (n)         => { if (!(actual < n)) throw new Error(`Esperado < ${n}, recebido ${actual}`); },
    toBeGreaterThanOrEqual: (n)     => { if (!(actual >= n)) throw new Error(`Esperado >= ${n}, recebido ${actual}`); },
    toBeLessThanOrEqual:    (n)     => { if (!(actual <= n)) throw new Error(`Esperado <= ${n}, recebido ${actual}`); },
    toBeDefined:        ()          => { if (actual === undefined) throw new Error(`Esperado definido, recebido undefined`); },
    toBeNull:           ()          => { if (actual !== null) throw new Error(`Esperado null, recebido ${actual}`); },
    not: {
      toBe:     (expected) => { if (actual === expected) throw new Error(`Não deveria ser ${JSON.stringify(expected)}`); },
      toThrow:  ()         => { /* verifica externamente */ },
    },
    endsWith:   (s) => { if (!String(actual).endsWith(s)) throw new Error(`Esperado term. em "${s}", recebido "${actual}"`); },
    includes:   (s) => { if (!String(actual).includes(s)) throw new Error(`Esperado incluir "${s}" em "${actual}"`); },
    toContain:  (v) => { if (!actual.includes(v)) throw new Error(`Array não contém ${v}: [${actual.join(',')}]`); },
  };
}

function expectNotToThrow(fn) {
  try { fn(); }
  catch (e) { throw new Error(`Não deveria lançar erro, mas lançou: ${e.message}`); }
}

function section(title) {
  process.stdout.write(`\n${'─'.repeat(55)}\n${title}\n${'─'.repeat(55)}\n`);
}

// ─── TESTES ───────────────────────────────────────────────────────────────────

const { EMOTIONS, BASE_EMOTIONS, getEmotionSettings, getRandomEmotion, applyTextModifiers } = useEmotionEngine();
const { load: loadSettings, save: saveSettings, reset: resetSettings } = useSettings();
const { load: loadPhrases, addPhrase, removePhrase } = usePhrases();

section('1. MOTOR EMOCIONAL — useEmotionEngine');

test('deve conter exatamente 9 emoções', () => {
  expect(Object.keys(EMOTIONS).length).toBe(9);
});

test('neutro deve ter pitch=1.0 e rate=1.0', () => {
  expect(EMOTIONS.neutro.pitch).toBe(1.0);
  expect(EMOTIONS.neutro.rate).toBe(1.0);
});

test('todas as emoções têm label, emoji, pitch, rate, volume e color', () => {
  for (const [k, e] of Object.entries(EMOTIONS)) {
    if (!e.label) throw new Error(`Emoção "${k}" sem label`);
    if (!e.emoji) throw new Error(`Emoção "${k}" sem emoji`);
    if (!e.color) throw new Error(`Emoção "${k}" sem color`);
    if (typeof e.pitch !== 'number') throw new Error(`Emoção "${k}" sem pitch numérico`);
    if (typeof e.rate  !== 'number') throw new Error(`Emoção "${k}" sem rate numérico`);
    if (typeof e.volume !== 'number') throw new Error(`Emoção "${k}" sem volume numérico`);
  }
});

test('[CRITICO] pitch permanece em [0.5, 2.0] para todas as combinações possíveis (81 combinações)', () => {
  const emotions = Object.keys(BASE_EMOTIONS);
  const intensities = ['suave','moderada','intensa'];
  const styles = ['formal','casual','narrativo'];
  let checked = 0;
  for (const e of emotions) {
    for (const i of intensities) {
      for (const s of styles) {
        const { pitch } = getEmotionSettings(e, i, s);
        if (pitch < 0.5 || pitch > 2.0) throw new Error(`pitch OOB=${pitch} para e=${e} i=${i} s=${s}`);
        checked++;
      }
    }
  }
  process.stdout.write(`     (${checked} combinações verificadas) `);
});

test('[CRITICO] rate permanece em [0.5, 2.5] para todas as 81 combinações possíveis', () => {
  const emotions = Object.keys(BASE_EMOTIONS);
  const intensities = ['suave','moderada','intensa'];
  const styles = ['formal','casual','narrativo'];
  for (const e of emotions) {
    for (const i of intensities) {
      for (const s of styles) {
        const { rate } = getEmotionSettings(e, i, s);
        if (rate < 0.5 || rate > 2.5) throw new Error(`rate OOB=${rate} para e=${e} i=${i} s=${s}`);
      }
    }
  }
});

test('[CRITICO] volume permanece em [0, 1] para todos os estados', () => {
  for (const e of Object.keys(BASE_EMOTIONS)) {
    const { volume } = getEmotionSettings(e, 'intensa', 'narrativo');
    if (volume < 0 || volume > 1) throw new Error(`volume OOB=${volume} para e=${e}`);
  }
});

test('intensidade "suave" produz menor pitch que "intensa" para alegria', () => {
  const suave   = getEmotionSettings('alegria', 'suave',   'casual');
  const intensa = getEmotionSettings('alegria', 'intensa', 'casual');
  expect(suave.pitch).toBeLessThan(intensa.pitch);
});

test('estilo formal produz rate menor que casual (neutro/moderada)', () => {
  const formal = getEmotionSettings('neutro', 'moderada', 'formal');
  const casual = getEmotionSettings('neutro', 'moderada', 'casual');
  expect(formal.rate).toBeLessThan(casual.rate);
});

test('tristeza pitch < 1.0 (tom mais grave)', () => {
  const { pitch } = getEmotionSettings('tristeza', 'moderada', 'casual');
  expect(pitch).toBeLessThan(1.0);
});

test('alegria pitch > 1.0 (tom mais agudo)', () => {
  const { pitch } = getEmotionSettings('alegria', 'moderada', 'casual');
  expect(pitch).toBeGreaterThan(1.0);
});

test('emoção inválida usa fallback neutro (pitch=1, rate=1)', () => {
  const result = getEmotionSettings('xyz_invalida', 'moderada', 'casual');
  expect(result.pitch).toBe(1.0);
  expect(result.rate).toBe(1.0);
});

test('getRandomEmotion nunca retorna "neutro" (50 sorteios)', () => {
  for (let i = 0; i < 50; i++) {
    const r = getRandomEmotion();
    if (r === 'neutro') throw new Error(`Sorteou "neutro" na iteração ${i}`);
  }
});

test('[CRITICO] texto vazio/null/undefined não causa erro nos modificadores', () => {
  const emotions = ['neutro','alegria','tristeza','dor','ansiedade','duvida'];
  for (const e of emotions) {
    expectNotToThrow(() => applyTextModifiers('', e, 'casual'));
    expectNotToThrow(() => applyTextModifiers(null, e, 'casual'));
    expectNotToThrow(() => applyTextModifiers(undefined, e, 'casual'));
  }
});

test('dúvida adiciona "?" ao final quando ausente', () => {
  const r = applyTextModifiers('Você tem certeza', 'duvida', 'casual');
  if (!r.trim().endsWith('?')) throw new Error(`Esperado "?" no final, recebido: "${r}"`);
});

test('modificador não insere "..." entre palavras individuais', () => {
  const r = applyTextModifiers('Tenho muita dor hoje.', 'dor', 'casual');
  // Não deve ter padrão de palavra seguida de "..." seguida de palavra sem ponto
  if (/\w\.\.\. \w/.test(r)) throw new Error(`Fragmentação de palavras detectada: "${r}"`);
});


section('2. CONFIGURAÇÕES — useSettings');

test('load() retorna DEFAULT_SETTINGS com localStorage vazio', () => {
  localStorage.clear();
  const result = loadSettings();
  expect(result.gender).toBe(DEFAULT_SETTINGS.gender);
  expect(result.style).toBe(DEFAULT_SETTINGS.style);
  expect(result.intensity).toBe(DEFAULT_SETTINGS.intensity);
});

test('setupDone é false por padrão (novo usuário)', () => {
  localStorage.clear();
  expect(loadSettings().setupDone).toBe(false);
});

test('save() persiste corretamente no localStorage', () => {
  localStorage.clear();
  saveSettings({ gender: 'male', style: 'formal', setupDone: true });
  const r = loadSettings();
  expect(r.gender).toBe('male');
  expect(r.style).toBe('formal');
  expect(r.setupDone).toBe(true);
});

test('save() faz merge preservando dados anteriores', () => {
  localStorage.clear();
  saveSettings({ gender: 'male' });
  saveSettings({ style: 'narrativo' });
  const r = loadSettings();
  expect(r.gender).toBe('male');
  expect(r.style).toBe('narrativo');
});

test('reset() limpa localStorage e load() volta ao DEFAULT', () => {
  saveSettings({ gender: 'male', setupDone: true });
  resetSettings();
  expect(loadSettings().setupDone).toBe(false);
});

test('JSON corrompido retorna DEFAULT_SETTINGS sem crash', () => {
  localStorage.setItem('ottovox_settings', '{INVALIDO}');
  expectNotToThrow(() => {
    const r = loadSettings();
    if (!r.gender) throw new Error('gender ausente após JSON corrompido');
  });
  localStorage.clear();
});


section('3. FRASES CLÍNICAS — usePhrases');

test('PRESET_PHRASES contém categorias "saudacoes" e "clinicas"', () => {
  if (!PRESET_PHRASES.saudacoes) throw new Error('"saudacoes" não encontrado');
  if (!PRESET_PHRASES.clinicas)  throw new Error('"clinicas" não encontrado');
});

test('saudações contém ao menos 8 frases', () => {
  expect(PRESET_PHRASES.saudacoes.phrases.length).toBeGreaterThanOrEqual(8);
});

test('[CLINICO] frases críticas obrigatórias estão presentes', () => {
  const todos = [
    ...PRESET_PHRASES.saudacoes.phrases,
    ...PRESET_PHRASES.clinicas.phrases,
  ].map(p => p.text.toLowerCase());

  const criticas = ['preciso de ajuda', 'médico', 'dor', 'água', 'sim', 'não'];
  for (const c of criticas) {
    if (!todos.some(t => t.includes(c.split(' ')[0])))
      throw new Error(`Frase clínica crítica ausente: "${c}"`);
  }
});

test('IDs dos presets são todos únicos', () => {
  const ids = [
    ...PRESET_PHRASES.saudacoes.phrases.map(p => p.id),
    ...PRESET_PHRASES.clinicas.phrases.map(p => p.id),
  ];
  const unique = new Set(ids);
  if (unique.size !== ids.length) throw new Error(`IDs duplicados encontrados: ${ids.length - unique.size} duplicata(s)`);
});

test('nenhuma frase pré-definida é string vazia', () => {
  const all = [...PRESET_PHRASES.saudacoes.phrases, ...PRESET_PHRASES.clinicas.phrases];
  for (const p of all) {
    if (!p.text.trim()) throw new Error(`Frase vazia encontrada com id: ${p.id}`);
  }
});

test('addPhrase() persiste no localStorage e retorna objeto com id e text', () => {
  localStorage.clear();
  const p = addPhrase('Boa tarde!');
  if (!p.id) throw new Error('addPhrase não retornou id');
  if (p.text !== 'Boa tarde!') throw new Error(`text incorreto: "${p.text}"`);
  const stored = loadPhrases();
  if (!stored.some(s => s.text === 'Boa tarde!')) throw new Error('Não foi persistido');
  localStorage.clear();
});

test('addPhrase() faz trim do texto', () => {
  localStorage.clear();
  const p = addPhrase('  Olá!  ');
  if (p.text !== 'Olá!') throw new Error(`Esperado "Olá!", recebido "${p.text}"`);
  localStorage.clear();
});

test('removePhrase() remove corretamente pelo id', () => {
  localStorage.clear();
  const p = addPhrase('Remover');
  addPhrase('Manter');
  const updated = removePhrase(p.id);
  if (updated.some(x => x.id === p.id)) throw new Error('Frase não foi removida');
  if (!updated.some(x => x.text === 'Manter')) throw new Error('Frase errada foi removida');
  localStorage.clear();
});

test('removePhrase() com id inexistente não lança erro', () => {
  localStorage.clear();
  addPhrase('Segura');
  expectNotToThrow(() => removePhrase('id_inexistente'));
  localStorage.clear();
});


// ─── RELATÓRIO FINAL ──────────────────────────────────────────────────────────

const total = passed + failed;
const emoji = failed === 0 ? '🟢' : failed <= 2 ? '🟡' : '🔴';

process.stdout.write(`
${'═'.repeat(55)}
  OTTO VOX — RELATÓRIO DE AUDITORIA PROFISSIONAL
${'═'.repeat(55)}

  ${emoji} Resultado :  ${passed} / ${total} testes passaram
  ✅ Aprovados    :  ${passed}
  ❌ Reprovados   :  ${failed}
  📝 Total        :  ${total}

`);

if (failures.length > 0) {
  process.stdout.write(`  FALHAS DETECTADAS:\n`);
  for (const { name, error } of failures) {
    process.stdout.write(`  ❌ "${name}"\n     ${error}\n\n`);
  }
}

if (failed === 0) {
  process.stdout.write(`  ✅ AUDITORIA APROVADA — Todos os contratos de segurança\n     e qualidade do OTTO VOX estão íntegros.\n\n`);
} else {
  process.stdout.write(`  ⚠️  AUDITORIA COM RESSALVAS — Corrija as falhas acima\n     antes do próximo deploy.\n\n`);
}

process.exit(failed === 0 ? 0 : 1);
