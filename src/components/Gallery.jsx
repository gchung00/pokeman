import { useState, useEffect, useMemo, useRef } from 'react';
import { ADVANCED_VOCAB } from '../words';
import { getPokemonSprite } from '../lib/pokeapi';

const nameCache = {};

const pseudoRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const PAGE_SIZE = 12;

function GalleryEntity({ pokemon, index, isActive, onSelect, battlePickMode, onMove }) {
  const { id, x: savedX, y: savedY, caughtDate } = pokemon;
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
    const randomRange = (min, max, s) => min + pseudoRandom(s) * (max - min);

    const top = savedY !== undefined ? savedY : randomRange(28, 75, id + index);
    const left = savedX !== undefined ? savedX : randomRange(5, 85, id * 2 + index);
    const scaleX = pseudoRandom(id * 3 + index) > 0.5 ? -1 : 1;
    const baseScale = 0.55 + (top / 100) * 0.9;

    const wordIdx = Math.floor(pseudoRandom(id * 4 + index) * ADVANCED_VOCAB.length);
    const speechWord = ADVANCED_VOCAB[wordIdx].word;
    const floatDelay = pseudoRandom(id * 5 + index) * 2;

    return { top, left, scaleX, baseScale, speechWord, floatDelay };
  }, [id, index, savedX, savedY]);

  const [position, setPosition] = useState({ x: entityData.left, y: entityData.top });
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartRef = useRef(null);

  useEffect(() => {
    setPosition({ x: entityData.left, y: entityData.top });
  }, [entityData.left, entityData.top]);

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
      moved: false
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !pointerStartRef.current) return;
    const parent = e.target.closest('.park-landscape');
    if (!parent) return;

    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      pointerStartRef.current.moved = true;
    }

    if (pointerStartRef.current.moved) {
      const rect = parent.getBoundingClientRect();
      const percentX = (deltaX / rect.width) * 100;
      const percentY = (deltaY / rect.height) * 100;
      setPosition({
        x: Math.max(0, Math.min(100, pointerStartRef.current.startPosX + percentX)),
        y: Math.max(0, Math.min(100, pointerStartRef.current.startPosY + percentY))
      });
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      e.target.releasePointerCapture(e.pointerId);
      if (pointerStartRef.current && pointerStartRef.current.moved) {
        if (onMove) onMove(id, caughtDate, position.x, position.y);
      } else {
        onSelect(id);
      }
    }
  };

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        top: `${position.y}%`,
        left: `${position.x}%`,
        zIndex: Math.floor(position.y) + (isDragging ? 1000 : 0),
        animationDelay: `${entityData.floatDelay}s`,
        cursor: isDragging ? 'grabbing' : 'pointer',
        touchAction: 'none'
      }}
    >
      <div className="entity-name-tag">
        {isActive && <span style={{ color: '#ffd700' }}>★ </span>}
        {name || '...'}
      </div>

      {!battlePickMode && (
        <div className={`speech-bubble ${showSpeech ? 'visible' : ''}`}>
          {entityData.speechWord}
        </div>
      )}

      <img
        src={getPokemonSprite(id)}
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

export default function Gallery({ inventory, activeId, onSelect, onClose, onPickForBattle, onMovePokemon }) {
  const battlePickMode = !!onPickForBattle;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(inventory.length / PAGE_SIZE);

  // Clamp page if inventory shrinks (e.g. after spending a Pokémon as hint)
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const visibleInventory = inventory.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleSelect = (id) => {
    onSelect(id);
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
          visibleInventory.map((pokemon, index) => (
            <GalleryEntity
              key={`${pokemon.id}-${pokemon.caughtDate || index}`}
              pokemon={pokemon}
              index={safePage * PAGE_SIZE + index}
              isActive={pokemon.id === activeId}
              onSelect={handleSelect}
              battlePickMode={battlePickMode}
              onMove={onMovePokemon}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="gallery-pagination">
          <button
            className="gallery-page-btn"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0}
          >
            ◀
          </button>
          <span className="gallery-page-label">
            {safePage + 1} / {totalPages}
          </span>
          <button
            className="gallery-page-btn"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage === totalPages - 1}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}
