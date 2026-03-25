import { useState, useRef, useEffect } from 'react';

const EMOTION_KEYS = [
  'neutro', 'alegria', 'felicidade', 'tristeza',
  'ansiedade', 'duvida', 'irritacao', 'dor', 'angustia',
];

// Padrão CSS para cada emoção (cor e emoji)
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
const STEP_ANGLE = 360 / COUNT;

export default function EmotionWheel({ selectedEmotion, onSelect }) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const touchStartX = useRef(null);
  const currentIndex = EMOTION_KEYS.indexOf(selectedEmotion);

  // Sincroniza posição da roleta com emoção selecionada externamente (ex: Setup)
  useEffect(() => {
    const idx = EMOTION_KEYS.indexOf(selectedEmotion);
    if (idx >= 0) {
      setRotation(-idx * STEP_ANGLE);
    }
  }, [selectedEmotion]);

  const spinTo = (targetIndex, extraSpins = 3) => {
    if (isSpinning) return;
    setIsSpinning(true);
    const fullSpins = extraSpins * 360;
    const targetAngle = -(targetIndex * STEP_ANGLE);
    // Calcula quantos graus faltam para chegar ao target partindo do atual
    const current = rotation % -360;
    const newRotation = rotation - (rotation % 360) - fullSpins + targetAngle;
    setRotation(newRotation);
    setTimeout(() => {
      setIsSpinning(false);
      onSelect(EMOTION_KEYS[targetIndex]);
    }, 900);
  };

  const handleSpin = () => {
    const randomIdx = Math.floor(Math.random() * COUNT);
    spinTo(randomIdx);
  };

  // Swipe para navegar manualmente
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 30) return; // Ignorar swipes curtos
    const dir = dx < 0 ? 1 : -1;
    const nextIdx = (currentIndex + dir + COUNT) % COUNT;
    spinTo(nextIdx, 0);
  };

  const activeEmotion = EMOTION_META[selectedEmotion] || EMOTION_META.neutro;

  return (
    <div className="wheel-container">
      {/* Seta indicadora no topo */}
      <div className="wheel-arrow">▼</div>

      {/* Disco giratório */}
      <div
        className={`wheel-track${isSpinning ? ' spinning' : ''}`}
        style={{ transform: `rotate(${rotation}deg)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {EMOTION_KEYS.map((key, i) => {
          const meta = EMOTION_META[key];
          const isActive = key === selectedEmotion;
          return (
            <div
              key={key}
              className={`wheel-item${isActive ? ' active' : ''}`}
              style={{
                '--item-color': meta.color,
                transform: `translateX(${i * 90}px)`,
              }}
              onClick={() => !isSpinning && spinTo(i, 0)}
            >
              <span className="wheel-emoji">{meta.emoji}</span>
              <span className="wheel-label">{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Botão central de sortear */}
      <button
        className={`wheel-spin-btn${isSpinning ? ' spinning' : ''}`}
        onClick={handleSpin}
        disabled={isSpinning}
        title="Girar e sortear emoção"
      >
        <span style={{ fontSize: '1.5rem' }}>{activeEmotion.emoji}</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>sortear</span>
      </button>
    </div>
  );
}
