import { useState, useEffect, useMemo } from 'react';
import { getPokemonInfo } from '../lib/pokemonData';
import { getPokemonSprite } from '../lib/pokeapi';

const RARITY_ORDER = { legendary: 4, 'ultra-rare': 3, rare: 2, common: 1 };
const RARITY_LABEL = {
  legendary:   { text: 'LEGENDARY', color: '#a78bfa' },
  'ultra-rare':{ text: 'ULTRA RARE', color: '#f59e0b' },
  rare:        { text: 'RARE',       color: '#60a5fa' },
  common:      { text: 'COMMON',     color: '#9ca3af' },
};
const TYPE_COLOR = {
  fire:'#FF4500', water:'#3498DB', grass:'#2ECC71', electric:'#F1C40F',
  psychic:'#9B59B6', normal:'#95A5A6', poison:'#8E44AD', ground:'#D35400',
  rock:'#7F8C8D', ice:'#00CED1', ghost:'#34495E', dragon:'#8E44AD',
  bug:'#16A085', fighting:'#C0392B', fairy:'#FF69B4', dark:'#2C3E50', steel:'#808080',
};

const nameCache = {};

function FighterCard({ pokemon, isSelected, onSelect }) {
  const { id } = pokemon;
  const info = getPokemonInfo(id);
  const [name, setName] = useState(nameCache[id] || '');

  useEffect(() => {
    if (nameCache[id]) { setName(nameCache[id]); return; }
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(r => r.json())
      .then(d => { const n = d.name.charAt(0).toUpperCase() + d.name.slice(1); nameCache[id] = n; setName(n); })
      .catch(() => {});
  }, [id]);

  const rarity = RARITY_LABEL[info.rarity] || RARITY_LABEL.common;
  const typeColor = TYPE_COLOR[info.type] || '#9ca3af';

  return (
    <div
      className={`fc-card${isSelected ? ' fc-card--selected' : ''}`}
      onClick={() => onSelect(id)}
    >
      <div className="fc-sprite-wrap" style={{ borderColor: isSelected ? '#FFD700' : typeColor }}>
        <img src={getPokemonSprite(id)} alt={name} className="fc-sprite" />
      </div>

      <div className="fc-info">
        <div className="fc-name">{name || `#${id}`}</div>
        <div className="fc-badges">
          <span className="fc-type-badge" style={{ background: typeColor }}>{info.type}</span>
          <span className="fc-rarity-badge" style={{ color: rarity.color }}>{rarity.text}</span>
        </div>
        <div className="fc-hp-row">
          <span className="fc-hp-label">HP</span>
          <div className="fc-hp-track">
            <div
              className="fc-hp-fill"
              style={{
                width: `${Math.min(100, (info.hp / 150) * 100)}%`,
                background: info.hp >= 100 ? '#a78bfa' : info.hp >= 70 ? '#60a5fa' : '#2ecc71',
              }}
            />
          </div>
          <span className="fc-hp-val">{info.hp}</span>
        </div>
        <div className="fc-atk">⚔️ {info.attack} · {info.attackDamage} dmg</div>
      </div>

      {isSelected && <div className="fc-selected-badge">✓</div>}
    </div>
  );
}

export default function FighterSelect({ inventory, activeId, onBack, onPickForBattle }) {
  const [selectedId, setSelectedId] = useState(activeId);

  const sorted = useMemo(() => {
    return [...inventory].sort((a, b) => {
      const aInfo = getPokemonInfo(a.id);
      const bInfo = getPokemonInfo(b.id);
      const rd = (RARITY_ORDER[bInfo.rarity] || 0) - (RARITY_ORDER[aInfo.rarity] || 0);
      return rd !== 0 ? rd : bInfo.hp - aInfo.hp;
    });
  }, [inventory]);

  const handleConfirm = () => {
    onPickForBattle(selectedId);
  };

  return (
    <div className="fc-overlay">
      <div className="fc-header">
        <button className="fc-back-btn" onClick={onBack}>← Back</button>
        <h2 className="fc-title">⚔️ Choose Your Fighter!</h2>
        <p className="fc-sub">Sorted strongest first — tap to select</p>
      </div>

      <div className="fc-list">
        {sorted.map(p => (
          <FighterCard
            key={`${p.id}-${p.caughtDate}`}
            pokemon={p}
            isSelected={p.id === selectedId}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      <div className="fc-confirm-row">
        <button className="fc-confirm-btn" onClick={handleConfirm} disabled={!selectedId}>
          BATTLE! ⚔️
        </button>
      </div>
    </div>
  );
}
