import { useState } from 'react';
import { ADVANCED_VOCAB } from '../words';
import Gallery from './Gallery';
import { getToken, setToken, clearToken } from '../lib/githubSync';

const FUN_WORDS = [
  { word: "POKEMON" }, { word: "PIKACHU" }, { word: "EEVEE" }, { word: "CHARIZARD" },
  { word: "SQUIRTLE" }, { word: "BULBASAUR" }, { word: "MEWTWO" }, { word: "GENGAR" },
  { word: "LEGO" }, { word: "ROBLOX" }, { word: "MINECRAFT" }, { word: "MARIO" },
  { word: "SONIC" }, { word: "BATMAN" }, { word: "SPIDERMAN" }, { word: "ELSA" },
  { word: "ANNA" }, { word: "MOMMY" }, { word: "DADDY" }, { word: "GRANDPA" },
  { word: "GRANDMA" }
];

const CLOUD_LABELS = {
  idle:    { icon: '☁️',  text: 'Cloud save on',  color: '#9ca3af' },
  syncing: { icon: '🔄', text: 'Saving...',        color: '#f59e0b' },
  saved:   { icon: '✅',  text: 'Saved to cloud',  color: '#4ade80' },
  error:   { icon: '⚠️', text: 'Save failed',      color: '#f87171' },
};

export default function SetupScreen({ onStartGame, inventory, streak, activePokemonId, setActivePokemonId, onImportSync, cloudStatus = 'idle' }) {
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [forcePlayWord, setForcePlayWord] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [syncMsg, setSyncMsg] = useState('');

  const hasToken = !!getToken();
  const score = inventory.length;
  const cloudInfo = CLOUD_LABELS[cloudStatus] || CLOUD_LABELS.idle;

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
    if (pool.length === 0) {
      const fallback = ADVANCED_VOCAB[Math.floor(Math.random() * ADVANCED_VOCAB.length)];
      onStartGame(fallback.word, voiceMode);
      return;
    }
    const selected = pool[Math.floor(Math.random() * pool.length)];
    onStartGame(selected.word, voiceMode);
  };

  const handleSaveToken = () => {
    const t = tokenInput.trim();
    if (!t) { setSyncMsg('Paste your token first.'); return; }
    setToken(t);
    setTokenInput('');
    setSyncMsg('✅ Token saved! Your Pokémon will now sync across devices.');
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const handleRemoveToken = () => {
    clearToken();
    localStorage.removeItem('githubSha');
    setSyncMsg('Cloud sync disabled.');
    setTimeout(() => setSyncMsg(''), 2000);
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
        <div className="landing-hero-fade" />

        <button className="sanctuary-btn" onClick={() => setShowGallery(true)} aria-label="Open Sanctuary">
          <div className="sanctuary-icon">
            <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="44">
              <circle cx="22" cy="22" r="20" fill="white" stroke="#FFD700" strokeWidth="2.5"/>
              <path d="M3.2 22 A18.8 18.8 0 0 1 40.8 22 Z" fill="#FF4444"/>
              <path d="M3.2 22 A18.8 18.8 0 0 0 40.8 22 Z" fill="white"/>
              <line x1="3.2" y1="22" x2="40.8" y2="22" stroke="#333" strokeWidth="2.5"/>
              <circle cx="22" cy="22" r="5.5" fill="white" stroke="#333" strokeWidth="2.5"/>
              <circle cx="22" cy="22" r="2.5" fill="#FF4444"/>
            </svg>
          </div>
          <span className="sanctuary-count">{score}</span>
        </button>
      </div>

      {/* ═══ MAIN CONTENT CARD ═══ */}
      <div className="landing-card">
        <div className="landing-title-block">
          <h1 className="landing-title">POKÉMON</h1>
          <p className="landing-subtitle">SPELLING BATTLE</p>
        </div>

        {streak > 0 && (
          <div className="streak-badge">
            🔥 {streak} Win Streak!
          </div>
        )}

        <button className="cta-primary pulse-animation" onClick={() => handleRandomPlay(true)}>
          <span className="cta-icon">🎧</span>
          <span className="cta-label">
            <span className="cta-main">Listen &amp; Spell</span>
            <span className="cta-sub">Random word — voice mode</span>
          </span>
        </button>

        <div className="landing-divider">
          <span className="divider-line" />
          <span className="divider-text">OR TYPE YOUR OWN</span>
          <span className="divider-line" />
        </div>

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

        {/* Cloud save status + settings button */}
        <div className="cloud-status-row">
          {hasToken && (
            <span className="cloud-status-badge" style={{ color: cloudInfo.color }}>
              {cloudInfo.icon} {cloudInfo.text}
            </span>
          )}
          <button className="sync-settings-btn" onClick={() => { setShowSyncModal(true); setSyncMsg(''); }}>
            {hasToken ? '☁️ Cloud Sync' : '☁️ Set up Sync'}
          </button>
        </div>
      </div>

      {/* Cloud Sync Modal */}
      {showSyncModal && (
        <div className="bs-modal-overlay">
          <div className="bs-modal-content" style={{ maxWidth: '400px' }}>
            <h3 className="bs-modal-title">☁️ Cloud Sync</h3>

            {hasToken ? (
              <>
                <p className="bs-modal-desc">
                  Your Pokémon are automatically saved to GitHub and load on any device. Remove the token to disable.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
                  <button className="cta-secondary" style={{ padding: '10px 16px', background: '#7f1d1d', borderColor: '#ef4444', color: '#fca5a5' }} onClick={handleRemoveToken}>
                    Remove Token
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="bs-modal-desc">
                  Paste your GitHub token to save Pokémon across all your devices automatically.
                </p>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#2d3748', color: 'white', border: '1px solid #4a5568', fontFamily: 'monospace', marginBottom: '12px', boxSizing: 'border-box' }}
                />
                <button className="cta-primary" style={{ width: '100%', padding: '10px' }} onClick={handleSaveToken}>
                  Save Token
                </button>
              </>
            )}

            {syncMsg && <p style={{ color: '#4ade80', fontSize: '0.9rem', marginTop: '12px', textAlign: 'center' }}>{syncMsg}</p>}

            <button className="bs-modal-close" style={{ marginTop: '16px' }} onClick={() => { setShowSyncModal(false); setSyncMsg(''); setTokenInput(''); }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
