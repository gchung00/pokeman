import { useState, useEffect, useMemo } from 'react';
import { ADVANCED_VOCAB } from '../words';

// 같은 ID 중복 fetch 방지용 세션 캐시
const nameCache = {};

// Helper to get pseudo-random number from an ID
const pseudoRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

function GalleryEntity({ id, index }) {
  const [name, setName] = useState(nameCache[id] || '');
  const [showSpeech, setShowSpeech] = useState(false);

  useEffect(() => {
    if (nameCache[id]) {
      setName(nameCache[id]);
      return;
    }
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(r => r.json())
      .then(data => {
        const n = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        nameCache[id] = n;
        setName(n);
      })
      .catch(() => {});
  }, [id]);

  // Calculate position using a loose grid based on index to prevent clustering
  const entityData = useMemo(() => {
    const cols = 4; // 4 items per row
    const col = index % cols;
    const row = Math.floor(index / cols);

    // Distribute columns from 10% to 80%
    const colWidth = 70 / cols;
    const leftBase = 10 + (col * colWidth);
    
    // Distribute rows starting from 30% downwards
    const rowHeight = 15;
    const topBase = 30 + (row * rowHeight);

    // Add pseudo-random offset within the grid cell
    const top = topBase + (pseudoRandom(id) * 10);
    const left = leftBase + (pseudoRandom(id * 2) * 15);
    
    // Scale X to flip roughly half of them
    const scaleX = pseudoRandom(id * 3) > 0.5 ? -1 : 1;
    // Base scale based on Y position (closer = bigger)
    const baseScale = 0.6 + (top / 100) * 0.8; 
    
    // Pick a random word
    const wordIdx = Math.floor(pseudoRandom(id * 4) * ADVANCED_VOCAB.length);
    const speechWord = ADVANCED_VOCAB[wordIdx].word;

    // Random animation delay
    const floatDelay = pseudoRandom(id * 5) * 2;

    return { top, left, scaleX, baseScale, speechWord, floatDelay };
  }, [id]);

  // Occasional random speech bubble popup
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
         setShowSpeech(true);
         setTimeout(() => setShowSpeech(false), 3000);
      }
    }, 4000 + pseudoRandom(id) * 4000); // Check every 4-8 secs
    return () => clearInterval(interval);
  }, [id]);

  return (
    <div 
      className="pokemon-entity"
      style={{
        top: `${entityData.top}%`,
        left: `${entityData.left}%`,
        zIndex: Math.floor(entityData.top) // Higher Y = closer = higher zIndex
      }}
    >
      {/* Tooltip Name */}
      <div className="entity-name-tag">{name || '...'}</div>

      {/* Speech Bubble */}
      <div className={`speech-bubble ${showSpeech ? 'visible' : ''}`}>
        {entityData.speechWord}
      </div>

      <img
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`}
        alt={name || 'pokemon'}
        className="entity-sprite"
        style={{
          transform: `scaleX(${entityData.scaleX}) scale(${entityData.baseScale})`,
          animationDelay: `${entityData.floatDelay}s`
        }}
      />
      <div className="entity-shadow" style={{ transform: `scale(${entityData.baseScale})` }}></div>
    </div>
  );
}

export default function Gallery({ caughtIds, onClose }) {
  // Use unique IDs only so they don't spawn multiple times in the same spot,
  // or add a secondary seed. If they catch 5 Pidgeys, let's scatter them.
  // We can pass index as part of seed if needed later, but ID works for now.
  
  return (
    <div className="gallery-land-overlay">
      <div className="gallery-header land-header">
        <button className="close-btn" onClick={onClose}>← Close</button>
        <h2 style={{color: 'white', textShadow: '2px 2px 0 #000'}}>Pokémon Sanctuary ({caughtIds.length})</h2>
      </div>

      <div className="park-landscape">
        {caughtIds.length === 0 ? (
          <div className="empty-message land-empty">Your sanctuary is empty. Go catch some Pokémon!</div>
        ) : (
          caughtIds.map((id, index) => (
            // Combine ID and index to allow multiples of the same pokemon in different spots
            <GalleryEntity key={`${id}-${index}`} id={id} index={index} />
          ))
        )}
      </div>
    </div>
  );
}
