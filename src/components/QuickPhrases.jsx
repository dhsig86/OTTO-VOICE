import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { usePhrases, PRESET_PHRASES } from '../hooks/usePhrases';

export default function QuickPhrases({ onSpeak }) {
  const { load, addPhrase, removePhrase } = usePhrases();

  const [favorites, setFavorites] = useState(() => load());
  const [openSections, setOpenSections] = useState({ saudacoes: true, clinicas: false, favoritas: true });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState('');

  const toggleSection = (key) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handlePhraseClick = (text) => {
    onSpeak(text);
  };

  const handleAdd = () => {
    if (!newText.trim()) return;
    const added = addPhrase(newText);
    setFavorites(prev => [...prev, added]);
    setNewText('');
    setShowAddModal(false);
  };

  const handleRemove = (id) => {
    const updated = removePhrase(id);
    setFavorites(updated);
  };

  const Section = ({ sectionKey, label, icon, phrases, removable }) => {
    const isOpen = openSections[sectionKey];
    return (
      <div className="phrase-section">
        <button
          className="phrase-section-header"
          onClick={() => toggleSection(sectionKey)}
        >
          <span>{icon} {label}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isOpen && (
          <div className="phrase-grid">
            {phrases.map(p => (
              <div key={p.id} className="phrase-item-wrap">
                <button
                  className="phrase-btn"
                  onClick={() => handlePhraseClick(p.text)}
                >
                  {p.text}
                </button>
                {removable && (
                  <button
                    className="phrase-remove-btn"
                    onClick={() => handleRemove(p.id)}
                    title="Remover"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="quick-phrases glass-panel">
      <label>Frases Rápidas</label>

      {/* Saudações */}
      <Section
        sectionKey="saudacoes"
        label={PRESET_PHRASES.saudacoes.label}
        icon={PRESET_PHRASES.saudacoes.icon}
        phrases={PRESET_PHRASES.saudacoes.phrases}
        removable={false}
      />

      {/* Necessidades Clínicas */}
      <Section
        sectionKey="clinicas"
        label={PRESET_PHRASES.clinicas.label}
        icon={PRESET_PHRASES.clinicas.icon}
        phrases={PRESET_PHRASES.clinicas.phrases}
        removable={false}
      />

      {/* Favoritas */}
      <div className="phrase-section">
        <button
          className="phrase-section-header"
          onClick={() => toggleSection('favoritas')}
        >
          <span>⭐ Minhas Favoritas</span>
          {openSections.favoritas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {openSections.favoritas && (
          <>
            <div className="phrase-grid">
              {favorites.length === 0 && (
                <p className="phrase-empty">Toque em "+ Adicionar" para salvar suas frases.</p>
              )}
              {favorites.map(p => (
                <div key={p.id} className="phrase-item-wrap">
                  <button className="phrase-btn" onClick={() => handlePhraseClick(p.text)}>
                    {p.text}
                  </button>
                  <button className="phrase-remove-btn" onClick={() => handleRemove(p.id)} title="Remover">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="phrase-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} /> Adicionar frase
            </button>
          </>
        )}
      </div>

      {/* Modal de adição */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Nova Frase Favorita</h3>
            <textarea
              autoFocus
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Digite a frase que deseja salvar..."
              rows={3}
              className="modal-textarea"
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button className="modal-confirm" onClick={handleAdd} disabled={!newText.trim()}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
