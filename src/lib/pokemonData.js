export const POKEMON_DATA = {
  1: { type: 'grass', hp: 45, rarity: 'common', attack: 'Tackle', attackDamage: 20 },
  2: { type: 'grass', hp: 60, rarity: 'rare', attack: 'Vine Whip', attackDamage: 25 },
  3: { type: 'grass', hp: 80, rarity: 'ultra-rare', attack: 'Solar Beam', attackDamage: 40 },
  4: { type: 'fire', hp: 39, rarity: 'common', attack: 'Scratch', attackDamage: 20 },
  5: { type: 'fire', hp: 58, rarity: 'rare', attack: 'Ember', attackDamage: 28 },
  6: { type: 'fire', hp: 78, rarity: 'ultra-rare', attack: 'Flamethrower', attackDamage: 45 },
  7: { type: 'water', hp: 44, rarity: 'common', attack: 'Tackle', attackDamage: 20 },
  8: { type: 'water', hp: 59, rarity: 'rare', attack: 'Water Gun', attackDamage: 26 },
  9: { type: 'water', hp: 79, rarity: 'ultra-rare', attack: 'Hydro Pump', attackDamage: 44 },
  10: { type: 'bug', hp: 45, rarity: 'common', attack: 'String Shot', attackDamage: 15 },
  25: { type: 'electric', hp: 35, rarity: 'rare', attack: 'Thunderbolt', attackDamage: 35 },

  // Gen 3 — Blaziken
  257: { type: 'fire', hp: 80, rarity: 'rare', attack: 'Blaze Kick', attackDamage: 42 },

  // Gen 3 — Rayquaza (Mega Rayquaza in lore; #384 is the dex ID for the species)
  384: { type: 'dragon', hp: 105, rarity: 'legendary', attack: 'Dragon Ascent', attackDamage: 60 },

  // Gen 4 — Creation Trio + Arceus
  483: { type: 'steel', hp: 100, rarity: 'legendary', attack: 'Roar of Time', attackDamage: 55 },
  484: { type: 'water', hp: 90, rarity: 'legendary', attack: 'Spacial Rend', attackDamage: 55 },
  487: { type: 'ghost', hp: 150, rarity: 'legendary', attack: 'Shadow Force', attackDamage: 58 },
  493: { type: 'normal', hp: 120, rarity: 'legendary', attack: 'Judgment', attackDamage: 60 },
};

export const getTypeColor = (type) => {
  const map = {
    fire: '#FF4500', water: '#3498DB', grass: '#2ECC71', electric: '#F1C40F',
    psychic: '#9B59B6', normal: '#95A5A6', poison: '#8E44AD', ground: '#D35400',
    rock: '#7F8C8D', ice: '#00CED1', ghost: '#34495E', dragon: '#8E44AD',
    bug: '#16A085', fighting: '#C0392B', fairy: '#FF69B4', dark: '#2C3E50',
    steel: '#808080',
  };
  return map[type] || '#BDC3C7';
};

// Legendary Pokémon IDs by generation
export const LEGENDARY_IDS = new Set([
  // Gen 1
  144, 145, 146, 150, 151,
  // Gen 2
  243, 244, 245, 249, 250, 251,
  // Gen 3
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  // Gen 4
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
  // Gen 5
  638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  // Gen 6
  716, 717, 718, 719, 720, 721,
  // Gen 7
  785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807,
  // Gen 8
  888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898,
  // Gen 9
  1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010,
]);

export const getPokemonInfo = (id) => {
  if (POKEMON_DATA[id]) return POKEMON_DATA[id];

  if (LEGENDARY_IDS.has(id)) {
    return { type: 'psychic', hp: 106, rarity: 'legendary', attack: 'Hyper Beam', attackDamage: 50 };
  }

  const types = ['normal', 'water', 'bug', 'flying', 'poison', 'electric', 'ground', 'psychic', 'fairy', 'dark', 'steel'];
  const genericType = types[id % types.length];

  let rarity = 'common';
  let hp = 40 + (id % 30);
  let attackDamage = 20 + (id % 15);
  if (id % 7 === 0) { rarity = 'rare'; hp += 30; attackDamage += 8; }
  if (id % 15 === 0) { rarity = 'ultra-rare'; hp += 60; attackDamage += 15; }

  return { type: genericType, hp, rarity, attack: 'Quick Attack', attackDamage };
};
