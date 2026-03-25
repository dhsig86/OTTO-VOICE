import { useState, useEffect, useRef } from 'react';
import { Settings, Sun, Moon } from 'lucide-react';
import { useTTS } from './hooks/useTTS';
import { useEmotionEngine } from './hooks/useEmotionEngine';
import { useSettings } from './hooks/useSettings';
import SetupScreen from './components/SetupScreen';
import EmotionWheel from './components/EmotionWheel';
import PlayerControls from './components/PlayerControls';
import './index.css';

export default function App() {
  const settingsStore = useSettings();
  const { voices, speak, pause, resume, stop, isPlaying, isPaused } = useTTS();
  const { getEmotionSettings, applyTextModifiers } = useEmotionEngine();

  // Carrega configurações salvas
  const [savedSettings, setSavedSettings] = useState(() => settingsStore.load());
  const [isDark, setIsDark] = useState(true);
  const [showSetup, setShowSetup] = useState(() => !settingsStore.load().setupDone);
  const [selectedEmotion, setSelectedEmotion] = useState('neutro');
  const [intensity, setIntensity] = useState(() => settingsStore.load().intensity || 'moderada');
  const [text, setText] = useState('');

  // Aplica tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Seleciona voz automática baseada no setup salvo
  const selectedVoice = useRef(null);
  useEffect(() => {
    if (voices.length === 0) return;
    const { gender } = savedSettings;
    const filtered = gender === 'all'
      ? voices
      : voices.filter(v => v.gender === gender);
    selectedVoice.current = filtered[0] || voices[0];
  }, [voices, savedSettings]);

  const handleSetupComplete = (newSettings) => {
    const full = { ...newSettings, setupDone: true };
    settingsStore.save(full);
    setSavedSettings(full);
    setIntensity(full.intensity);
    setShowSetup(false);
  };

  const handlePlayPause = () => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPlaying && isPaused) {
      resume();
    } else {
      if (!text.trim()) return;
      const { style } = savedSettings;
      const params = getEmotionSettings(selectedEmotion, intensity, style);
      const modifiedText = applyTextModifiers(text, selectedEmotion, style);
      speak(modifiedText, selectedVoice.current, params.pitch, params.rate, params.volume);
    }
  };

  const INTENSITY_OPTS = [
    { key: 'suave',    label: 'Suave'    },
    { key: 'moderada', label: 'Moderada' },
    { key: 'intensa',  label: 'Intensa'  },
  ];

  if (showSetup) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <h1>OTTO <span>VOX</span></h1>
          <p>Síntese Vocal Emocional</p>
        </div>
        <div className="header-actions">
          <button
            className="icon-action-btn"
            onClick={() => setShowSetup(true)}
            title="Configurações"
          >
            <Settings size={18} />
          </button>
          <button
            className="icon-action-btn"
            onClick={() => setIsDark(p => !p)}
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main>
        {/* Roleta de Emoções */}
        <section className="glass-panel wheel-section">
          <label>Emoção</label>
          <EmotionWheel
            selectedEmotion={selectedEmotion}
            onSelect={setSelectedEmotion}
          />
          {/* Intensidade: 3 pontos */}
          <div className="intensity-selector">
            {INTENSITY_OPTS.map(opt => (
              <button
                key={opt.key}
                className={`intensity-dot${intensity === opt.key ? ' active' : ''}`}
                onClick={() => setIntensity(opt.key)}
                title={opt.label}
              >
                <span className="intensity-dot-icon" />
                <span className="intensity-dot-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Área de texto */}
        <section className="text-section glass-panel">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Toque aqui e digite o que deseja ouvir..."
            rows={5}
          />
        </section>

        {/* Player */}
        <PlayerControls
          isPlaying={isPlaying}
          isPaused={isPaused}
          onPlayPause={handlePlayPause}
          onStop={stop}
        />
      </main>
    </div>
  );
}
