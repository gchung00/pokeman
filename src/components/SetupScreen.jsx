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

export default function SetupScreen({ onStartGame, caughtIds, streak }) {
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [forcePlayWord, setForcePlayWord] = useState('');
  const [showGallery, setShowGallery] = useState(false);

  const score = caughtIds.length;

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
    } catch (error) {
      return true;
    }
  };

  const handleStartCustom = async () => {
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setErrorMsg('단어를 입력해주세요!');
      return;
    }

    if (forcePlayWord === trimmed) {
      onStartGame(trimmed, false);
      return;
    }

    const words = trimmed.split(/\s+/);
    if (words.length > 2) {
      setErrorMsg('최대 2개의 단어까지만 가능해요!');
      return;
    }

    setIsValidating(true);
    setErrorMsg('');

    let allValid = true;
    for (const w of words) {
      const isValid = await validateWordExists(w);
      if (!isValid) {
        allValid = false;
        break;
      }
    }

    setIsValidating(true);
    setIsValidating(false);

    if (!allValid) {
      setErrorMsg(`사전에 없는 단어 같아요! 그래도 하시겠어요?`);
      setForcePlayWord(trimmed); 
      return;
    }

    onStartGame(trimmed, false);
  };

  const handleRandomPlay = (voiceMode) => {
    // Streak-based Ramping Logic
    let minDiff = 1;
    let maxDiff = 2;

    if (streak >= 8) { minDiff = 4; maxDiff = 5; }
    else if (streak >= 5) { minDiff = 3; maxDiff = 5; }
    else if (streak >= 3) { minDiff = 2; maxDiff = 4; }
    else if (streak >= 1) { minDiff = 1; maxDiff = 3; }

    const pool = ADVANCED_VOCAB.filter(v => v.diff >= minDiff && v.diff <= maxDiff);
    const selected = pool[Math.floor(Math.random() * pool.length)];
    onStartGame(selected.word, voiceMode);
  };

  return (
    <div className="setup-container">
      {score > 0 && (
        <button className="score-badge clickable" onClick={() => setShowGallery(true)}>
          🏆 My Collection: {score}
        </button>
      )}

      {showGallery && (
        <Gallery caughtIds={caughtIds} onClose={() => setShowGallery(false)} />
      )}
      <img 
        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" 
        alt="Pikachu" 
        className="setup-pokemon-img" 
      />
      
      <h1>Catch the Pokémon!</h1>
      <p className="instruction">치고 싶은 단어를 쓰거나 🎲랜덤 단어를 뽑아보세요!</p>
      
      <div className="input-container">
        <input 
          type="text" 
          className="word-input"
          placeholder="ENTER A WORD" 
          value={inputVal}
          onChange={handleInputChange}
          maxLength={20}
          disabled={isValidating}
        />
        
        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <button className="btn btn-primary" onClick={handleStartCustom} disabled={isValidating}>
          {isValidating ? '확인 중...' : (forcePlayWord === inputVal.trim() && inputVal.trim() !== '' ? '사전에 없지만 고! (강제시작)' : '이 단어로 시작하기')}
        </button>

        <div style={{textAlign: 'center', margin: '15px 0', fontWeight: 'bold'}}>✨ OR ✨</div>

        <button className="btn btn-random btn-hear btn-main" onClick={() => handleRandomPlay(true)}>
          🎧 Listen & Spell (Voice Mode)
        </button>

        <button className="btn btn-random btn-secondary-random" onClick={() => handleRandomPlay(false)}>
          🎲 Random 7+ Word
        </button>
      </div>
    </div>
  );
}
