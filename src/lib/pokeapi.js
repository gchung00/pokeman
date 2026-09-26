// Minimal local cache
const memoryCache = new Map();

/**
 * Returns the best sprite URL for a given Pokémon ID.
 * Gen 1–5 (1–649): animated GIF from Black/White sprites.
 * Gen 6+ (650–1025): static official artwork (animated GIFs don't exist for newer gens).
 */
export const getPokemonSprite = (id) =>
  id <= 649
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

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
      animatedSprite: getPokemonSprite(data.id),
      staticSprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`
    };

    memoryCache.set(id, formatted);
    return formatted;
  } catch (err) {
    console.error("Error fetching pokemon", err);
    return null;
  }
}
