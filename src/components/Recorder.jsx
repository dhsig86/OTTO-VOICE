import { Mic, MicOff, Download, Trash2, Play } from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';

export default function Recorder() {
  const {
    isRecording, duration, audioUrl, error,
    start, stop, download, discard, formatDuration
  } = useRecorder();

  return (
    <div className="recorder-panel glass-panel">
      <label>🎙️ Gravador de Voz</label>

      {error && <p className="recorder-error">{error}</p>}

      <div className="recorder-controls">
        {/* Botão Gravar / Parar */}
        {!isRecording ? (
          <button
            className="rec-btn rec-start"
            onClick={start}
            disabled={!!audioUrl}
            title="Iniciar gravação"
          >
            <Mic size={20} />
            <span>{audioUrl ? 'Gravado' : 'Gravar'}</span>
          </button>
        ) : (
          <button
            className="rec-btn rec-stop"
            onClick={stop}
            title="Parar gravação"
          >
            <MicOff size={20} />
            <span>Parar</span>
          </button>
        )}

        {/* Cronômetro */}
        <div className={`rec-timer${isRecording ? ' active' : ''}`}>
          {isRecording && <span className="rec-dot" />}
          {formatDuration(duration)}
        </div>

        {/* Reprodução, download e descartar */}
        {audioUrl && (
          <div className="rec-playback">
            <audio controls src={audioUrl} className="rec-audio" />
            <div className="rec-actions">
              <button className="rec-action-btn download" onClick={download} title="Baixar">
                <Download size={16} />
                <span>Baixar</span>
              </button>
              <button className="rec-action-btn discard" onClick={discard} title="Descartar">
                <Trash2 size={16} />
                <span>Descartar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="recorder-hint">
        {isRecording
          ? 'Gravando... Fale agora e toque em Parar quando terminar.'
          : audioUrl
          ? 'Gravação pronta. Ouça, baixe ou descarte.'
          : 'Registre sua voz reabilitada. O áudio fica salvo no seu aparelho.'}
      </p>
    </div>
  );
}
