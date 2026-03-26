import { useState, useRef, useCallback } from 'react';

export function usePremiumTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const speak = useCallback(async (text, voiceId) => {
    if (!text.trim()) return;
    
    // Para qualquer áudio anterior
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsLoading(true);

    try {
      // Chama o backend da Vercel para isolar segurança
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no servidor de voz.');
      }

      // Recebe o stream hiper-rápido de byte array (MP3)
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        URL.revokeObjectURL(url); // Limpa memória local
      };

      audio.onerror = (e) => {
        console.error('OTTO VOX Premium TTS Audio Error:', e);
        setIsPlaying(false);
        setIsLoading(false);
      };

      await audio.play();

    } catch (error) {
      console.error('OTTO VOX Premium TTS Fetch Error:', error);
      alert('Falha na Voz Premium. Certifique-se de que configurou a sua API Key na Vercel.');
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  return { speak, pause, resume, stop, isPlaying, isPaused, isLoading };
}
