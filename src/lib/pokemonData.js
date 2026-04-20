export const POKEMON_DATA = {
  1: { type: 'grass', hp: 45, rarity: 'common', attack: 'Tackle' },
  2: { type: 'grass', hp: 60, rarity: 'rare', attack: 'Vine Whip' },
  3: { type: 'grass', hp: 80, rarity: 'ultra-rare', attack: 'Solar Beam' },
  4: { type: 'fire', hp: 39, rarity: 'common', attack: 'Scratch' },
  5: { type: 'fire', hp: 58, rarity: 'rare', attack: 'Ember' },
  6: { type: 'fire', hp: 78, rarity: 'ultra-rare', attack: 'Flamethrower' },
  7: { type: 'water', hp: 44, rarity: 'common', attack: 'Tackle' },
  8: { type: 'water', hp: 59, rarity: 'rare', attack: 'Water Gun' },
  9: { type: 'water', hp: 79, rarity: 'ultra-rare', attack: 'Hydro Pump' },
  10: { type: 'bug', hp: 45, rarity: 'common', attack: 'String Shot' },
  // Let's create a generic fallback for any ID not specifically mapped
};

export const getTypeColor = (type) => {
  const map = {
    fire: '#FF4500', water: '#3498DB', grass: '#2ECC71', electric: '#F1C40F',
    psychic: '#9B59B6', normal: '#95A5A6', poison: '#8E44AD', ground: '#D35400',
    rock: '#7F8C8D', ice: '#00CED1', ghost: '#34495E', dragon: '#8E44AD',
    bug: '#16A085', fighting: '#C0392B'
  };
  return map[type] || '#BDC3C7';
};

export const getPokemonInfo = (id) => {
  // If we mapped it exactly, return it.
  if (POKEMON_DATA[id]) return POKEMON_DATA[id];
  
  // Otherwise, use math to assign a generic type and rarity to save typing 151 entries manually initially.
  // In production we would dump all 151 from json.
  const types = ['normal', 'water', 'bug', 'flying', 'poison', 'electric', 'ground', 'psychic'];
  const genericType = types[id % types.length];
  
  // Legendaries
  if ([144, 145, 146, 150, 151].includes(id)) {
    return { type: 'psychic', hp: 106, rarity: 'legendary', attack: 'Hyper Beam' };
  }
  
  // Rare offsets
  let rarity = 'common';
  let hp = 40 + (id % 30);
  if (id % 7 === 0) { rarity = 'rare'; hp += 30; }
  if (id % 15 === 0) { rarity = 'ultra-rare'; hp += 60; }
  
  return { type: genericType, hp, rarity, attack: 'Quick Attack' };
};
