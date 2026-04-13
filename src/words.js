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
  utterance.pitch = 1.0; // 너무 높지 않게 조정

  const ukVoices = voices.filter(v => v.lang.includes("en-GB") || v.lang.includes("en_GB"));
  
  // 우선순위 결정: 정통 영국식(RP)에 가까운 대표적인 목소리들
  const priorityNames = [
    "Google UK English Female",
    "Google UK English Male",
    "Daniel",   // iOS 정통 영국식
    "Serena",   // iOS 정통 영국식
    "Arthur",   // iOS 최신 고품질
    "Martha",   // iOS 최신 고품질
    "Microsoft Susan Online", // Edge/Windows 고품질
    "Microsoft George Online",
    "Hazel"     // Windows 표준
  ];

  let selectedVoice = null;
  
  // 1. 우선순위 목록에 있는 목소리 중 가장 먼저 매칭되는 것을 찾음
  for (const name of priorityNames) {
    selectedVoice = ukVoices.find(v => v.name.includes(name));
    if (selectedVoice) break;
  }

  // 2. 만약 하나도 못 찾았다면 'Google'이나 'Online' 꼬리표가 붙은 고성능 목소리 검색
  if (!selectedVoice) {
    selectedVoice = ukVoices.find(v => v.name.includes("Google") || v.name.includes("Online"));
  }

  // 3. 그것도 없으면 그냥 첫 번째 영국식 목소리 사용
  if (!selectedVoice && ukVoices.length > 0) {
    selectedVoice = ukVoices[0];
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
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
