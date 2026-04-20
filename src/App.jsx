import { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import BattleScreen from './components/BattleScreen';
import Gallery from './components/Gallery';

function App() {
  // 'setup' | 'picking' | 'playing'
  const [gameState, setGameState] = useState('setup');
  const [targetWord, setTargetWord] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('hangmanStreak');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('pokemonInventory');
    if (saved) return JSON.parse(saved);
    return [{ id: 25, hp: 100, caughtDate: Date.now() }]; // Pikachu starter
  });

  const [activePokemonId, setActivePokemonId] = useState(() => {
    const saved = localStorage.getItem('activePokemonId');
    return saved ? parseInt(saved, 10) : 25;
  });

  useEffect(() => {
    localStorage.setItem('pokemonInventory', JSON.stringify(inventory));
    localStorage.setItem('hangmanStreak', streak.toString());
    localStorage.setItem('activePokemonId', activePokemonId.toString());
  }, [inventory, streak, activePokemonId]);

  // Called when user taps Start on the setup screen
  const handleStartGame = (word, voiceMode = false) => {
    setTargetWord(word.toUpperCase());
    setIsVoiceMode(voiceMode);
    setGameState('picking'); // go to picker first
  };

  // Called when user taps a Pokémon in the picker gallery
  const handlePickedForBattle = (id) => {
    setActivePokemonId(id);
    setGameState('playing');
  };

  const handleFinishGame = (result, caughtId) => {
    if (result === 'win') {
      setStreak(s => s + 1);
      if (caughtId) {
        setInventory(prev => [...prev, {
          id: caughtId,
          hp: 100,
          caughtDate: Date.now()
        }]);
      }
    } else if (result === 'lose') {
      setStreak(s => Math.max(0, Math.floor(s / 2) - 1));
    }
  };

  const handleSpendPokemon = (chosenId) => {
    setInventory(prev => {
      const idx = prev.findIndex(p => p.id === chosenId);
      if (idx !== -1) {
        const newArr = [...prev];
        newArr.splice(idx, 1);
        return newArr;
      }
      return prev;
    });
  };


  const handleBackToSetup = () => {
    setGameState('setup');
    setTargetWord('');
    setIsVoiceMode(false);
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
        />
      )}

      {/* Sanctuary picker — shown before every battle */}
      {gameState === 'picking' && (
        <Gallery
          inventory={inventory}
          activeId={activePokemonId}
          onSelect={setActivePokemonId}
          onClose={handleBackToSetup}
          onPickForBattle={handlePickedForBattle}
        />
      )}

      {gameState === 'playing' && (
        <BattleScreen
          word={targetWord}
          playerPokemonId={activePokemonId}
          inventory={inventory}
          onSpendPokemon={handleSpendPokemon}
          isVoiceMode={isVoiceMode}
          onBack={handleBackToSetup}
          onFinish={handleFinishGame}
        />
      )}
    </>
  );
}

export default App;
