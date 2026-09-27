import { useState, useEffect, useMemo, useRef } from 'react';
import { getPokemonInfo } from '../lib/pokemonData';
import { getPokemonSprite } from '../lib/pokeapi';

const RARITY_ORDER  = { legendary: 4, 'ultra-rare': 3, rare: 2, common: 1 };
const RARITY_LABEL  = {
  legendary:    { text: 'LEGENDARY',  color: '#c084fc' },
  'ultra-rare': { text: 'ULTRA RARE', color: '#f59e0b' },
  rare:         { text: 'RARE',       color: '#60a5fa' },
  common:       { text: 'COMMON',     color: '#9ca3af' },
};
const TYPE_COLOR = {
  fire:'#FF4500', water:'#3498DB', grass:'#2ECC71', electric:'#F1C40F',
  psychic:'#9B59B6', normal:'#95A5A6', poison:'#8E44AD', ground:'#D35400',
  rock:'#7F8C8D', ice:'#00CED1', ghost:'#4B0082', dragon:'#6A0DAD',
  bug:'#16A085', fighting:'#C0392B', fairy:'#FF69B4', dark:'#2C3E50', steel:'#607D8B',
};

const nameCache = {};
function usePokemonName(id) {
  const [name, setName] = useState(nameCache[id] || '');
  useEffect(() => {
    if (nameCache[id]) { setName(nameCache[id]); return; }
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(r => r.json())
      .then(d => {
        const n = d.name.charAt(0).toUpperCase() + d.name.slice(1);
        nameCache[id] = n; setName(n);
      })
      .catch(() => {});
  }, [id]);
  return name;
}

/* ── Large showcase panel for the selected Pokémon ── */
function Showcase({ pokemon }) {
  const { id } = pokemon;
  const info     = getPokemonInfo(id);
  const name     = usePokemonName(id);
  const rarity   = RARITY_LABEL[info.rarity] || RARITY_LABEL.common;
  const typeClr  = TYPE_COLOR[info.type] || '#9ca3af';
  const artwork  = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  const hpPct    = Math.min(100, (info.hp / 150) * 100);
  const hpClr    = info.hp >= 100 ? '#c084fc' : info.hp >= 70 ? '#60a5fa' : '#2ecc71';

  return (
    <div className="fsc-showcase" style={{ '--type-clr': typeClr }}>
      {/* Radial glow behind sprite */}
      <div className="fsc-glow" />

      <img
        key={id}
        src={artwork}
        alt={name}
        className="fsc-artwork"
      />

      <div className="fsc-details">
        <div className="fsc-name">{name || `#${id}`}</div>
        <div className="fsc-badges">
          <span className="fsc-type-pill" style={{ background: typeClr }}>{info.type}</span>
          <span className="fsc-rarity-pill" style={{ color: rarity.color, borderColor: rarity.color }}>
            {rarity.text}
          </span>
        </div>
        <div className="fsc-hp-row">
          <span className="fsc-stat-label">HP</span>
          <div className="fsc-hp-track">
            <div className="fsc-hp-fill" style={{ width: `${hpPct}%`, background: hpClr }} />
          </div>
          <span className="fsc-stat-val">{info.hp}</span>
        </div>
        <div className="fsc-atk-row">
          <span className="fsc-stat-label">ATK</span>
          <span className="fsc-atk-name">{info.attack}</span>
          <span className="fsc-atk-dmg" style={{ color: typeClr }}>{info.attackDamage} dmg</span>
        </div>
      </div>
    </div>
  );
}

/* ── Small card in the bottom strip ── */
function StripCard({ pokemon, isSelected, onClick }) {
  const { id } = pokemon;
  const info   = getPokemonInfo(id);
  const rarity = RARITY_LABEL[info.rarity] || RARITY_LABEL.common;
  const typeClr = TYPE_COLOR[info.type] || '#9ca3af';

  return (
    <div
      className={`fsc-card${isSelected ? ' fsc-card--selected' : ''}`}
      style={{ '--type-clr': typeClr, '--rarity-clr': rarity.color }}
      onClick={onClick}
    >
      <img src={getPokemonSprite(id)} alt="" className="fsc-card-sprite" />
      {isSelected && <div className="fsc-card-check">✓</div>}
      <div className="fsc-card-dot" style={{ background: rarity.color }} />
    </div>
  );
}

/* ── Main component ── */
export default function FighterSelect({ inventory, activeId, onBack, onPickForBattle }) {
  const [selectedId, setSelectedId] = useState(activeId);
  const stripRef = useRef(null);

  const sorted = useMemo(() => {
    return [...inventory].sort((a, b) => {
      const aI = getPokemonInfo(a.id), bI = getPokemonInfo(b.id);
      const rd = (RARITY_ORDER[bI.rarity] || 0) - (RARITY_ORDER[aI.rarity] || 0);
      return rd !== 0 ? rd : bI.hp - aI.hp;
    });
  }, [inventory]);

  const selectedPokemon = sorted.find(p => p.id === selectedId) || sorted[0];

  // Scroll selected card into view when it changes
  useEffect(() => {
    if (!stripRef.current) return;
    const idx = sorted.findIndex(p => p.id === selectedId);
    const card = stripRef.current.children[idx];
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedId]);

  return (
    <div className="fsc-overlay">
      {/* Header */}
      <div className="fsc-header">
        <button className="fsc-back" onClick={onBack}>← Back</button>
        <span className="fsc-header-title">⚔️ Choose Fighter</span>
        <span className="fsc-count">{sorted.length} Pokémon</span>
      </div>

      {/* Showcase */}
      {selectedPokemon && <Showcase pokemon={selectedPokemon} />}

      {/* Strip */}
      <div className="fsc-strip-wrap">
        <div className="fsc-strip" ref={stripRef}>
          {sorted.map(p => (
            <StripCard
              key={`${p.id}-${p.caughtDate}`}
              pokemon={p}
              isSelected={p.id === selectedId}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </div>
      </div>

      {/* Confirm */}
      <div className="fsc-footer">
        <button className="fsc-battle-btn" onClick={() => onPickForBattle(selectedId)}>
          BATTLE! ⚔️
        </button>
      </div>
    </div>
  );
}
