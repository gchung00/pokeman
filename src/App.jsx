import { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';

function App() {
  const [gameState, setGameState] = useState('setup'); // 'setup', 'playing'
  const [targetWord, setTargetWord] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [streak, setStreak] = useState(() => {
    const saved = localStorage.getItem('hangmanStreak');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [caughtIds, setCaughtIds] = useState(() => {
    const saved = localStorage.getItem('pokemonCaughtIds');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pokemonCaughtIds', JSON.stringify(caughtIds));
  }, [caughtIds]);

  useEffect(() => {
    localStorage.setItem('hangmanStreak', streak.toString());
  }, [streak]);

  const score = caughtIds.length;

  const handleStartGame = (word, voiceMode = false) => {
    setTargetWord(word.toUpperCase());
    setIsVoiceMode(voiceMode);
    setGameState('playing');
  };

  const handleFinishGame = (result) => {
    if (result === 'win') {
      setStreak(s => s + 1);
    } else if (result === 'lose') {
      // Don't reset completely, but drop it down to make it easier
      setStreak(s => Math.max(0, Math.floor(s / 2) - 1));
    }
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
          caughtIds={caughtIds} 
          streak={streak}
        />
      )}
      {gameState === 'playing' && (
        <GameScreen 
          word={targetWord} 
          isVoiceMode={isVoiceMode} 
          onBack={handleBackToSetup} 
          onFinish={handleFinishGame}
          score={score}
          setCaughtIds={setCaughtIds}
        />
      )}
    </>
  );
}

export default App;
