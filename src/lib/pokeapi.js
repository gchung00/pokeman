// Minimal local cache
const memoryCache = new Map();

/**
 * Fetches base Pokémon data from PokeAPI
 */
export async function fetchPokemon(id) {
  if (memoryCache.has(id)) {
    return memoryCache.get(id);
  }
  
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) throw new Error('PokeAPI request failed');
    
    const data = await response.json();
    
    const formatted = {
      id: data.id,
      name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      types: data.types.map(t => t.type.name),
      animatedSprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${data.id}.gif`,
      staticSprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`
    };

    memoryCache.set(id, formatted);
    return formatted;
  } catch (err) {
    console.error("Error fetching pokemon", err);
    return null;
  }
}
