import React from 'react';
import { getTypeColor, getPokemonInfo } from '../lib/pokemonData';
import EnergyBar from './EnergyBar';

export default function CardDisplay({ 
  pokemon, 
  energyPercent = 0, 
  isOpponent = false, 
  currentHp,
  isFainted = false,
  status = 'idle'
}) {
  // 1. Initial Null Check
  if (!pokemon) return (
    <div className="pokemon-card loading">
      <div className="shimmer-effect"></div>
      <div className="loading-text">Summoning...</div>
    </div>
  );

  const info = getPokemonInfo(pokemon.id);
  const mainType = pokemon.types?.[0]?.type?.name || 'normal';
  const typeColor = getTypeColor(mainType);
  const hpPercent = currentHp !== undefined && info.hp ? (currentHp / info.hp) * 100 : 100;
  const paddedId = String(pokemon.id || 0).padStart(3, '0');

  // 2. Safe Sprite Access
  const artwork = pokemon.sprites?.other?.['official-artwork']?.front_default || 
                  pokemon.sprites?.front_default || 
                  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';

  const typesStr = pokemon.types 
    ? pokemon.types.map(t => t.type?.name).join(' / ') 
    : 'Unknown';

  return (
    <div className={`pokemon-card-wrapper ${isOpponent ? 'opponent' : 'player'} ${status} ${isFainted ? 'fainted' : ''}`}>
      <div className={`pokemon-card rarity-${info.rarity} type-${mainType}`}>
        {/* Holographic & Texture Layers */}
        <div className="holo-layer"></div>
        <div className="card-texture"></div>

        <div className="card-header">
          <div className="card-name-group">
            <span className="card-stage">{info.rarity === 'legendary' ? 'LEGENDARY' : info.rarity === 'rare' ? 'STAGE 1' : 'BASIC'}</span>
            <h3 className="card-name">{pokemon.name || '???'}</h3>
          </div>
          <div className="card-hp-group">
            <span className="hp-label">HP</span>
            <span className="hp-value">{currentHp ?? info.hp}</span>
          </div>
          <div className={`type-icon ${mainType}`}></div>
        </div>

        <div className="card-art-area">
          <div className="art-bg-effect" style={{ background: `radial-gradient(circle, ${typeColor}44 0%, transparent 70%)` }}></div>
          <img 
            src={artwork} 
            alt={pokemon.name || 'Pokemon'} 
            className="card-artwork"
          />
          <div className="card-id-tag">NO. {paddedId}</div>
        </div>

        <div className="card-info-strip">
          <span>{typesStr.toUpperCase()} Pokémon. HT: {(pokemon.height || 0)/10}m WT: {(pokemon.weight || 0)/10}kg</span>
        </div>

        <div className="card-actions">
          <div className="attack-row">
            <div className="energy-costs">
              {Array(info.rarity === 'legendary' ? 3 : info.rarity === 'rare' ? 2 : 1).fill(0).map((_, i) => (
                <div key={i} className={`energy-cost-sphere ${mainType}`}></div>
              ))}
            </div>
            <div className="attack-details">
              <span className="attack-name">{info.attackName || info.attack || 'Battle Charge'}</span>
              <span className="attack-desc">Charges power through spelling letters.</span>
            </div>
            <div className="attack-damage">{info.attackDamage || Math.floor(info.hp / 2)}</div>
          </div>
        </div>

        <div className="card-footer">
          <div className="stat-item">
            <span>weakness</span>
            <div className="type-icon water small"></div>
          </div>
          <div className="stat-item">
            <span>resistance</span>
            <div className="resistance-none">-</div>
          </div>
          <div className="stat-item">
            <span>retreat</span>
            <div className="retreat-cost">
               <div className="cost-dot"></div>
            </div>
          </div>
        </div>

        {/* Battle Overlays */}
        <div className="battle-stats-overlay">
          <div className="hp-mini-track">
            <div className={`hp-mini-fill ${hpPercent < 20 ? 'low' : ''}`} style={{ width: `${hpPercent}%` }}></div>
          </div>
          {!isOpponent && <EnergyBar percentage={energyPercent} isCharging={status === 'attacking'} />}
        </div>
      </div>
    </div>
  );
}
