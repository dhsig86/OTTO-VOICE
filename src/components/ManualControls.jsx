import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function ManualControls({ pitch, setPitch, rate, setRate, volume, setVolume }) {
  return (
    <div className="manual-controls">
      <div className="manual-header">
        <SlidersHorizontal size={16} />
        <span>Ajuste Manual Especialista</span>
      </div>

      <div className="slider-group">
        <div className="slider-label-row">
          <label htmlFor="pitch-slider">Tom (Pitch)</label>
          <span className="slider-val">{pitch.toFixed(1)}</span>
        </div>
        <input
          id="pitch-slider"
          type="range"
          className="ottovox-slider"
          min="0.5"
          max="2.0"
          step="0.1"
          value={pitch}
          onChange={(e) => setPitch(parseFloat(e.target.value))}
        />
        <div className="slider-hints">
          <span>Grave</span>
          <span>Agudo</span>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label-row">
          <label htmlFor="rate-slider">Velocidade (Rate)</label>
          <span className="slider-val">{rate.toFixed(1)}</span>
        </div>
        <input
          id="rate-slider"
          type="range"
          className="ottovox-slider"
          min="0.5"
          max="2.5"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
        />
        <div className="slider-hints">
          <span>Lento</span>
          <span>Rápido</span>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label-row">
          <label htmlFor="volume-slider">Volume</label>
          <span className="slider-val">{(volume * 100).toFixed(0)}%</span>
        </div>
        <input
          id="volume-slider"
          type="range"
          className="ottovox-slider"
          min="0.0"
          max="1.0"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
        <div className="slider-hints">
          <span>Mudo</span>
          <span>Máximo</span>
        </div>
      </div>
    </div>
  );
}
