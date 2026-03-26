import { useState } from 'react';

const STEPS = [
  {
    id: 'voz',
    title: 'Como você quer soar?',
    subtitle: 'Escolha o perfil de voz que mais combina com você.',
  },
  {
    id: 'estilo',
    title: 'Como você costuma falar?',
    subtitle: 'Isso ajusta o ritmo e a cadência da fala.',
  },
  {
    id: 'intensidade',
    title: 'Como quer que as emoções soem?',
    subtitle: 'Define o quanto cada emoção vai variar a voz.',
  },
  {
    id: 'motor',
    title: 'Voz Ultra-Realista (Premium)',
    subtitle: 'Ative se você clonou sua voz na ElevenLabs.',
  }
];

export default function SetupScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState({
    gender: 'female',
    lang: 'pt',
    style: 'casual',
    intensity: 'moderada',
    usePremiumVoice: false,
    customVoiceId: '',
  });

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else onComplete(settings);
  };

  const back = () => setStep(s => s - 1);

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        {/* Progress dots */}
        <div className="setup-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`setup-dot${i === step ? ' active' : i < step ? ' done' : ''}`} />
          ))}
        </div>

        <div className="setup-content">
          <h2>{STEPS[step].title}</h2>
          <p className="setup-subtitle">{STEPS[step].subtitle}</p>

          {/* Passo 1: Voz */}
          {step === 0 && (
            <div className="setup-options">
              {[
                { value: 'female', icon: '👩', label: 'Feminina' },
                { value: 'male',   icon: '👨', label: 'Masculina' },
                { value: 'all',    icon: '🤖', label: 'Automática' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`setup-option-btn${settings.gender === opt.value ? ' selected' : ''}`}
                  onClick={() => update('gender', opt.value)}
                >
                  <span className="opt-icon">{opt.icon}</span>
                  <span className="opt-label">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Passo 2: Estilo */}
          {step === 1 && (
            <div className="setup-options">
              {[
                { value: 'formal',    icon: '🎩', label: 'Formal',    desc: 'Pausado e claro' },
                { value: 'casual',    icon: '😊', label: 'Casual',    desc: 'Natural e fluente' },
                { value: 'narrativo', icon: '📖', label: 'Narrativo', desc: 'Expressivo e dramático' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`setup-option-btn${settings.style === opt.value ? ' selected' : ''}`}
                  onClick={() => update('style', opt.value)}
                >
                  <span className="opt-icon">{opt.icon}</span>
                  <span className="opt-label">{opt.label}</span>
                  <span className="opt-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Passo 3: Intensidade */}
          {step === 2 && (
            <div className="setup-options">
              {[
                { value: 'suave',    icon: '🌿', label: 'Suave',    desc: 'Mudanças discretas' },
                { value: 'moderada', icon: '🎭', label: 'Moderada', desc: 'Equilíbrio ideal' },
                { value: 'intensa',  icon: '🔥', label: 'Intensa',  desc: 'Muito expressivo' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`setup-option-btn${settings.intensity === opt.value ? ' selected' : ''}`}
                  onClick={() => update('intensity', opt.value)}
                >
                  <span className="opt-icon">{opt.icon}</span>
                  <span className="opt-label">{opt.label}</span>
                  <span className="opt-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Passo 4: Motor Premium (ElevenLabs) */}
          {step === 3 && (
            <div className="setup-premium">
              <label className="toggle-label">
                <input 
                  type="checkbox" 
                  checked={settings.usePremiumVoice} 
                  onChange={e => update('usePremiumVoice', e.target.checked)} 
                />
                <span className="toggle-text">
                  <strong>Ativar Voz Premium (ElevenLabs)</strong>
                  Ative apenas se você colou sua API Key segura no backend da Vercel. Uso de internet obrigatório.
                </span>
              </label>

              {settings.usePremiumVoice && (
                <div className="custom-voice-id-wrap">
                  <label>ID da Voz (Seu Clone ou Voz Exclusiva)</label>
                  <input
                    type="text"
                    value={settings.customVoiceId}
                    onChange={e => update('customVoiceId', e.target.value)}
                    placeholder="Ex: 21m00Tcm4TlvDq8ikWAM"
                  />
                  <p className="voice-tip">Se vazio, usará a voz Rachel (Exemplo Hi-Fi Padrão).</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="setup-actions">
          {step > 0 && (
            <button className="setup-back-btn" onClick={back}>← Voltar</button>
          )}
          <button className="setup-next-btn" onClick={next}>
            {step < STEPS.length - 1 ? 'Próximo →' : '✓ Começar'}
          </button>
        </div>
      </div>
    </div>
  );
}
