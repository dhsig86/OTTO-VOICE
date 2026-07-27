import { useRef, useEffect } from 'react';
import { Dices } from 'lucide-react';

const EMOTION_KEYS = [
  'neutro', 'alegria', 'felicidade', 'tristeza',
  'ansiedade', 'duvida', 'irritacao', 'dor', 'angustia',
];

const EMOTION_META = {
  neutro:     { emoji: '😐', color: '#a0b4b2', label: 'Neutro'    },
  alegria:    { emoji: '😄', color: '#f1c40f', label: 'Alegria'   },
  felicidade: { emoji: '😊', color: '#2ecc71', label: 'Feliz'     },
  tristeza:   { emoji: '😢', color: '#5dade2', label: 'Tristeza'  },
  ansiedade:  { emoji: '😰', color: '#9b59b6', label: 'Ansiedade' },
  duvida:     { emoji: '🤔', color: '#e67e22', label: 'Dúvida'    },
  irritacao:  { emoji: '😠', color: '#e74c3c', label: 'Irritação' },
  dor:        { emoji: '😣', color: '#c0392b', label: 'Dor'       },
  angustia:   { emoji: '😩', color: '#7f8c8d', label: 'Angústia'  },
};

const COUNT = EMOTION_KEYS.length;

export default function EmotionWheel({ selectedEmotion, onSelect }) {
  const trackRef = useRef(null);
  const itemRefs = useRef({});

  // Centraliza o item selecionado ao carregar ou ao mudar via setState
  useEffect(() => {
    const el = itemRefs.current[selectedEmotion];
    if (el && trackRef.current) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedEmotion]);

  // ─── scrollend nativo (substitui onScrollEnd que não é evento React) ─────
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScrollEnd = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let closestKey = selectedEmotion;
      let minDistance = Infinity;

      EMOTION_KEYS.forEach(key => {
        const el = itemRefs.current[key];
        if (!el) return;
        const elCenter = el.offsetLeft + el.clientWidth / 2;
        const dist = Math.abs(center - elCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestKey = key;
        }
      });

      if (closestKey !== selectedEmotion && minDistance < 45) {
        onSelect(closestKey);
      }
    };

    // scrollend suportado em Chrome 114+, Firefox 109+, Safari 18+
    track.addEventListener('scrollend', handleScrollEnd);

    // Fallback: touchend + debounce para navegadores sem scrollend
    let touchTimer = null;
    const handleTouchEnd = () => {
      clearTimeout(touchTimer);
      touchTimer = setTimeout(handleScrollEnd, 150);
    };
    track.addEventListener('touchend', handleTouchEnd);
    track.addEventListener('mouseup', handleTouchEnd);

    return () => {
      track.removeEventListener('scrollend', handleScrollEnd);
      track.removeEventListener('touchend', handleTouchEnd);
      track.removeEventListener('mouseup', handleTouchEnd);
      clearTimeout(touchTimer);
    };
  }, [selectedEmotion, onSelect]);

  const handleRandom = () => {
    let nextIdx = Math.floor(Math.random() * COUNT);
    if (EMOTION_KEYS[nextIdx] === selectedEmotion) {
      nextIdx = (nextIdx + 1) % COUNT;
    }
    onSelect(EMOTION_KEYS[nextIdx]);
  };

  return (
    <div className="carousel-container" role="radiogroup" aria-label="Seleção de emoção">
      {/* Seta/indicador central de mira */}
      <div className="carousel-indicator">▼</div>
      
      <div 
        className="carousel-track" 
        ref={trackRef}
      >
        {EMOTION_KEYS.map((key) => {
          const meta = EMOTION_META[key];
          const isActive = key === selectedEmotion;
          
          return (
            <div
              key={key}
              ref={(el) => itemRefs.current[key] = el}
              className={`carousel-item${isActive ? ' active' : ''}`}
              style={{ '--item-color': meta.color }}
              onClick={() => onSelect(key)}
              role="radio"
              aria-checked={isActive}
              aria-label={`Emoção: ${meta.label}`}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(key); }}
            >
              <div className="carousel-item-inner">
                <span className="carousel-emoji">{meta.emoji}</span>
              </div>
              <span className="carousel-label">{meta.label}</span>
            </div>
          );
        })}
      </div>

      <button className="carousel-random-btn" onClick={handleRandom} title="Sortear emoção" aria-label="Sortear Emoção Aleatória">
         <Dices size={18} strokeWidth={2.5} />
         <span>Sortear</span>
      </button>
    </div>
  );
}
