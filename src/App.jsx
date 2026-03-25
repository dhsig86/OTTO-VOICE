import { useState, useEffect } from 'react';
import { Play, Pause, Square, Dices, User, UserX } from 'lucide-react';
import { useTTS } from './hooks/useTTS';
import { useEmotionEngine } from './hooks/useEmotionEngine';
import './index.css';

export default function App() {
  const { voices, speak, pause, resume, stop, isPlaying, isPaused } = useTTS();
  const { EMOTIONS, getEmotionSettings, getRandomEmotion, applyTextModifiers } = useEmotionEngine();

  const [text, setText] = useState('Olá! Este é um teste do incrível motor de texto para fala. Como você está se sentindo hoje?');
  const [selectedVoiceObj, setSelectedVoiceObj] = useState(null);
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedEmotion, setSelectedEmotion] = useState('neutro');

  // Seleciona a melhor voz nativa assim que as vozes estiverem carregadas
  useEffect(() => {
    if (voices.length > 0 && !selectedVoiceObj) {
      setSelectedVoiceObj(voices[0]);
    }
  }, [voices, selectedVoiceObj]);

  const filteredVoices = voices.filter(v => {
    if (selectedGender === 'all') return true;
    return v.gender === selectedGender;
  });

  const handlePlayPause = () => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPlaying && isPaused) {
      resume();
    } else {
      const emotionValues = getEmotionSettings(selectedEmotion);
      const modifiedText = applyTextModifiers(text, selectedEmotion);
      speak(modifiedText, selectedVoiceObj, emotionValues.pitch, emotionValues.rate);
    }
  };

  const handleRandomEmotion = () => {
    const random = getRandomEmotion();
    setSelectedEmotion(random);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>OTTO <span>Voice</span></h1>
        <p>Motor de Síntese Vocal Emocional Baseado no Navegador</p>
      </header>
      
      <main className="main-content">
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
            <label>Selecione a Voz ({filteredVoices.length} disponíveis)</label>
            <select 
              value={selectedVoiceObj ? selectedVoiceObj.name : ''}
              onChange={(e) => {
                const v = voices.find(voice => voice.name === e.target.value);
                setSelectedVoiceObj(v);
              }}
              className="voice-select"
            >
              {filteredVoices.map((v, i) => (
                <option key={i} value={v.name}>
                  {v.name} {v.isPremium ? '✨ (Natural)' : ''}
                </option>
              ))}
            </select>
          </div>

        </section>

        {/* Roleta de Emoções */}
        <section className="emotions-section glass-panel">
          <div className="emotions-header">
            <label>Roleta Emocional</label>
            <button className="icon-btn random-btn" onClick={handleRandomEmotion} title="Emoção Aleatória">
              <Dices size={18} /> Sortear Humor
            </button>
          </div>
          <div className="emotions-grid">
            {Object.keys(EMOTIONS).map(key => {
              const emote = EMOTIONS[key];
              const isActive = selectedEmotion === key;
              return (
                <button
                  key={key}
                  className={`emotion-btn ${isActive ? 'active' : ''}`}
                  style={{ '--emote-color': emote.color }}
                  onClick={() => setSelectedEmotion(key)}
                >
                  {emote.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Area de Texto */}
        <section className="text-section glass-panel">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite aqui o que deseja que eu fale..."
          />
        </section>

        {/* Player Controls */}
        <section className="player-controls">
          <button className={`play-btn ${isPlaying && !isPaused ? 'playing' : ''}`} onClick={handlePlayPause}>
            {isPlaying && !isPaused ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button className="stop-btn" onClick={stop} disabled={!isPlaying}>
            <Square size={20} />
          </button>
        </section>
      </main>
    </div>
  );
}
