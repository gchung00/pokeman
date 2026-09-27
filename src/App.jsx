import { useState, useEffect, useRef } from 'react';
import SetupScreen from './components/SetupScreen';
import BattleScreen from './components/BattleScreen';
import Gallery from './components/Gallery';
import { loadFromGitHub, saveToGitHub, fetchCurrentSha, getToken } from './lib/githubSync';

function App() {
  // 'setup' | 'picking' | 'playing'
  const [gameState, setGameState] = useState('setup');
  const [targetWord, setTargetWord] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('idle'); // 'idle' | 'syncing' | 'saved' | 'error'

  const [streak, setStreak] = useState(() => {
    try {
      const saved = localStorage.getItem('hangmanStreak');
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });

  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('pokemonInventory');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{ id: 25, hp: 100, caughtDate: Date.now() }];
  });

  const [activePokemonId, setActivePokemonId] = useState(() => {
    try {
      const saved = localStorage.getItem('activePokemonId');
      return saved ? parseInt(saved, 10) : 25;
    } catch { return 25; }
  });

  // On first mount, pull from GitHub and merge (cloud wins if streak is higher)
  useEffect(() => {
    async function syncOnLoad() {
      if (!getToken()) return;
      await fetchCurrentSha();
      const cloud = await loadFromGitHub();
      if (!cloud) return;

      setInventory(prev => {
        // Merge: add any cloud Pokémon not already in local
        const existingKeys = new Set(prev.map(p => `${p.id}-${p.caughtDate}`));
        const toAdd = (cloud.inventory || []).filter(p => !existingKeys.has(`${p.id}-${p.caughtDate}`));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });

      setStreak(prev => (typeof cloud.streak === 'number' && cloud.streak > prev ? cloud.streak : prev));
    }
    syncOnLoad();
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('pokemonInventory', JSON.stringify(inventory));
      localStorage.setItem('hangmanStreak', streak.toString());
      localStorage.setItem('activePokemonId', activePokemonId.toString());
    } catch {}
  }, [inventory, streak, activePokemonId]);

  // Debounced auto-save to GitHub (500ms after last change)
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!getToken()) return;
    clearTimeout(saveTimer.current);
    setCloudStatus('syncing');
    saveTimer.current = setTimeout(async () => {
      const ok = await saveToGitHub(inventory, streak);
      setCloudStatus(ok ? 'saved' : 'error');
      setTimeout(() => setCloudStatus('idle'), 3000);
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [inventory, streak]);

  const [difficulty, setDifficulty] = useState('normal');

  const handleStartGame = (word, voiceMode = false, diff = 'normal') => {
    setTargetWord(word.toUpperCase());
    setIsVoiceMode(voiceMode);
    setDifficulty(diff);
    setGameState('picking');
  };

  const handlePickedForBattle = (id) => {
    setActivePokemonId(id);
    setGameState('playing');
  };

  const handleFinishGame = (result, caughtId) => {
    if (result === 'win') {
      setStreak(s => s + 1);
      if (caughtId) {
        setInventory(prev => [...prev, { id: caughtId, hp: 100, caughtDate: Date.now() }]);
      }
    } else if (result === 'lose') {
      setStreak(s => Math.max(0, Math.floor(s / 2) - 1));
    }
  };

  const handleSpendPokemon = (chosenId) => {
    setInventory(prev => {
      const idx = prev.findIndex(p => p.id === chosenId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      // If we just removed the active Pokémon, pick the first remaining one
      if (chosenId === activePokemonId && next.length > 0) {
        setActivePokemonId(next[0].id);
      }
      return next;
    });
  };

  const handleBackToSetup = () => {
    setGameState('setup');
    setTargetWord('');
    setIsVoiceMode(false);
  };

  const handleImportSync = (importedData) => {
    try {
      const data = JSON.parse(atob(importedData));
      if (data.inventory && Array.isArray(data.inventory)) {
        setInventory(prev => {
          const existingKeys = new Set(prev.map(p => `${p.id}-${p.caughtDate}`));
          const toAdd = data.inventory.filter(p => !existingKeys.has(`${p.id}-${p.caughtDate}`));
          return [...prev, ...toAdd];
        });
      }
      if (typeof data.streak === 'number' && data.streak > streak) {
        setStreak(data.streak);
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
      {gameState === 'setup' && (
        <SetupScreen
          onStartGame={handleStartGame}
          inventory={inventory}
          streak={streak}
          activePokemonId={activePokemonId}
          setActivePokemonId={setActivePokemonId}
          onImportSync={handleImportSync}
          cloudStatus={cloudStatus}
        />
      )}

      {gameState === 'picking' && (
        <Gallery
          inventory={inventory}
          activeId={activePokemonId}
          onSelect={setActivePokemonId}
          onClose={handleBackToSetup}
          onPickForBattle={handlePickedForBattle}
          onMovePokemon={(id, caughtDate, x, y) => {
            setInventory(prev => prev.map(p =>
              (p.id === id && p.caughtDate === caughtDate) ? { ...p, x, y } : p
            ));
          }}
        />
      )}

      {gameState === 'playing' && (
        <BattleScreen
          word={targetWord}
          playerPokemonId={activePokemonId}
          inventory={inventory}
          onSpendPokemon={handleSpendPokemon}
          isVoiceMode={isVoiceMode}
          difficulty={difficulty}
          onBack={handleBackToSetup}
          onFinish={handleFinishGame}
        />
      )}
    </>
  );
}

export default App;
