import { useState } from 'react';
import { KS1_ADVANCED_WORDS } from '../words';
import Gallery from './Gallery';

const FUN_WORDS = [
  "POKEMON", "PIKACHU", "EEVEE", "CHARIZARD", "SQUIRTLE", "BULBASAUR", "MEWTWO", "GENGAR",
  "LEGO", "ROBLOX", "MINECRAFT", "MARIO", "SONIC", "BATMAN", "SPIDERMAN", "ELSA", "ANNA",
  "MOMMY", "DADDY", "GRANDPA", "GRANDMA"
];

export default function SetupScreen({ onStartGame, caughtIds }) {
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
    setForcePlayWord(''); // 입력이 바뀌면 강제 실행 상태 초기화
  };

  const validateWordExists = async (wordToTest) => {
    const upperWord = wordToTest.toUpperCase();
    if (FUN_WORDS.includes(upperWord)) return true;
    // 모음이 아예 없는 완전히 말도 안되는 문자열은 API 호출 없이 즉시 거절
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
      // 이미 경고를 무시하고 진행하기로 확정된 경우
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

    setIsValidating(false);

    if (!allValid) {
      setErrorMsg(`사전에 없는 단어 같아요! 그래도 하시겠어요?`);
      setForcePlayWord(trimmed); // 다음 클릭 시 무조건 통과하도록 세팅
      return;
    }

    onStartGame(trimmed, false);
  };

  const handleRandomPlay = (voiceMode) => {
    const randomIdx = Math.floor(Math.random() * KS1_ADVANCED_WORDS.length);
    const randomWord = KS1_ADVANCED_WORDS[randomIdx];
    onStartGame(randomWord, voiceMode);
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

        <button className="btn btn-random" onClick={() => handleRandomPlay(false)}>
          Random 7+ Word 🎲
        </button>
        <button className="btn btn-random btn-hear" onClick={() => handleRandomPlay(true)}>
          Listen & Spell 🎧 (Voice Mode)
        </button>
      </div>
    </div>
  );
}
