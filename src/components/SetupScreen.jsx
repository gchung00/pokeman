import { useState } from 'react';
import { ADVANCED_VOCAB } from '../words';
import Gallery from './Gallery';

const FUN_WORDS = [
  { word: "POKEMON" }, { word: "PIKACHU" }, { word: "EEVEE" }, { word: "CHARIZARD" },
  { word: "SQUIRTLE" }, { word: "BULBASAUR" }, { word: "MEWTWO" }, { word: "GENGAR" },
  { word: "LEGO" }, { word: "ROBLOX" }, { word: "MINECRAFT" }, { word: "MARIO" },
  { word: "SONIC" }, { word: "BATMAN" }, { word: "SPIDERMAN" }, { word: "ELSA" },
  { word: "ANNA" }, { word: "MOMMY" }, { word: "DADDY" }, { word: "GRANDPA" },
  { word: "GRANDMA" }
];

export default function SetupScreen({ onStartGame, inventory, streak, activePokemonId, setActivePokemonId }) {
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [forcePlayWord, setForcePlayWord] = useState('');
  const [showGallery, setShowGallery] = useState(false);

  const score = inventory.length;

  const handleInputChange = (e) => {
    const sanitized = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setInputVal(sanitized);
    setErrorMsg('');
    setForcePlayWord('');
  };

  const validateWordExists = async (wordToTest) => {
    const upperWord = wordToTest.toUpperCase();
    if (FUN_WORDS.some(f => f.word === upperWord)) return true;
    if (!/[AEIOUYaeiouy]/.test(upperWord)) return false;
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordToTest}`);
      return response.ok;
    } catch {
      return true;
    }
  };

  const handleStartCustom = async () => {
    const trimmed = inputVal.trim();
    if (!trimmed) { setErrorMsg('Enter a word first!'); return; }
    if (forcePlayWord === trimmed) { onStartGame(trimmed, false); return; }
    const words = trimmed.split(/\s+/);
    if (words.length > 2) { setErrorMsg('Max 2 words!'); return; }
    setIsValidating(true);
    setErrorMsg('');
    let allValid = true;
    for (const w of words) {
      if (!await validateWordExists(w)) { allValid = false; break; }
    }
    setIsValidating(false);
    if (!allValid) { setErrorMsg(`Not in dictionary — play anyway?`); setForcePlayWord(trimmed); return; }
    onStartGame(trimmed, false);
  };

  const handleRandomPlay = (voiceMode) => {
    let minDiff = 1, maxDiff = 2;
    if (streak >= 8) { minDiff = 4; maxDiff = 5; }
    else if (streak >= 5) { minDiff = 3; maxDiff = 5; }
    else if (streak >= 3) { minDiff = 2; maxDiff = 4; }
    else if (streak >= 1) { minDiff = 1; maxDiff = 3; }
    const pool = ADVANCED_VOCAB.filter(v => v.diff >= minDiff && v.diff <= maxDiff);
    const selected = pool[Math.floor(Math.random() * pool.length)];
    onStartGame(selected.word, voiceMode);
  };

  return (
    <div className="landing-root">
      {showGallery && (
        <Gallery
          inventory={inventory}
          activeId={activePokemonId}
          onSelect={setActivePokemonId}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* ═══ HERO IMAGE ═══ */}
      <div className="landing-hero">
        <img src="/assets/hero_v2.png" alt="Pokémon Adventure" className="landing-hero-img" />
        {/* Gradient blend from image into content */}
        <div className="landing-hero-fade" />

        {/* Floating score badge — top right */}
        <button className="sanctuary-btn" onClick={() => setShowGallery(true)} aria-label="Open Sanctuary">
          <div className="sanctuary-icon">
            {/* SVG: stylised Poké Ball in grass / sanctuary */}
            <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
              {/* Background circle */}
              <circle cx="22" cy="22" r="20" fill="white" stroke="#FFD700" strokeWidth="2.5"/>
              {/* Top half — red */}
              <path d="M3.2 22 A18.8 18.8 0 0 1 40.8 22 Z" fill="#FF4444"/>
              {/* Bottom half — white */}
              <path d="M3.2 22 A18.8 18.8 0 0 0 40.8 22 Z" fill="white"/>
              {/* Middle stripe */}
              <line x1="3.2" y1="22" x2="40.8" y2="22" stroke="#333" strokeWidth="2.5"/>
              {/* Centre button outer */}
              <circle cx="22" cy="22" r="5.5" fill="white" stroke="#333" strokeWidth="2.5"/>
              {/* Centre button inner */}
              <circle cx="22" cy="22" r="2.5" fill="#FF4444"/>
            </svg>
          </div>
          <span className="sanctuary-count">{score}</span>
        </button>
      </div>

      {/* ═══ MAIN CONTENT CARD ═══ */}
      <div className="landing-card">
        {/* Title */}
        <div className="landing-title-block">
          <h1 className="landing-title">POKÉMON</h1>
          <p className="landing-subtitle">SPELLING BATTLE</p>
        </div>

        {/* Streak indicator */}
        {streak > 0 && (
          <div className="streak-badge">
            🔥 {streak} Win Streak!
          </div>
        )}

        {/* Primary CTA */}
        <button className="cta-primary pulse-animation" onClick={() => handleRandomPlay(true)}>
          <span className="cta-icon">🎧</span>
          <span className="cta-label">
            <span className="cta-main">Listen &amp; Spell</span>
            <span className="cta-sub">Random word — voice mode</span>
          </span>
        </button>

        {/* Divider */}
        <div className="landing-divider">
          <span className="divider-line" />
          <span className="divider-text">OR TYPE YOUR OWN</span>
          <span className="divider-line" />
        </div>

        {/* Custom word input */}
        <div className="custom-word-row">
          <input
            type="text"
            className="landing-input"
            placeholder="Enter a word…"
            value={inputVal}
            onChange={handleInputChange}
            maxLength={20}
            disabled={isValidating}
          />
          <button className="cta-secondary" onClick={handleStartCustom} disabled={isValidating}>
            {isValidating ? '⏳' : '⚔️'}
          </button>
        </div>

        {errorMsg && <p className="landing-error">{errorMsg}</p>}
      </div>
    </div>
  );
}
