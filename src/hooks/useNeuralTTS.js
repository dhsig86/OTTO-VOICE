import { useState, useRef, useCallback } from 'react';

// Módulo singleton para o pipeline (evita reload entre renders)
let _pipeline = null;
let _pipelinePromise = null;

// ─── Parâmetros Emocionais para Web Audio API ─────────────────────────────────
// A mesma voz neural é modulada post-geração usando:
// - playbackRate: altera velocidade E pitch sutilmente (como um disco girando mais lento/rápido)
// - gain: energia/volume da emoção
// - filter: equalização tonal (highshelf = mais brilhante/alegre, lowshelf = mais grave/pesado)
export const NEURAL_EMOTION_PARAMS = {
  neutro:     { playbackRate: 1.00, gain: 1.00, filterType: 'peaking',   filterFreq: 2000, filterGainDb:  0 },
  alegria:    { playbackRate: 1.08, gain: 1.05, filterType: 'highshelf', filterFreq: 3000, filterGainDb:  3.5 },
  felicidade: { playbackRate: 1.05, gain: 1.05, filterType: 'highshelf', filterFreq: 2500, filterGainDb:  2.5 },
  tristeza:   { playbackRate: 0.88, gain: 0.80, filterType: 'lowshelf',  filterFreq: 800,  filterGainDb:  4 },
  ansiedade:  { playbackRate: 1.13, gain: 0.95, filterType: 'peaking',   filterFreq: 3500, filterGainDb:  2 },
  duvida:     { playbackRate: 0.97, gain: 0.93, filterType: 'peaking',   filterFreq: 1500, filterGainDb:  1 },
  irritacao:  { playbackRate: 1.07, gain: 1.05, filterType: 'peaking',   filterFreq: 1200, filterGainDb: -2 },
  dor:        { playbackRate: 0.86, gain: 0.78, filterType: 'lowshelf',  filterFreq: 600,  filterGainDb:  5 },
  angustia:   { playbackRate: 0.91, gain: 0.82, filterType: 'lowshelf',  filterFreq: 700,  filterGainDb:  3.5 },
};

export function useNeuralTTS() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);

  const loadModel = useCallback(async () => {
    if (_pipeline) return _pipeline;
    if (_pipelinePromise) return _pipelinePromise;

    setIsLoading(true);
    setLoadProgress(0);
    setError(null);

    _pipelinePromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');

      const p = await pipeline(
        'text-to-speech',
        'Xenova/mms-tts-por',
        {
          progress_callback: ({ status, progress }) => {
            if (status === 'downloading' || status === 'progress') {
              setLoadProgress(Math.round(progress ?? 0));
            }
          },
        }
      );

      _pipeline = p;
      setIsLoading(false);
      setIsReady(true);
      setLoadProgress(100);
      return p;
    })().catch(err => {
      console.error('OTTO VOX Neural TTS: falha ao carregar modelo', err);
      setError('Não foi possível carregar o modelo neural. Verifique sua conexão.');
      setIsLoading(false);
      _pipelinePromise = null;
      return null;
    });

    return _pipelinePromise;
  }, []);

  const speak = useCallback(async (text, emotionKey = 'neutro') => {
    if (!text.trim()) return;

    // Para qualquer áudio em andamento
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (_) {}
      sourceRef.current = null;
    }

    const synth = await loadModel();
    if (!synth) return;

    setIsPlaying(true);

    try {
      const output = await synth(text);
      const audioData = output.audio; // Float32Array
      const sampleRate = output.sampling_rate;

      // Cria ou reabre o AudioContext
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext({ sampleRate });
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      // Buffer de áudio
      const buffer = audioCtx.createBuffer(1, audioData.length, sampleRate);
      buffer.getChannelData(0).set(audioData);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      sourceRef.current = source;

      // ─── Cadeia de Processamento Emocional ───────────────────────────────────
      const params = NEURAL_EMOTION_PARAMS[emotionKey] || NEURAL_EMOTION_PARAMS.neutro;

      // 1. Velocidade/Pitch (mesma voz, variação sutil de energia)
      source.playbackRate.value = Math.max(0.7, Math.min(1.3, params.playbackRate));

      // 2. Ganho (volume emocional)
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = Math.max(0.5, Math.min(1.2, params.gain));

      // 3. Filtro de equalização tonal (cor emocional do timbre)
      const filterNode = audioCtx.createBiquadFilter();
      filterNode.type = params.filterType;
      filterNode.frequency.value = params.filterFreq;
      filterNode.gain.value = params.filterGainDb;

      // Cadeia: source → filter → gain → saída
      source.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };

      source.start();
    } catch (err) {
      console.error('OTTO VOX Neural TTS speak error:', err);
      setIsPlaying(false);
    }
  }, [loadModel]);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (_) {}
      sourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return {
    speak, stop, loadModel,
    isLoading, isReady, isPlaying,
    loadProgress, error
  };
}
