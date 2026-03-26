import { useState, useEffect, useRef } from 'react';
import { Settings, Sun, Moon, Cpu, Zap } from 'lucide-react';
import { useTTS } from './hooks/useTTS';
import { usePremiumTTS } from './hooks/usePremiumTTS';
import { useEmotionEngine } from './hooks/useEmotionEngine';
import { useSettings } from './hooks/useSettings';
import SetupScreen from './components/SetupScreen';
import EmotionWheel from './components/EmotionWheel';
import PlayerControls from './components/PlayerControls';
import QuickPhrases from './components/QuickPhrases';
import Recorder from './components/Recorder';
import ManualControls from './components/ManualControls';
import './index.css';

export default function App() {
  const settingsStore = useSettings();
  const { voices, speak, pause, resume, stop, isPlaying, isPaused } = useTTS();
  const premiumTTS = usePremiumTTS();
  const { getEmotionSettings, applyTextModifiers } = useEmotionEngine();

  // Carrega configurações salvas
  const [savedSettings, setSavedSettings] = useState(() => settingsStore.load());
  const [isDark, setIsDark] = useState(savedSettings.isDark ?? false);
  const [showSetup, setShowSetup] = useState(() => !savedSettings.setupDone);
  
  // Estado Modo Automático / Roleta
  const [selectedEmotion, setSelectedEmotion] = useState(savedSettings.selectedEmotion || 'neutro');
  const [intensity, setIntensity] = useState(savedSettings.intensity || 'moderada');
  const [text, setText] = useState('');

  // Estado Modo Manual Especialista
  const [isManualMode, setIsManualMode] = useState(savedSettings.isManualMode || false);
  const [manualPitch, setManualPitch] = useState(savedSettings.manualPitch ?? 1.0);
  const [manualRate, setManualRate] = useState(savedSettings.manualRate ?? 1.0);
  const [manualVolume, setManualVolume] = useState(savedSettings.manualVolume ?? 1.0);

  // ─── ALTA PERSISTÊNCIA ───
  // Salva dinamicamente qualquer mudança dos controles no aparelho do usuário
  useEffect(() => {
    if (!savedSettings.setupDone) return; // Não salvar estados voláteis durante o Wizard
    settingsStore.save({
      isDark, selectedEmotion, intensity, isManualMode,
      manualPitch, manualRate, manualVolume,
      usePremiumVoice: savedSettings.usePremiumVoice,
      customVoiceId: savedSettings.customVoiceId
    });
  }, [isDark, selectedEmotion, intensity, isManualMode, manualPitch, manualRate, manualVolume, savedSettings.usePremiumVoice, savedSettings.customVoiceId, savedSettings.setupDone]);

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
    const isPremium = savedSettings.usePremiumVoice;
    
    if (isPremium) {
      if (premiumTTS.isPlaying) { premiumTTS.pause(); return; }
      if (premiumTTS.isPaused) { premiumTTS.resume(); return; }
      if (!text.trim()) return;
      premiumTTS.speak(text, savedSettings.customVoiceId);
      return;
    }

    if (isPlaying && !isPaused) {
      pause();
    } else if (isPlaying && isPaused) {
      resume();
    } else {
      if (!text.trim()) return;
      const { style } = savedSettings;
      let p_pitch = manualPitch, p_rate = manualRate, p_vol = manualVolume;
      let finalEmotion = 'neutro';
      if (!isManualMode) {
        const params = getEmotionSettings(selectedEmotion, intensity, style);
        p_pitch = params.pitch; p_rate = params.rate; p_vol = params.volume;
        finalEmotion = selectedEmotion;
      }
      const modifiedText = applyTextModifiers(text, finalEmotion, style);
      speak(modifiedText, selectedVoice.current, p_pitch, p_rate, p_vol);
    }
  };

  // Fala imediatamente ao tocar em frase rápida
  const handleQuickSpeak = (phraseText) => {
    if (!phraseText.trim()) return;
    setText(phraseText);
    
    if (savedSettings.usePremiumVoice) {
      premiumTTS.speak(phraseText, savedSettings.customVoiceId);
      return;
    }

    const { style } = savedSettings;
    let p_pitch = manualPitch, p_rate = manualRate, p_vol = manualVolume;
    let finalEmotion = 'neutro';
    if (!isManualMode) {
      const params = getEmotionSettings(selectedEmotion, intensity, style);
      p_pitch = params.pitch; p_rate = params.rate; p_vol = params.volume;
      finalEmotion = selectedEmotion;
    }
    const modifiedText = applyTextModifiers(phraseText, finalEmotion, style);
    speak(modifiedText, selectedVoice.current, p_pitch, p_rate, p_vol);
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
          {/* Chip de voz ativa: clicável para abrir o Wizard rapidamente */}
          <button
            className="voice-chip"
            onClick={() => setShowSetup(true)}
            title="Configurar voz"
          >
            <Settings size={14} />
            <span>{savedSettings.gender === 'male' ? 'Masculino' : savedSettings.gender === 'all' ? 'Auto' : 'Feminino'}</span>
          </button>
          <button className="icon-action-btn" onClick={() => setIsDark(p => !p)} title={isDark ? 'Modo Claro' : 'Modo Escuro'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main>
        {/* Controle Híbrido: Roleta vs Manual */}
        <section className="glass-panel hybrid-section">
          <div className="mode-toggle">
            <button 
              className={`toggle-btn ${!isManualMode ? 'active' : ''}`}
              onClick={() => setIsManualMode(false)}
            >
              Automático
            </button>
            <button 
              className={`toggle-btn ${isManualMode ? 'active' : ''}`}
              onClick={() => setIsManualMode(true)}
            >
              Manual
            </button>
          </div>

          {!isManualMode ? (
            <div className="carousel-section-inner">
              <label>Emoção Mapeada</label>
              <EmotionWheel selectedEmotion={selectedEmotion} onSelect={setSelectedEmotion} />
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
            </div>
          ) : (
            <div className="manual-section-inner">
               <ManualControls 
                  pitch={manualPitch} setPitch={setManualPitch}
                  rate={manualRate} setRate={setManualRate}
                  volume={manualVolume} setVolume={setManualVolume}
               />
            </div>
          )}
        </section>

        {/* Frases Rápidas */}
        <QuickPhrases onSpeak={handleQuickSpeak} />

        {/* Área de texto livre */}
        <section className="text-section glass-panel">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Ou digite aqui o que deseja ouvir..."
            rows={4}
          />
        </section>

        {/* Player */}
        <PlayerControls
          isPlaying={isPlaying}
          isPaused={isPaused}
          onPlayPause={handlePlayPause}
          onStop={stop}
        />

        {/* Gravador de Voz */}
        <Recorder />
      </main>
    </div>
  );
}
