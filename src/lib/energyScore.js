// Letter energy points inspired by Scrabble difficulty
export const LETTER_ENERGY = {
  E: 1, A: 1, I: 1, O: 1, U: 1, N: 1, S: 1, T: 1, R: 1, L: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10
};

export function getLetterEnergy(letter) {
  const upper = letter.toUpperCase();
  return LETTER_ENERGY[upper] || 0;
}

export function calculateWordEnergy(word) {
  let expectedEnergy = 0;
  for (let i = 0; i < word.length; i++) {
    const char = word[i].toUpperCase();
    if (LETTER_ENERGY[char]) {
      expectedEnergy += LETTER_ENERGY[char];
    }
  }
  return expectedEnergy;
}
