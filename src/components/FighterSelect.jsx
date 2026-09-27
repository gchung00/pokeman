import { useState, useEffect, useMemo, useRef } from 'react';
import { getPokemonInfo } from '../lib/pokemonData';
import { getPokemonSprite } from '../lib/pokeapi';

const RARITY_ORDER = { legendary: 4, 'ultra-rare': 3, rare: 2, common: 1 };
const RARITY_COLOR = { legendary: '#c084fc', 'ultra-rare': '#f59e0b', rare: '#60a5fa', common: '#6b7280' };
const TYPE_COLOR = {
  fire:'#FF4500', water:'#3498DB', grass:'#2ECC71', electric:'#F1C40F',
  psychic:'#9B59B6', normal:'#95A5A6', poison:'#8E44AD', ground:'#D35400',
  rock:'#7F8C8D', ice:'#00CED1', ghost:'#4B0082', dragon:'#6A0DAD',
  bug:'#16A085', fighting:'#C0392B', fairy:'#FF69B4', dark:'#2C3E50', steel:'#607D8B',
};

const nameCache = {};
function useName(id) {
  const [name, setName] = useState(nameCache[id] || '');
  useEffect(() => {
    if (nameCache[id]) { setName(nameCache[id]); return; }
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(r => r.json())
      .then(d => { const n = d.name.charAt(0).toUpperCase() + d.name.slice(1); nameCache[id] = n; setName(n); })
      .catch(() => {});
  }, [id]);
  return name;
}

/* ── Showcase: top panel for the highlighted Pokémon ── */
function Showcase({ pokemon }) {
  const info     = getPokemonInfo(pokemon.id);
  const name     = useName(pokemon.id);
  const typeClr  = TYPE_COLOR[info.type] || '#9ca3af';
  const rarClr   = RARITY_COLOR[info.rarity] || '#6b7280';
  const artwork  = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;

  return (
    <div className="fsc-showcase" style={{ '--type-clr': typeClr }}>
      <div className="fsc-glow" />
      <img key={pokemon.id} src={artwork} alt={name} className="fsc-artwork" />
      <div className="fsc-info-row">
        <span className="fsc-showcase-name">{name || `#${pokemon.id}`}</span>
        <div className="fsc-showcase-pills">
          <span className="fsc-pill" style={{ background: typeClr }}>{info.type}</span>
          <span className="fsc-pill fsc-pill--outline" style={{ color: rarClr, borderColor: rarClr }}>
            {info.rarity === 'ultra-rare' ? 'ULTRA RARE' : info.rarity.toUpperCase()}
          </span>
          <span className="fsc-pill fsc-pill--stat">HP {info.hp}</span>
          <span className="fsc-pill fsc-pill--stat">⚔ {info.attackDamage}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Card in the grid ── */
function GridCard({ pokemon, isSelected, onClick }) {
  const info   = getPokemonInfo(pokemon.id);
  const name   = useName(pokemon.id);
  const rarClr = RARITY_COLOR[info.rarity] || '#6b7280';
  const typeClr = TYPE_COLOR[info.type] || '#9ca3af';

  return (
    <div
      className={`fsc-card${isSelected ? ' fsc-card--on' : ''}`}
      style={{ '--type-clr': typeClr, '--rar-clr': rarClr }}
      onClick={onClick}
    >
      <div className="fsc-card-inner">
        <img src={getPokemonSprite(pokemon.id)} alt={name} className="fsc-card-sprite" />
        {isSelected && <div className="fsc-card-tick">✓</div>}
      </div>
      <div className="fsc-card-label">{name || `#${pokemon.id}`}</div>
      <div className="fsc-card-dot" />
    </div>
  );
}

/* ── Main ── */
export default function FighterSelect({ inventory, activeId, onBack, onPickForBattle }) {
  const [selectedId, setSelectedId] = useState(activeId);

  const sorted = useMemo(() => [...inventory].sort((a, b) => {
    const aI = getPokemonInfo(a.id), bI = getPokemonInfo(b.id);
    const rd = (RARITY_ORDER[bI.rarity] || 0) - (RARITY_ORDER[aI.rarity] || 0);
    return rd !== 0 ? rd : bI.hp - aI.hp;
  }), [inventory]);

  const selected = sorted.find(p => p.id === selectedId) || sorted[0];

  return (
    <div className="fsc-overlay">

      {/* Header */}
      <div className="fsc-header">
        <button className="fsc-back" onClick={onBack}>← Back</button>
        <span className="fsc-header-title">Choose Your Fighter</span>
        <span className="fsc-header-hint">Strongest first</span>
      </div>

      {/* Showcase */}
      {selected && <Showcase pokemon={selected} />}

      {/* Grid */}
      <div className="fsc-grid-wrap">
        <div className="fsc-grid">
          {sorted.map(p => (
            <GridCard
              key={`${p.id}-${p.caughtDate}`}
              pokemon={p}
              isSelected={p.id === selectedId}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </div>
      </div>

      {/* Battle button */}
      <div className="fsc-footer">
        <button className="fsc-battle-btn" onClick={() => onPickForBattle(selectedId)}>
          BATTLE! ⚔️
        </button>
      </div>
    </div>
  );
}
