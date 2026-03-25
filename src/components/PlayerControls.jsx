import { useRef, useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';

const HOLD_DURATION = 2000; // 2 segundos para Stop

export default function PlayerControls({ isPlaying, isPaused, onPlayPause, onStop }) {
  const holdTimerRef = useRef(null);
  const [holdProgress, setHoldProgress] = useState(0); // 0 → 1
  const animFrameRef = useRef(null);

  const startHold = () => {
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Dispara Stop + haptic
        if (navigator.vibrate) navigator.vibrate(50);
        onStop();
        setHoldProgress(0);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const cancelHold = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setHoldProgress(0);
  };

  const circumference = 2 * Math.PI * 22; // raio = 22px

  return (
    <div className="player-controls">
      {/* Play / Pause */}
      <button
        className={`play-btn${isPlaying && !isPaused ? ' playing' : ''}`}
        onClick={onPlayPause}
        aria-label={isPlaying && !isPaused ? 'Pausar' : 'Reproduzir'}
      >
        {isPlaying && !isPaused ? <Pause size={28} /> : <Play size={28} />}
      </button>

      {/* Stop com long-press 2s */}
      <div className="stop-wrapper">
        <svg className="stop-ring" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="22" fill="none"
            stroke="var(--accent)" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - holdProgress)}
            transform="rotate(-90 24 24)"
            style={{ transition: holdProgress === 0 ? 'none' : 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <button
          className="stop-btn"
          disabled={!isPlaying}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          aria-label="Parar (segure 2 segundos)"
        >
          <Square size={18} />
        </button>
      </div>
    </div>
  );
}
