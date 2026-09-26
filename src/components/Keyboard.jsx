export default function Keyboard({ guessedLetters, word, onLetterPress, disabled, correctFlashLetters, glowingLetters = {}, timedHintLetters }) {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  return (
    <div className="keyboard">
      {rows.map((row, rIdx) => (
        <div key={rIdx} className="keyboard-row">
          {row.map(letter => {
            const isGuessed = guessedLetters.includes(letter);
            const isCorrect = isGuessed && word.includes(letter);
            const isWrong = isGuessed && !word.includes(letter);
            const isFlashing = correctFlashLetters?.has(letter);
            const isTimedHint = timedHintLetters?.has(letter) && !isGuessed;
            const glowClass = glowingLetters[letter] || "";

            let btnClass = `key-btn ${glowClass}`;
            if (isCorrect) btnClass += " correct";
            if (isWrong) btnClass += " wrong";
            if (isFlashing) btnClass += " key-correct-flash";
            if (isTimedHint) btnClass += " key-timed-hint";

            return (
              <button
                key={letter}
                className={btnClass}
                onClick={() => onLetterPress(letter)}
                disabled={disabled || isGuessed}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
