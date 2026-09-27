import { useState, useEffect, useRef } from 'react';
import Keyboard from './Keyboard';
import { speakWord } from '../words';
import { getLetterEnergy, calculateWordEnergy } from '../lib/energyScore';
import { fetchPokemon } from '../lib/pokeapi';
import { getPokemonInfo, LEGENDARY_IDS } from '../lib/pokemonData';

const getArtwork = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const MAX_WRONG = 6;

const LEGENDARY_ARR = [...LEGENDARY_IDS];

export default function BattleScreen({ word, playerPokemonId, inventory, onSpendPokemon, isVoiceMode, difficulty = 'normal', onBack, onFinish }) {
  const [playerPokemon, setPlayerPokemon] = useState(null);
  const [opponentPokemon, setOpponentPokemon] = useState(null);
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [opponentMaxHp, setOpponentMaxHp] = useState(100);
  const [lastCorrect, setLastCorrect] = useState(null);
  const [showAttackEffect, setShowAttackEffect] = useState(false);
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const [oppShake, setOppShake] = useState(false);
  const [playerShake, setPlayerShake] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [battleLog, setBattleLog] = useState('A wild Pokémon appeared!');
  const [attackCount, setAttackCount] = useState(0);
  
  // New animation states
  const [isAttacking, setIsAttacking] = useState(false);
  const [isDodging, setIsDodging] = useState(false);
  const [isJabbing, setIsJabbing] = useState(false);
  
  // Hint states
  const [hintActive, setHintActive] = useState(false);
  const [isSacrificeModalOpen, setIsSacrificeModalOpen] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  // Timed hint: letter glows on keyboard for 5s — player must press it themselves
  const [timedHintLetters, setTimedHintLetters] = useState(new Set());
  const HINT_DURATION_MS = 5000;
  

  const timerRefs = useRef([]);
  const autoHintFired = useRef(false);
  const totalWordEnergy = calculateWordEnergy(word);
  const showLog = (msg) => setBattleLog(msg);

  useEffect(() => {
    async function load() {
      try {
        const p = await fetchPokemon(playerPokemonId || 25);
        const oppId = difficulty === 'hard'
          ? LEGENDARY_ARR[Math.floor(Math.random() * LEGENDARY_ARR.length)]
          : difficulty === 'easy'
            ? Math.floor(Math.random() * 151) + 1
            : Math.floor(Math.random() * 493) + 1;
        const o = await fetchPokemon(oppId);
        if (!p || !o) return;
        const pInfo = getPokemonInfo(p.id);
        const oInfo = getPokemonInfo(o.id);
        setPlayerPokemon(p);
        setOpponentPokemon(o);
        setPlayerHp(pInfo.hp);
        setPlayerMaxHp(pInfo.hp);
        setOpponentHp(oInfo.hp);
        setOpponentMaxHp(oInfo.hp);
        showLog(`⚔️ Go, ${p.name}! Spell the word to attack!`);
        if (isVoiceMode) speakWord(word, 0.85);
      } catch (err) {
        console.error('Battle init failed', err);
      }
    }
    load();
    return () => timerRefs.current.forEach(clearTimeout);
  }, [playerPokemonId]);

  const [lastGuessedLetter, setLastGuessedLetter] = useState(null);
  
  const uniqueLetters = new Set(word.replace(/\s/g, '').split(''));
  const allGuessed = Array.from(uniqueLetters).every(l => guessedLetters.includes(l));
  const isWon = opponentHp <= 0 || allGuessed;
  const isLost = wrongGuesses >= MAX_WRONG;
  

  useEffect(() => {
    if (isWon && !isLost) {
      showLog(`🎉 You won! ${opponentPokemon?.name} was caught!`);
      timerRefs.current.push(setTimeout(() => {
        setShowResult(true);
        onFinish('win', opponentPokemon?.id);
      }, 1800));
    } else if (isLost) {
      showLog('💀 Your Pokémon fainted...');
      timerRefs.current.push(setTimeout(() => {
        setShowResult(true);
        onFinish('lose');
      }, 1500));
    }
  }, [isWon, isLost, allGuessed]);

  const handleOpenSacrificeModal = () => {
    if (!inventory || inventory.length <= 1 || isWon || isLost) return;
    setIsSacrificeModalOpen(true);
  };

  const handleConfirmHint = (chosenId) => {
    setIsSacrificeModalOpen(false);
    onSpendPokemon(chosenId);

    setHintActive(true);
    timerRefs.current.push(setTimeout(() => setHintActive(false), 1500));

    const unrevealed = Array.from(uniqueLetters).filter(l => !guessedLetters.includes(l));
    if (unrevealed.length === 0) return;

    // Pick 1 random unrevealed letter and highlight it on the keyboard for HINT_DURATION_MS.
    // The player must press it themselves — the hint does NOT auto-reveal it.
    const letter = unrevealed[Math.floor(Math.random() * unrevealed.length)];

    timerRefs.current.push(setTimeout(() => {
      setTimedHintLetters(prev => new Set([...prev, letter]));
      showLog(`⏱️ Hint: press the glowing key within 5 seconds!`);
      timerRefs.current.push(setTimeout(() => {
        setTimedHintLetters(prev => {
          const next = new Set(prev);
          next.delete(letter);
          return next;
        });
        showLog(`⌛ Hint expired! Keep going!`);
      }, HINT_DURATION_MS));
    }, 800));
  };

  const triggerDashAttack = () => {
    const pInfo = playerPokemon ? getPokemonInfo(playerPokemon.id) : { attackDamage: 30 };
    const dmg = Math.round((pInfo.attackDamage || 30) * (100 / opponentMaxHp) * 40);
    const finalDmg = Math.max(30, Math.min(50, dmg));
    
    showLog(`🔥 ${playerPokemon?.name} jumps out for a dash attack!`);
    setIsAttacking(true); // Player sprite leaves card
    
    // Dash inward timing (Impact peak is at 50% of 700ms = 350ms)
    timerRefs.current.push(setTimeout(() => {
      setOppShake(true);
      setShowAttackEffect(true);
      setOpponentHp(prev => Math.max(0, prev - finalDmg));
      setAttackCount(prev => prev + 1);
    }, 350));

    // Return and cleanup
    timerRefs.current.push(setTimeout(() => {
      setIsAttacking(false);
      setShowAttackEffect(false);
      setOppShake(false);
    }, 750));
  };

  const handleLetterPress = (letter) => {
    if (isLost || isWon || guessedLetters.includes(letter)) return;
    setGuessedLetters(prev => [...prev, letter]);

    // Clear this letter from timed hints whether correct or not
    if (timedHintLetters.has(letter)) {
      setTimedHintLetters(prev => {
        const next = new Set(prev);
        next.delete(letter);
        return next;
      });
    }
    
    if (word.includes(letter)) {
      const pts = getLetterEnergy(letter);
      const gain = totalWordEnergy > 0 ? (pts / totalWordEnergy) * 100 : 25;
      setLastCorrect(letter);
      timerRefs.current.push(setTimeout(() => setLastCorrect(null), 600));
      
      // Every correct letter triggers a rapid physical jab attack!
      setIsJabbing(true);
      timerRefs.current.push(setTimeout(() => {
        setOppShake(true);
        setShowAttackEffect(true);
      }, 160)); // Jab Impact peak at 160ms
      
      timerRefs.current.push(setTimeout(() => {
        setIsJabbing(false);
        setOppShake(false);
        setShowAttackEffect(false);
      }, 400)); // Finish recoiling
      
      showLog(`✅ "${letter.toUpperCase()}" correct! Energy charging ⚡`);
      
      setEnergy(prev => {
        const next = prev + gain;
        if (next >= 100) { triggerDashAttack(); return 0; }
        return next;
      });
    } else {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);
      const livesLeft = MAX_WRONG - newWrong;

      // Trigger enemy dodge animation on miss
      setIsDodging(true);
      showLog(`💨 Missed! The enemy dodged your attack!`);
      setShowDamageEffect(true);
      setPlayerShake(true);

      timerRefs.current.push(setTimeout(() => {
        setIsDodging(false);
        setPlayerHp(prev => Math.max(0, prev - Math.round(playerMaxHp / MAX_WRONG)));
        setShowDamageEffect(false);
      }, 600));

      timerRefs.current.push(setTimeout(() => setPlayerShake(false), 900));

      // Auto-hint: fires silently once when lives hit exactly 2.
      // Shows 1 real letter + 1 decoy for 2 seconds — player must spot and press the right one.
      // At 1 life left: no hint at all.
      if (livesLeft === 2 && !autoHintFired.current) {
        autoHintFired.current = true;
        const alreadyGuessed = new Set([...guessedLetters, letter]);
        const unrevealed = Array.from(uniqueLetters).filter(l => !alreadyGuessed.has(l));
        const wrongPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
          .filter(l => !uniqueLetters.has(l) && !alreadyGuessed.has(l));
        if (unrevealed.length > 0 && wrongPool.length > 0) {
          const hintLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          const decoy = wrongPool[Math.floor(Math.random() * wrongPool.length)];
          const AUTO_HINT_MS = 2000;
          timerRefs.current.push(setTimeout(() => {
            setTimedHintLetters(new Set([hintLetter, decoy]));
            timerRefs.current.push(setTimeout(() => {
              setTimedHintLetters(prev => {
                const next = new Set(prev);
                next.delete(hintLetter);
                next.delete(decoy);
                return next;
              });
            }, AUTO_HINT_MS));
          }, 500));
        }
      }
    }
    if (isVoiceMode) speakWord(word, 0.85);
  };

  const oppHpPct = opponentMaxHp > 0 ? Math.max(0, (opponentHp / opponentMaxHp) * 100) : 100;
  const playerHpPct = playerMaxHp > 0 ? Math.max(0, (playerHp / playerMaxHp) * 100) : 100;
  const hpColor = (pct) => pct < 20 ? '#e74c3c' : pct < 50 ? '#f39c12' : '#2ecc71';

  // Lives remaining as hearts
  const livesLeftCount = MAX_WRONG - wrongGuesses;
  const hearts = Array.from({ length: MAX_WRONG }, (_, i) => i < livesLeftCount);

  // Charge bolts (how full the energy meter is in chunks)
  const BOLT_COUNT = 5;
  const boltsFilled = Math.floor((energy / 100) * BOLT_COUNT);

  // Calculate nervousness (Gradual Sweat)
  const enemySweat = energy >= 90 ? 3 : energy >= 70 ? 2 : energy >= 45 ? 1 : 0;
  const playerSweat = playerHpPct <= 15 ? 3 : playerHpPct <= 35 ? 2 : playerHpPct <= 60 ? 1 : 0;

  return (
    <div className="bs">
      {/* ===== FIELD — top half ===== */}
      <div className="bs-field">

        {/* Top Left Home Button */}
        <button
          className="bs-home-btn"
          onClick={() => (isWon || isLost) ? onBack() : setShowHomeConfirm(true)}
          aria-label="Home"
        >
          🏠
        </button>

        {/* Top Right Hint Button */}
        <button
          className="bs-hint-btn"
          onClick={handleOpenSacrificeModal}
          disabled={!inventory || inventory.length <= 1 || isWon || isLost}
        >
          🔍 USE HINT ({inventory ? inventory.length - 1 : 0})
        </button>

        {/* Hint Magic Overlays */}
        {hintActive && (
          <div className="hint-magic-container">
             <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="hint ball" className="hint-pokeball" />
             <div className="hint-sparkles">✨</div>
          </div>
        )}

        {/* ENEMY banner — top-left, big & red */}
        <div className="bs-enemy-banner">
          <div className="bs-enemy-label">⚔️ ENEMY</div>
          {opponentPokemon && (
            <>
              <div className="bs-enemy-name">{opponentPokemon.name}</div>
              <div className="bs-hp-row">
                <span className="bs-hp-tag">HP</span>
                <div className="bs-hp-track">
                  <div className="bs-hp-fill" style={{ width: `${oppHpPct}%`, background: hpColor(oppHpPct) }} />
                </div>
                <span className="bs-hp-val" style={{ color: hpColor(oppHpPct) }}>{opponentHp}</span>
              </div>
            </>
          )}
        </div>

        {/* Opponent sprite — top-right, large */}
        {opponentPokemon && (
          <div className={`bs-opp-wrap ${oppShake ? 'bs-shake-opp' : ''} ${isDodging ? 'bs-dodge-tease' : ''} ${opponentHp <= 0 ? 'bs-faint' : ''} ${(energy >= 80 && !oppShake && !isDodging && opponentHp > 0) ? 'bs-fear-shake' : ''}`}>
            <img src={getArtwork(opponentPokemon.id)} alt={opponentPokemon.name} className="bs-opp-img" />
            {showAttackEffect && <div className="bs-hit-flash" />}
            {isDodging && <div className="bs-miss-tag">MISS!</div>}
            
            {/* Enemy Sweat Indicators directly on sprite */}
            <div className="bs-sweat-wrap enemy-sweat">
              {Array.from({ length: enemySweat }).map((_, i) => (
                <span key={i} className="bs-sweat-drop">💧</span>
              ))}
            </div>
          </div>
        )}

        {/* Player card — bottom-left */}
        {playerPokemon && (
          <div className={`bs-player-wrap ${playerShake ? 'bs-shake-player' : ''} ${isAttacking ? 'bs-player-dash' : ''} ${isLost ? 'bs-faint' : ''}`}>
            <div className="bs-tcg-card">
              <div className="bs-tcg-inner">
                <img src={getArtwork(playerPokemon.id)} alt={playerPokemon.name} className="bs-tcg-img" />
                {/* Player Sweat Indicators directly on sprite */}
                <div className="bs-sweat-wrap player-sweat">
                  {Array.from({ length: playerSweat }).map((_, i) => (
                    <span key={i} className="bs-sweat-drop">💧</span>
                  ))}
                </div>
              </div>
              <div className="bs-tcg-label">Lv.1 {playerPokemon.name}</div>
            </div>
          </div>
        )}
        
        {/* Unconstrained Ghost Attacker to fix card clipping */}
        {playerPokemon && (
          <div key={`ghost-${attackCount}`} className={`bs-attacker-ghost ${isAttacking ? 'is-dashing' : isJabbing ? 'is-jabbing' : ''}`}>
            <img src={getArtwork(playerPokemon.id)} alt="attacker" />
          </div>
        )}

        {/* Physical Hit Effect */}
        {showAttackEffect && <div className="bs-physical-hit">POW!</div>}

        {/* YOU banner — bottom-right */}
        <div className="bs-you-banner">
          <div className="bs-you-label">🛡️ YOU</div>
          {playerPokemon && (
            <>
              <div className="bs-you-name">{playerPokemon.name}</div>
              <div className="bs-hp-row">
                <span className="bs-hp-tag">HP</span>
                <div className="bs-hp-track">
                  <div className="bs-hp-fill" style={{ width: `${playerHpPct}%`, background: hpColor(playerHpPct) }} />
                </div>
                <span className="bs-hp-val" style={{ color: hpColor(playerHpPct) }}>{playerHp}</span>
              </div>
            </>
          )}
        </div>

        {/* Attack FX */}
        {showAttackEffect && <div className="bs-bolt-fx">⚡</div>}
        {showDamageEffect && <div className="bs-damage-fx">💥</div>}
        {!playerPokemon && <div className="bs-loading-field">Loading battle...</div>}
      </div>

      {/* ===== BOTTOM PANEL — ZERO DEAD SPACE ===== */}
      <div className="bs-bottom">

        {/* Row 1: Battle log */}
        <div className="bs-log">
          <span className="bs-log-text">{battleLog}</span>
        </div>

        {/* Row 2: Lives + Attack charge */}
        <div className="bs-status-row">
          <div className="bs-lives">
            <span className="bs-status-label">LIVES</span>
            <div className="bs-hearts">
              {hearts.map((alive, i) => (
                <span key={i} className={`bs-heart ${alive ? 'alive' : 'dead'}`}>
                  {alive ? '❤️' : '🖤'}
                </span>
              ))}
            </div>
          </div>
          <div className="bs-status-sep" />
          <div className="bs-charge">
            <span className="bs-status-label">CHARGE</span>
            <div className="bs-bolts">
              {Array.from({ length: BOLT_COUNT }, (_, i) => (
                <span key={i} className={`bs-bolt-icon ${i < boltsFilled ? 'charged' : ''}`}>⚡</span>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3 & 4: Packed word + keyboard */}
        <div className="bs-controls-group">
          <div className="bs-word-row">
            <button className="bs-flee-btn" onClick={onBack}>🏃</button>
            <div className="bs-word">
              {word.split('').map((char, i) => {
                if (char === ' ') return <div key={i} className="bs-letter-gap" />;
                const revealed = guessedLetters.includes(char) || isLost || isWon;
                return (
                  <div key={i} className={`bs-letter ${revealed ? 'bs-revealed' : ''} ${char === lastCorrect ? 'bs-pop' : ''}`}>
                    {revealed ? char.toUpperCase() : ''}
                  </div>
                );
              })}
            </div>
            <button className="bs-listen-btn" onClick={() => speakWord(word, 0.7)}>🔊</button>
          </div>

          <div className="bs-kb">
            <Keyboard
              guessedLetters={guessedLetters}
              word={word}
              onLetterPress={handleLetterPress}
              disabled={isWon || isLost}
              correctFlashLetters={new Set(lastCorrect ? [lastCorrect] : [])}
              timedHintLetters={timedHintLetters}
            />
          </div>
        </div>
      </div>

      {/* ===== RESULT OVERLAY ===== */}
      {showResult && (
        <div className={`bs-result ${isWon ? 'bs-win' : 'bs-lose'}`}>
          <div className="bs-result-card">
            {isWon && opponentPokemon && (
              <img src={getArtwork(opponentPokemon.id)} className="bs-result-sprite" alt="caught" />
            )}
            <div className="bs-result-emoji">{isWon ? '🎉' : '💀'}</div>
            <h2 className="bs-result-title">{isWon ? 'GOTCHA!' : 'DEFEATED!'}</h2>
            <p className="bs-result-desc">
              {isWon ? `You caught ${opponentPokemon?.name}!` : 'Your Pokémon fainted...'}
            </p>
            <button className="bs-result-btn" onClick={onBack}>Continue →</button>
          </div>
        </div>
      )}

      {/* ===== HOME CONFIRM ===== */}
      {showHomeConfirm && (
        <div className="bs-modal-overlay">
          <div className="bs-modal-content" style={{ maxWidth: '300px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏠</div>
            <h3 className="bs-modal-title">Flee the battle?</h3>
            <p className="bs-modal-desc">You'll lose the battle and return to the main screen.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <button
                className="bs-modal-close"
                onClick={() => setShowHomeConfirm(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="cta-secondary"
                onClick={onBack}
                style={{ flex: 1, padding: '10px', background: '#7f1d1d', borderColor: '#ef4444', color: '#fca5a5' }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SACRIFICE MODAL ===== */}
      {isSacrificeModalOpen && (
        <div className="bs-modal-overlay">
          <div className="bs-modal-content">
            <h3 className="bs-modal-title">Release to get Hint</h3>
            <p className="bs-modal-desc">Select a Pokémon to release back to the wild in exchange for a Hint!</p>
            <div className="bs-sac-grid">
              {inventory?.filter(p => p.id !== playerPokemonId).map(p => (
                <div key={`${p.id}-${p.caughtDate}`} className="bs-sac-card" onClick={() => handleConfirmHint(p.id)}>
                  <img src={getArtwork(p.id)} alt="spare pokemon" />
                </div>
              ))}
            </div>
            <button className="bs-modal-close" onClick={() => setIsSacrificeModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
