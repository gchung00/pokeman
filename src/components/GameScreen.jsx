import { useState, useEffect, useRef } from 'react';
import Keyboard from './Keyboard';
import { speakWord } from '../words';

export default function GameScreen({ word, isVoiceMode, onBack, onFinish, score, setCaughtIds }) {
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [pokemonId] = useState(() => Math.floor(Math.random() * 151) + 1);
  const [hintActive, setHintActive] = useState(false);
  const [hasScored, setHasScored] = useState(false);
  const [lastGuessedLetter, setLastGuessedLetter] = useState(null);
  const [correctFlashLetters, setCorrectFlashLetters] = useState(new Set());
  const [praiseEmojis, setPraiseEmojis] = useState([]); // {id, emoji}
  const [pokemonName, setPokemonName] = useState('');
  const [hearCount, setHearCount] = useState(0);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [isSuperHint, setIsSuperHint] = useState(false);
  
  // Glowing hints logic
  const [glowState] = useState(() => {
    const correctLetters = Array.from(new Set(word.replace(/\s/g, '').split('')));
    const correctShuffled = [...correctLetters].sort(() => Math.random() - 0.5);
    
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const noiseLetters = allLetters.filter(l => !correctLetters.includes(l));
    const noiseShuffled = [...noiseLetters].sort(() => Math.random() - 0.5);
    
    return { correct: correctShuffled, noise: noiseShuffled };
  });

  const timerRefs = useRef([]);
  const MAX_MISTAKES = 6;

  // 공백을 제외한 유효 글자 집합
  const uniqueLetters = new Set(word.replace(/\s/g, '').split(''));
  
  const mistakes = guessedLetters.filter(l => !word.includes(l)).length;
  const isLost = mistakes >= MAX_MISTAKES;
  const isWon = Array.from(uniqueLetters).every(l => guessedLetters.includes(l));

  // Glow calculation
  const getGlowData = () => {
    if (isWon || isLost) return {};
    
    let numCorrect = 0;
    let numNoise = 0;
    let className = "";
    
    if (mistakes === 1 || mistakes === 2) {
      numCorrect = 1; // 1 correct letter starts glowing
      numNoise = 4;   // with 4 random noise letters (hard to guess)
      className = "glow-soft";
    } else if (mistakes === 3 || mistakes === 4) {
      numCorrect = 1;
      numNoise = 2;   // Noise is reduced
      className = "glow-medium";
    } else if (mistakes === 5) {
      numCorrect = 1;
      numNoise = 1;   // Only 1 correct + 1 noise (50/50 lifeline)
      className = "glow-bright";
    }
    
    if (numCorrect === 0 && numNoise === 0) return {};
    
    const unrevealedCorrect = glowState.correct.filter(l => !guessedLetters.includes(l)).slice(0, numCorrect);
    const unrevealedNoise = glowState.noise.filter(l => !guessedLetters.includes(l)).slice(0, numNoise);
    
    const map = {};
    unrevealedCorrect.forEach(l => map[l] = className);
    unrevealedNoise.forEach(l => map[l] = className);
    return map;
  };

  const glowingLettersMap = getGlowData();

  // unmount 시 pending 타이머 전부 정리
  useEffect(() => {
    return () => timerRefs.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (isVoiceMode) {
      speakWord(word);
    }
  }, [word, isVoiceMode]);

  // 이겼을 때 딱 한 번만 성적 올려주기 (ID 추가) 및 상위 컴포넌트에 결과 보고
  useEffect(() => {
    if (isWon && !hasScored) {
      setCaughtIds(prev => [...prev, pokemonId]);
      setHasScored(true);
      onFinish('win');
    } else if (isLost && !hasScored) {
      setHasScored(true); // Treat as finished
      onFinish('lose');
    }
  }, [isWon, isLost, hasScored, setCaughtIds, pokemonId, onFinish]);

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
    if (isLost || isWon || guessedLetters.includes(letter)) return;
    
    setGuessedLetters(prev => [...prev, letter]);

    if (isVoiceMode) {
      speakWord(word, 0.85); // 다시 한 번 단어 읽어주기
    }

    if (word.includes(letter)) {
      // 1. 키보드 반짝임 효과
      setCorrectFlashLetters(prev => new Set(prev).add(letter));
      timerRefs.current.push(setTimeout(() => {
        setCorrectFlashLetters(prev => {
          const next = new Set(prev);
          next.delete(letter);
          return next;
        });
      }, 600));

      // 2. 칭찬 이모지 효과 (랜덤 이모지)
      const emojis = ["⭐","✨","🎉","👏","💥","🌟"];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      const newPraise = { id: Date.now(), emoji: randomEmoji };
      setPraiseEmojis(prev => [...prev, newPraise]);
      timerRefs.current.push(setTimeout(() => {
        setPraiseEmojis(prev => prev.filter(p => p.id !== newPraise.id));
      }, 1000));

      // 3. 마지막 글자 추적 (애니메이션 트리거용)
      setLastGuessedLetter(letter);
      timerRefs.current.push(setTimeout(() => setLastGuessedLetter(null), 600));
    }
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

    // 38% 확률로 슈퍼 힌트 (2글자)
    const isSuper = Math.random() < 0.38;
    setIsSuperHint(isSuper);
    timerRefs.current.push(setTimeout(() => setIsSuperHint(false), 2000));

    const unrevealed = Array.from(uniqueLetters).filter(l => !guessedLetters.includes(l));
    const lettersToReveal = [];
    const numToReveal = isSuper ? 2 : 1;

    for (let i = 0; i < numToReveal; i++) {
       if (unrevealed.length > 0) {
         const idx = Math.floor(Math.random() * unrevealed.length);
         lettersToReveal.push(unrevealed[idx]);
         unrevealed.splice(idx, 1);
       }
    }

    // 포켓볼 연출 중간 타이밍에 글자 열어주기
    timerRefs.current.push(setTimeout(() => {
      setGuessedLetters(prev => [...prev, ...lettersToReveal]);
      // 힌트로 열린 글자들도 애니메이션 효과 (단, 이모지는 생략)
      if (lettersToReveal.length > 0) {
        setLastGuessedLetter(lettersToReveal[lettersToReveal.length - 1]);
        timerRefs.current.push(setTimeout(() => setLastGuessedLetter(null), 600));
      }
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
        <button className="btn-hear" onClick={() => {
          // 누를수록 더 느려지는 로직 (0.85 -> 0.65 -> 0.5)
          const rates = [0.85, 0.65, 0.5];
          const currentRate = rates[Math.min(hearCount, rates.length - 1)];
          setHearCount(c => c + 1);
          speakWord(word, currentRate);
        }}>
          🔊 Hear {hearCount > 0 ? Array(Math.min(hearCount, 3)).fill('🐢').join('') : ''}
        </button>
      </div>

      <div className="pokemon-display">
        {/* 칭찬 이모지 연출 */}
        {praiseEmojis.map(p => (
           <div key={p.id} className="praise-float">{p.emoji}</div>
        ))}

        {/* 힌트 연출 */}
        {hintActive && (
          <div className={`hint-magic-container ${isSuperHint ? 'super' : ''}`}>
             <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="hint ball" className="hint-pokeball" />
             <div className="hint-sparkles">✨</div>
             {isSuperHint && <div className="super-hint-text">SUPER HINT! 🔥</div>}
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
          const isJustRevealed = char === lastGuessedLetter;

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
          correctFlashLetters={correctFlashLetters}
          glowingLetters={glowingLettersMap}
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
