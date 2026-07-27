import { useState, useRef, useCallback } from 'react';

// ── Obtém token Firebase do PWA Shell ou do próprio módulo ──────────────────
// O OTTO VOX pode rodar:
//   (a) embarcado como iframe no PWA Shell → recebe token via postMessage
//   (b) standalone → se futuro login direto for implementado
// Se nenhum token disponível, faz fallback para Web Speech (gratuito/offline).
let _cachedFirebaseToken = null;

// Listener para receber token do PWA Shell via postMessage
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    const ALLOWED_ORIGINS = [
      'https://otto.drdariohart.com',
      'https://ottos-plum.vercel.app',
      'https://ottopwa.vercel.app',
      'http://localhost:5173',
    ];
    if (!ALLOWED_ORIGINS.includes(event.origin)) return;
    if (event.data?.type === 'otto-context' && event.data?.payload?.firebaseToken) {
      _cachedFirebaseToken = event.data.payload.firebaseToken;
      console.log('OTTO VOX: Token Firebase recebido do PWA Shell.');
    }
  });
}

/**
 * Define o token Firebase externamente (para uso standalone ou integração direta).
 */
export function setFirebaseToken(token) {
  _cachedFirebaseToken = token;
}

// Motores de fallback: Web Speech API nativo
function speakWithWebSpeech(text, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  window._ottoFallbackUtterance = utterance; // Ancoragem contra GC
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.resume(); // Anti-Hang Mobile
  window.speechSynthesis.speak(utterance);
}

// URL do serverless — absoluta para funcionar em qualquer deploy
const TTS_API_URL = import.meta.env.VITE_TTS_API_URL || '/api/tts';

export function usePremiumTTS() {
  const [isPlaying, setIsPlaying]   = useState(false);
  const [isPaused, setIsPaused]     = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  // 'premium' | 'fallback_offline' | 'fallback_error' | null
  const [fallbackReason, setFallbackReason] = useState(null);
  const audioRef = useRef(null);

  // ─── Fallback confiável: usa Web Speech quando o Premium falha ───────────
  const _speakFallback = useCallback((text, reason) => {
    setFallbackReason(reason);
    setIsLoading(false);
    setIsPlaying(true);
    speakWithWebSpeech(text, () => {
      setIsPlaying(false);
      setFallbackReason(null);
    });
  }, []);

  const speak = useCallback(async (text, voiceId) => {
    if (!text.trim()) return;

    // Para qualquer áudio anterior
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setFallbackReason(null);

    // ─── Verificação de Conectividade ─────────────────────────────────────
    if (!navigator.onLine) {
      console.warn('OTTO VOX: Sem internet. Usando Web Speech como fallback.');
      _speakFallback(text, 'offline');
      return;
    }

    // ─── Verificação de Token Firebase ────────────────────────────────────
    if (!_cachedFirebaseToken) {
      console.warn('OTTO VOX: Sem token Firebase. Usando Web Speech como fallback.');
      _speakFallback(text, 'no_auth');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${_cachedFirebaseToken}`,
        },
        body: JSON.stringify({ text, voiceId }),
        // Timeout de 8s: se o servidor demorar, o paciente não pode esperar
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        let reason = 'api_error';
        try {
          const errData = await response.json();
          if (response.status === 429 || (errData.error || '').toLowerCase().includes('quota')) {
            reason = 'quota';
          } else if (response.status === 401) {
            reason = 'auth';
            // Token expirou — limpar cache para forçar renovação
            _cachedFirebaseToken = null;
          }
        } catch (_) { /* ignora parse error */ }
        throw Object.assign(new Error('API Error'), { reason });
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay    = () => { setIsPlaying(true); setIsPaused(false); setIsLoading(false); };
      audio.onended   = () => { setIsPlaying(false); setIsPaused(false); URL.revokeObjectURL(url); };
      audio.onerror   = () => {
        console.error('OTTO VOX: Erro no playback do áudio premium. Acionando fallback.');
        _speakFallback(text, 'playback_error');
      };

      await audio.play();

    } catch (error) {
      // Timeout ou erro de rede → fallback transparente (sem alert)
      const isTimeout   = error.name === 'TimeoutError' || error.name === 'AbortError';
      const isNetwork   = error instanceof TypeError;
      const reason      = error.reason || (isTimeout ? 'timeout' : isNetwork ? 'network' : 'api_error');

      console.warn(`OTTO VOX: Premium falhou (${reason}). Ativando Web Speech fallback.`);
      _speakFallback(text, reason);
    }
  }, [_speakFallback]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setFallbackReason(null);
  }, []);

  return { speak, pause, resume, stop, isPlaying, isPaused, isLoading, fallbackReason };
}
