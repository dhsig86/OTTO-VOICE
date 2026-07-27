import { AlertTriangle } from 'lucide-react';

export default function EmergencyButton({ onTriggerEmergency }) {
  const handleEmergency = () => {
    // 1. Play alert chime using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }

    // 2. Trigger high priority emergency TTS
    if (onTriggerEmergency) {
      onTriggerEmergency('SOCORRO! Preciso de ajuda urgente! Estou com dor intensa!');
    }
  };

  return (
    <div className="emergency-button-container my-3">
      <button
        onClick={handleEmergency}
        className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-base tracking-wide transition-all border-2 border-red-400 animate-pulse"
        style={{
          backgroundColor: '#dc2626',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '14px 16px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          cursor: 'pointer',
          border: '2px solid #f87171',
          boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
        }}
      >
        <AlertTriangle size={22} />
        <span>🚨 SOCORRO / AJUDA URGENTE</span>
      </button>
    </div>
  );
}
