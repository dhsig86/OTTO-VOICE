import { useState, useEffect, useCallback } from 'react';

// Nomes comuns para dedução simples de gênero na falta de API nativa para isso
const MALE_NAMES = ['antonio', 'julio', 'tiago', 'daniel', 'male', 'mac', 'brian'];
const FEMALE_NAMES = ['francisca', 'leticia', 'luciana', 'heloisa', 'vitoria', 'female', 'yara', 'zira', 'maria', 'elza'];

export function useTTS() {
  const [voices, setVoices] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Carrega as vozes de forma assíncrona, já que o navegador pode demorar a disponibilizá-las
  const loadVoices = useCallback(() => {
    if (!window.speechSynthesis) return;
    
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length === 0) return;

    // Foca em vozes em Português
    const ptVoices = availableVoices.filter(v => v.lang.includes('pt'));
    
    // Processamento de Metadados (Gênero e "Premium")
    const processedVoices = ptVoices.map(voice => {
      const nameL = voice.name.toLowerCase();
      
      // Detecção de Qualidade (Premium/Neural soam muito mais naturais)
      const isPremium = nameL.includes('natural') || nameL.includes('neural') || nameL.includes('online');
      
      // Detecção de Gênero
      let gender = 'neutral';
      if (MALE_NAMES.some(n => nameL.includes(n))) gender = 'male';
      if (FEMALE_NAMES.some(n => nameL.includes(n))) gender = 'female';
      
      return {
        originalVoice: voice,
        name: voice.name.replace(/Microsoft |Google |Online \(Natural\) - Portuguese \(Brazil\)/gi, '').trim(),
        lang: voice.lang,
        isPremium,
        gender
      };
    });

    // Ordena: Premium primeiro
    processedVoices.sort((a, b) => (b.isPremium === a.isPremium ? 0 : b.isPremium ? 1 : -1));
    
    setVoices(processedVoices);
  }, []);

  useEffect(() => {
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [loadVoices]);

  const speak = (text, voiceObj, pitch = 1, rate = 1, volume = 1) => {
    if (!window.speechSynthesis) {
      alert("Seu navegador não suporta síntese de voz.");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Âncora Global p/ Android Chrome GC Bug: manter utterance vivo forçosamente
    window._ottoUtterance = utterance;

    if (voiceObj && voiceObj.originalVoice) {
      utterance.voice = voiceObj.originalVoice;
    }
    
    // Evita Mute acidental se engine errar o guess
    utterance.lang = "pt-BR";
    
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); };
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onpause = () => setIsPaused(true);
    utterance.onresume = () => setIsPaused(false);
    utterance.onerror = (e) => { 
      console.warn("TTS Error:", e);
      setIsPlaying(false); 
      setIsPaused(false); 
    };

    // Hack brutal para Safari/Chrome Mobile: forçar o resume antes do speak destrava a fila travada silenciosamente
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const stop = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return { voices, speak, pause, resume, stop, isPlaying, isPaused };
}
