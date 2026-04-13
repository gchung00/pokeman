import { useState, useEffect } from 'react';

// 같은 ID 중복 fetch 방지용 세션 캐시
const nameCache = {};

function GalleryCard({ id }) {
  const [name, setName] = useState(nameCache[id] || '');

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

  return (
    <div className="gallery-card">
      <div className="id-tag">#{id.toString().padStart(3, '0')}</div>
      <img
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`}
        alt={name || 'pokemon'}
        className="gallery-pokemon-img"
      />
      <div className="card-shine"></div>
      <div className="pokemon-name-overlay">{name || '...'}</div>
    </div>
  );
}

export default function Gallery({ caughtIds, onClose }) {
  const displayList = [...caughtIds].reverse();

  return (
    <div className="gallery-overlay">
      <div className="gallery-header">
        <button className="close-btn" onClick={onClose}>← Close</button>
        <h2>My Pokémon Collection ({caughtIds.length})</h2>
      </div>

      <div className="gallery-grid">
        {displayList.length === 0 ? (
          <div className="empty-message">잡은 포켓몬이 아직 없어요! 로켓단을 물리치고 포켓몬을 구해주세요!</div>
        ) : (
          displayList.map((id, index) => (
            <GalleryCard key={`${id}-${index}`} id={id} />
          ))
        )}
      </div>

      <div className="gallery-footer">
        포켓몬을 더 많이 잡아서 도감을 완성해보세요! ⭐
      </div>
    </div>
  );
}
