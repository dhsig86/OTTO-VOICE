import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tela/aba/passo sincronizado com o histórico do navegador — o "voltar" do Android, o gesto de
 * voltar e o "‹" do OTTO PWA passam a voltar DENTRO do módulo, em vez de sair dele.
 * Sprint de navegação do ecossistema (OTTOPWA/docs/SPRINT_FLUXOS_NAVEGACAO.md, etapa F3).
 *
 * - Trocar de tela empilha uma entrada (history.pushState) com a tela nova.
 * - Voltar (sistema ou botão "Voltar"/"Início" do próprio módulo) desempilha: se a tela pedida
 *   já está mais atrás na pilha, volta até ela (history.go) — assim o botão do módulo e o do
 *   sistema andam juntos, sem vai-e-volta.
 * - `{ replace: true }` troca a tela atual sem criar entrada (ex.: fim de fluxo).
 * - Pode ser usado em mais de um nível (ex.: tela + etapa de um assistente): cada entrada guarda
 *   a posição absoluta no histórico (`__ottoPos`), então os saltos contam certo.
 * - Funciona igual com o módulo aberto sozinho ou dentro do iframe do PWA (o histórico do iframe
 *   é compartilhado com o da página).
 * - Num reload, sempre começa na tela inicial (não restaura tela que dependa de dados em memória).
 */
const POS = '__ottoPos';

function currentPos() {
  const p = window.history.state?.[POS];
  return typeof p === 'number' ? p : 0;
}

/**
 * @template {string | number} T
 * @param {string} key  chave usada no history.state (única por app/nível)
 * @param {T} initial  tela inicial
 * @returns {[T, (next: T, opts?: { replace?: boolean }) => void]}
 */
export function useHistoryView(key, initial) {
  const [value, setValue] = useState(initial);
  // Pilha desta tela: valor + posição absoluta da entrada no histórico.
  const stack = useRef([]);
  const depthKey = `${key}__depth`;

  useEffect(() => {
    // Marca a entrada atual como a tela inicial, sem criar entrada nova.
    const pos = currentPos();
    stack.current = [{ v: initial, pos }];
    window.history.replaceState({ ...(window.history.state || {}), [POS]: pos, [key]: initial, [depthKey]: 0 }, '');
    const onPop = (e) => {
      const depth = e.state?.[depthKey];
      if (typeof depth === 'number') {
        stack.current = stack.current.slice(0, depth + 1);
        setValue(e.state[key]);
      } else {
        stack.current = stack.current.slice(0, 1);
        setValue(initial);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback((next, opts) => {
    const s = stack.current;
    const top = s[s.length - 1];
    if (!top || next === top.v) return;
    if (opts?.replace) {
      top.v = next;
      window.history.replaceState({ ...(window.history.state || {}), [key]: next }, '');
      setValue(next);
      return;
    }
    for (let i = s.length - 2; i >= 0; i--) {
      if (s[i].v === next) {
        // A tela pedida já está mais atrás na pilha: troca a tela JÁ (resposta imediata ao toque)
        // e desempilha o histórico até ela; o popstate que chega depois só confirma.
        const delta = s[i].pos - currentPos();
        stack.current = s.slice(0, i + 1);
        setValue(next);
        if (delta < 0) window.history.go(delta);
        return;
      }
    }
    const pos = currentPos() + 1;
    s.push({ v: next, pos });
    window.history.pushState({ ...(window.history.state || {}), [POS]: pos, [key]: next, [depthKey]: s.length - 1 }, '');
    setValue(next);
  }, [key, depthKey]);

  return [value, go];
}
