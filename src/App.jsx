import { useState, useEffect } from 'react';
import { Play, Pause, Square, Dices, Moon, Sun } from 'lucide-react';
import { useTTS } from './hooks/useTTS';
import { useEmotionEngine } from './hooks/useEmotionEngine';
import './index.css';

export default function App() {
  const { voices, speak, pause, resume, stop, isPlaying, isPaused } = useTTS();
  const { EMOTIONS, getEmotionSettings, getRandomEmotion, applyTextModifiers } = useEmotionEngine();

  const [text, setText] = useState('Olá! Sou o OTTO VOX, motor de síntese vocal emocional. Escolha uma emoção e me ouça falar!');
  const [selectedVoiceObj, setSelectedVoiceObj] = useState(null);
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedEmotion, setSelectedEmotion] = useState('neutro');
  const [isDark, setIsDark] = useState(true);

  // Aplica o tema no <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Seleciona a melhor voz assim que carregadas
  useEffect(() => {
    if (voices.length > 0 && !selectedVoiceObj) {
      setSelectedVoiceObj(voices[0]);
    }
  }, [voices, selectedVoiceObj]);

  // Quando muda gênero, seleciona a primeira voz do filtro automaticamente
  useEffect(() => {
    const filtered = voices.filter(v =>
      selectedGender === 'all' ? true : v.gender === selectedGender
    );
    if (filtered.length > 0) setSelectedVoiceObj(filtered[0]);
  }, [selectedGender, voices]);

  const filteredVoices = voices.filter(v =>
    selectedGender === 'all' ? true : v.gender === selectedGender
  );

  const handlePlayPause = () => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPlaying && isPaused) {
      resume();
    } else {
      if (!text.trim()) return;
      const emotionValues = getEmotionSettings(selectedEmotion);
      const modifiedText = applyTextModifiers(text, selectedEmotion);
      speak(modifiedText, selectedVoiceObj, emotionValues.pitch, emotionValues.rate);
    }
  };

  const handleRandomEmotion = () => {
    setSelectedEmotion(getRandomEmotion());
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">
          <h1>OTTO <span>VOX</span></h1>
          <p>Motor de Síntese Vocal Emocional</p>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setIsDark(prev => !prev)}
          title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          {isDark ? 'Claro' : 'Escuro'}
        </button>
      </header>

      <main>
        <section className="controls-grid">

          {/* Seletor de Gênero */}
          <div className="control-group glass-panel">
            <label>Filtro de Gênero</label>
            <div className="toggle-buttons">
              <button
                className={selectedGender === 'all' ? 'active' : ''}
                onClick={() => setSelectedGender('all')}
              >Todos</button>
              <button
                className={selectedGender === 'female' ? 'active female' : ''}
                onClick={() => setSelectedGender('female')}
              >Feminino</button>
              <button
                className={selectedGender === 'male' ? 'active male' : ''}
                onClick={() => setSelectedGender('male')}
              >Masculino</button>
            </div>
          </div>

          {/* Seletor de Voz */}
          <div className="control-group glass-panel">
            <label>Voz ({filteredVoices.length} disponíveis)</label>
            <select
              value={selectedVoiceObj ? selectedVoiceObj.name : ''}
              onChange={(e) => {
                const v = voices.find(voice => voice.name === e.target.value);
                if (v) setSelectedVoiceObj(v);
              }}
              className="voice-select"
            >
              {filteredVoices.length === 0
                ? <option value="">Nenhuma voz encontrada</option>
                : filteredVoices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name}{v.isPremium ? ' ✨' : ''}
                    </option>
                  ))
              }
            </select>
          </div>
        </section>

        {/* Roleta de Emoções */}
        <section className="emotions-section glass-panel">
          <div className="emotions-header">
            <label>Roleta Emocional</label>
            <button className="icon-btn" onClick={handleRandomEmotion}>
              <Dices size={15} /> Sortear
            </button>
          </div>
          <div className="emotions-grid">
            {Object.keys(EMOTIONS).map(key => {
              const emote = EMOTIONS[key];
              return (
                <button
                  key={key}
                  className={`emotion-btn${selectedEmotion === key ? ' active' : ''}`}
                  style={{ '--emote-color': emote.color }}
                  onClick={() => setSelectedEmotion(key)}
                >
                  {emote.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Área de Texto */}
        <section className="text-section glass-panel">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite aqui o que deseja que eu fale..."
          />
        </section>

        {/* Player */}
        <section className="player-controls">
          <button
            className={`play-btn${isPlaying && !isPaused ? ' playing' : ''}`}
            onClick={handlePlayPause}
          >
            {isPlaying && !isPaused ? <Pause size={26} /> : <Play size={26} />}
          </button>
          <button className="stop-btn" onClick={stop} disabled={!isPlaying}>
            <Square size={18} />
          </button>
        </section>
      </main>
    </div>
  );
}
