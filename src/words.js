// 영국 7+ ~ 8+ (KS1 & KS2) 명문 프렙스쿨 대비를 위한 고난도 스펠링 리스트 (Eton, Cambridge, King's 타겟)
export const KS1_ADVANCED_WORDS = [
  "ambitious", "beautiful", "bicycle", "brilliant", "business", 
  "calendar", "caught", "certain", "courage", "curious", 
  "delight", "different", "difficult", "disappear", "earth", 
  "eighth", "enough", "excellent", "extraordinary", "favourite", 
  "fierce", "grammar", "guarantee", "half", "handsome",
  "heart", "heritage", "imagine", "intelligent", "island", 
  "jealous", "knowledge", "language", "learn", "leisure", 
  "length", "library", "magnificent", "marvellous", "material", 
  "measure", "medicine", "minute", "mysterious", "natural", 
  "naughty", "necessary", "neighbour", "notice", "occasion", 
  "opposite", "orchestra", "peculiar", "perhaps", "popular", 
  "position", "possess", "privilege", "promise", "purpose", 
  "quarter", "question", "recent", "regular", "remember", 
  "rhythm", "sentence", "separate", "special", "straight", 
  "strange", "suppose", "surprise", "therefore", "thorough", 
  "though", "thought", "through", "treasure", "unique",
  "various", "vehicle", "weight", "women", "wonder"
];

// 음성 합성 (TTS) 헬퍼 함수
const doSpeak = (word, voices, rate) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-GB";
  utterance.rate = rate;
  utterance.pitch = 1.1;
  const ukVoice = voices.find(v => v.lang.includes("en-GB"));
  if (ukVoice) utterance.voice = ukVoice;
  window.speechSynthesis.speak(utterance);
};

export const speakWord = (word, rate = 0.85) => {
  if (!("speechSynthesis" in window)) {
    alert("Sorry, your browser doesn't support text to speech!");
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(word, voices, rate);
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', function handler() {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      doSpeak(word, window.speechSynthesis.getVoices(), rate);
    });
  }
};
