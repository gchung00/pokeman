import { useState, useEffect, useRef } from 'react';
import Keyboard from './Keyboard';
import { speakWord } from '../words';

export default function GameScreen({ word, isVoiceMode, onBack, score, setCaughtIds }) {
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [pokemonId] = useState(() => Math.floor(Math.random() * 151) + 1);
  const [hintActive, setHintActive] = useState(false);
  const [hasScored, setHasScored] = useState(false);
  const [lastGuessedLetter, setLastGuessedLetter] = useState(null);
  const [pokemonName, setPokemonName] = useState('');
  const [hearCount, setHearCount] = useState(0);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const timerRefs = useRef([]);
  const MAX_MISTAKES = 6;

  // 공백을 제외한 유효 글자 집합
  const uniqueLetters = new Set(word.replace(/\s/g, '').split(''));
  
  const mistakes = guessedLetters.filter(l => !word.includes(l)).length;
  const isLost = mistakes >= MAX_MISTAKES;
  const isWon = Array.from(uniqueLetters).every(l => guessedLetters.includes(l));

  // unmount 시 pending 타이머 전부 정리
  useEffect(() => {
    return () => timerRefs.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (isVoiceMode) {
      speakWord(word);
    }
  }, [word, isVoiceMode]);

  // 이겼을 때 딱 한 번만 성적 올려주기 (ID 추가)
  useEffect(() => {
    if (isWon && !hasScored) {
      setCaughtIds(prev => [...prev, pokemonId]);
      setHasScored(true);
    }
  }, [isWon, hasScored, setCaughtIds, pokemonId]);

  // 결과 오버레이 지연 표시 — 애니메이션이 끝난 뒤에 등장
  useEffect(() => {
    if (isWon) {
      timerRefs.current.push(setTimeout(() => setShowResultOverlay(true), 4800));
    } else if (isLost) {
      timerRefs.current.push(setTimeout(() => setShowResultOverlay(true), 1500));
    }
  }, [isWon, isLost]);

  // 승리 시 포켓몬 이름 fetch
  useEffect(() => {
    if (isWon && !pokemonName) {
      fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
        .then(r => r.json())
        .then(data => {
          const n = data.name;
          setPokemonName(n.charAt(0).toUpperCase() + n.slice(1));
        })
        .catch(() => {});
    }
  }, [isWon, pokemonId, pokemonName]);

  const handleLetterPress = (letter) => {
    if (isLost || isWon) return;
    setGuessedLetters(prev => [...prev, letter]);
    setLastGuessedLetter(letter);
    timerRefs.current.push(setTimeout(() => setLastGuessedLetter(null), 400));
  };

  const handleHint = () => {
    if (score < 1 || isWon || isLost) return;
    
    // 비용 차감: 잡은 목록 중 가장 처음에 잡은 것 하나를 '방생'하여 힌트를 얻음
    setCaughtIds(prev => {
      const newArr = [...prev];
      newArr.shift(); 
      return newArr;
    });
    setHintActive(true);
    timerRefs.current.push(setTimeout(() => setHintActive(false), 1500));

    // 아직 맞추지 않은 알파벳 중 1~2개 무작위 추출
    const unrevealed = Array.from(uniqueLetters).filter(l => !guessedLetters.includes(l));
    const lettersToReveal = [];
    if (unrevealed.length > 0) {
      const idx1 = Math.floor(Math.random() * unrevealed.length);
      lettersToReveal.push(unrevealed[idx1]);
      unrevealed.splice(idx1, 1);
    }
    if (unrevealed.length > 0) {
      const idx2 = Math.floor(Math.random() * unrevealed.length);
      lettersToReveal.push(unrevealed[idx2]);
    }

    // 포켓볼 연출 중간 타이밍에 글자 열어주기
    timerRefs.current.push(setTimeout(() => {
      setGuessedLetters(prev => [...prev, ...lettersToReveal]);
    }, 800));
  };

  const handlePlayAgain = () => {
    onBack();
  };

  // 포켓몬을 생동감있게 보여주기 역동적인 5세대 Animated GIF 사용
  const getPokemonImage = () => {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemonId}.gif`;
  };

  // 풍선 렌더링 함수
  const renderBalloons = () => {
    // 6개의 풍선 요소 배열 반환. mistakes 개수에 따라 하나씩 'popped' 상태가 됨.
    return [1, 2, 3, 4, 5, 6].map((num) => {
      const isPopped = mistakes >= num;
      return (
        <div key={num} className={`balloon b${num} ${isPopped ? 'popped' : ''}`}></div>
      );
    });
  };

  return (
    <div className="game-container">
      <div className="top-bar">
        <button className="backs-btn" onClick={onBack}>← Back</button>
        <button className="hint-btn" onClick={handleHint} disabled={score < 1 || isWon || isLost}>
          🔍 Hint ({score})
        </button>
        <button className="backs-btn" onClick={() => {
          const rate = hearCount === 0 ? 0.85 : 0.68;
          setHearCount(c => c + 1);
          speakWord(word, rate);
        }}>🔊 Hear{hearCount > 0 ? ' 🐢' : ''}</button>
      </div>

      <div className="pokemon-display">
        {/* 힌트 연출 */}
        {hintActive && (
          <div className="hint-magic-container">
             <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="hint ball" className="hint-pokeball" />
             <div className="hint-sparkles">✨</div>
          </div>
        )}
        {/* 풍선 묶음과 포켓몬 - 맞출때마다 조금씩 아래로 떨어짐 */}
        <div className={`flying-pokemon-container drop-${Math.min(mistakes, 5)}`}>
          {!isWon && (
            <div className="balloon-cluster">
              {renderBalloons()}
            </div>
          )}
          <div className="character-wrapper">
            <img 
              src={getPokemonImage()} 
              alt="Pokemon" 
              className={`pokemon-img character ${isLost ? 'pokemon-fall' : isWon ? 'pokemon-capture' : mistakes === 5 ? 'pokemon-panic' : mistakes >= 4 ? 'pokemon-worry' : ''}`}
            />
            {/* 식은땀 및 극한의 공포 연출 (마지막 2단계) */}
            {mistakes >= 4 && !isWon && !isLost && <div className="sweat-drop sweat-1">💦</div>}
            {mistakes === 5 && !isWon && !isLost && <div className="sweat-drop sweat-2">💦</div>}
            {mistakes === 5 && !isWon && !isLost && <div className="panic-text">! ! !</div>}
            {isLost && <div className="lose-text">Aaaaaaaahhh...!!</div>}
            
            {/* 성공 시 포켓볼 포획 애니메이션 컨테이너 */}
            {isWon && (
              <div className="capture-pokeball-container">
                <div className="capture-burst-ring r1"></div>
                <div className="capture-burst-ring r2"></div>
                <div className="capture-burst-ring r3"></div>
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="catch" className="capture-pokeball" />
                <div className="capture-star s1">⭐</div>
                <div className="capture-star s2">⭐</div>
                <div className="capture-star s3">⭐</div>
                <div className="capture-star s4">✨</div>
                <div className="capture-star s5">✨</div>
                <div className="capture-star s6">⭐</div>
                <div className="gotcha-text">GOTCHA!</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="word-display">
        {word.split('').map((char, index) => {
          if (char === ' ') {
            return <div key={index} className="letter-box empty"></div>;
          }
          const isRevealed = guessedLetters.includes(char) || isLost || isWon;
          const isMissed = isLost && !guessedLetters.includes(char);
          const isJustRevealed = char === lastGuessedLetter && guessedLetters.includes(char);

          return (
            <div key={index} className={`letter-box ${isRevealed ? 'revealed' : ''} ${isJustRevealed ? 'just-revealed' : ''} ${isMissed ? 'missed' : ''}`}>
              {isRevealed ? char : ''}
            </div>
          );
        })}
      </div>

      <div className={`keyboard-wrapper ${isLost || isWon ? 'keyboard-slide-out' : ''}`}>
        <Keyboard 
          guessedLetters={guessedLetters} 
          word={word} 
          onLetterPress={handleLetterPress} 
          disabled={isWon || isLost}
        />
      </div>

      {showResultOverlay && (
        <div className={`result-overlay ${isWon ? 'win' : 'lose'}`}>
          <h2>{isWon ? `You caught ${pokemonName || '...'}!` : 'It Got Away...'}</h2>
          <button className="play-again-btn" onClick={handlePlayAgain}>Play Again</button>
        </div>
      )}
    </div>
  );
}
