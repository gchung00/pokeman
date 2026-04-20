import { useState, useEffect, useMemo } from 'react';
import { ADVANCED_VOCAB } from '../words';

const nameCache = {};

const pseudoRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

function GalleryEntity({ pokemon, index, isActive, onSelect, battlePickMode }) {
  const { id } = pokemon;
  const [name, setName] = useState(nameCache[id] || '');
  const [showSpeech, setShowSpeech] = useState(false);

  useEffect(() => {
    if (nameCache[id]) { setName(nameCache[id]); return; }
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(r => r.json())
      .then(data => {
        const n = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        nameCache[id] = n;
        setName(n);
      })
      .catch(() => {});
  }, [id]);

  const entityData = useMemo(() => {
    // Increase scattering for a more 'free' feel
    const randomRange = (min, max, s) => min + pseudoRandom(s) * (max - min);
    
    // Wider horizontal and vertical distribution
    const top = randomRange(28, 75, id + index);
    const left = randomRange(5, 85, id * 2 + index);
    const scaleX = pseudoRandom(id * 3 + index) > 0.5 ? -1 : 1;
    
    // Scale slightly based on 'depth' (top position)
    const baseScale = 0.55 + (top / 100) * 0.9;
    
    const wordIdx = Math.floor(pseudoRandom(id * 4 + index) * ADVANCED_VOCAB.length);
    const speechWord = ADVANCED_VOCAB[wordIdx].word;
    const floatDelay = pseudoRandom(id * 5 + index) * 2;
    
    return { top, left, scaleX, baseScale, speechWord, floatDelay };
  }, [id, index]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > (battlePickMode ? 0.3 : 0.7)) {
        setShowSpeech(true);
        setTimeout(() => setShowSpeech(false), 2500);
      }
    }, battlePickMode ? 2500 + pseudoRandom(id) * 2000 : 5000 + pseudoRandom(id) * 5000);
    return () => clearInterval(interval);
  }, [id, battlePickMode]);

  return (
    <div
      className={`pokemon-entity ${isActive ? 'active-entity' : ''} ${battlePickMode ? 'battle-beg-wrap' : ''}`}
      onClick={() => onSelect(id)}
      style={{
        top: `${entityData.top}%`,
        left: `${entityData.left}%`,
        zIndex: Math.floor(entityData.top),
        animationDelay: `${entityData.floatDelay}s`
      }}
    >
      <div className="entity-name-tag">
        {isActive && <span style={{ color: '#ffd700' }}>★ </span>}
        {name || '...'}
      </div>

      {/* In battle-pick mode show NOTHING, else show word */}
      {!battlePickMode && (
        <div className={`speech-bubble ${showSpeech ? 'visible' : ''}`}>
          {entityData.speechWord}
        </div>
      )}

      <img
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`}
        alt={name}
        className="entity-sprite"
        style={{
          transform: `scaleX(${entityData.scaleX}) scale(${isActive ? entityData.baseScale * 1.2 : entityData.baseScale})`,
          filter: isActive ? 'drop-shadow(0 0 12px #ffd700)' : 'none',
          animationDelay: `${entityData.floatDelay}s`
        }}
      />
      <div className="entity-shadow" style={{ transform: `scale(${entityData.baseScale})` }} />
    </div>
  );
}

export default function Gallery({ inventory, activeId, onSelect, onClose, onPickForBattle }) {
  const battlePickMode = !!onPickForBattle;

  const handleSelect = (id) => {
    onSelect(id); // always update active
    if (battlePickMode) onPickForBattle(id);
  };

  return (
    <div className="gallery-land-overlay">
      <div className={`gallery-header land-header ${battlePickMode ? 'battle-pick-header' : ''}`}>
        {battlePickMode ? (
          <>
            <h2 className="battle-pick-title">⚔️ Choose Your Fighter!</h2>
            <p className="battle-pick-sub">Tap a Pokémon — they're begging to battle for you!</p>
          </>
        ) : (
          <>
            <button className="backs-btn" onClick={onClose}>← EXIT SANCTUARY</button>
            <h2 style={{ color: 'white', textShadow: '2px 2px 0 #000' }}>
              SANCTUARY ({inventory.length})
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '5px 20px' }}>
              Tap a Pokémon to set it as your ACTIVE BATTLER
            </p>
          </>
        )}
      </div>

      <div className="park-landscape">
        {inventory.length === 0 ? (
          <div className="empty-message land-empty">Your sanctuary is empty. Go catch some Pokémon!</div>
        ) : (
          inventory.map((pokemon, index) => (
            <GalleryEntity
              key={`${pokemon.id}-${index}`}
              pokemon={pokemon}
              index={index}
              isActive={pokemon.id === activeId}
              onSelect={handleSelect}
              battlePickMode={battlePickMode}
            />
          ))
        )}
      </div>
    </div>
  );
}
