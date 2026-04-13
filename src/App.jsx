import { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';

function App() {
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing'
  const [targetWord, setTargetWord] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [caughtIds, setCaughtIds] = useState(() => {
    const saved = localStorage.getItem('pokemonCaughtIds');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pokemonCaughtIds', JSON.stringify(caughtIds));
  }, [caughtIds]);

  const score = caughtIds.length;

  const handleStartGame = (word, voiceMode = false) => {
    setTargetWord(word.toUpperCase());
    setIsVoiceMode(voiceMode);
    setGameState('playing');
  };

  const handleBackToSetup = () => {
    setGameState('setup');
    setTargetWord('');
    setIsVoiceMode(false);
  };

  return (
    <>
      {gameState === 'setup' && (
        <SetupScreen onStartGame={handleStartGame} caughtIds={caughtIds} />
      )}
      {gameState === 'playing' && (
        <GameScreen 
          word={targetWord} 
          isVoiceMode={isVoiceMode} 
          onBack={handleBackToSetup} 
          score={score}
          setCaughtIds={setCaughtIds}
        />
      )}
    </>
  );
}

export default App;
