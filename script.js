// ==========================================
// Hindi Pronunciation App for Kids - Logic
// ==========================================

// --- Word List Data ---
const WORDS = [
  { emoji: '🥭', hindi: 'आम', phonetic: 'Aam', english: 'Mango', category: 'Fruit', synonyms: ['आम', 'aam', 'aang'] },
  { emoji: '🍌', hindi: 'केला', phonetic: 'Kela', english: 'Banana', category: 'Fruit', synonyms: ['केला', 'kela'] },
  { emoji: '🍎', hindi: 'सेब', phonetic: 'Seb', english: 'Apple', category: 'Fruit', synonyms: ['सेब', 'seb', 'sheb'] },
  { emoji: '🐱', hindi: 'बिल्ली', phonetic: 'Billi', english: 'Cat', category: 'Animal', synonyms: ['बिल्ली', 'billi', 'bily'] },
  { emoji: '🐶', hindi: 'कुत्ता', phonetic: 'Kutta', english: 'Dog', category: 'Animal', synonyms: ['कुत्ता', 'kutta', 'kuta'] },
  { emoji: '🐘', hindi: 'हाथी', phonetic: 'Haathi', english: 'Elephant', category: 'Animal', synonyms: ['हाथी', 'hathi', 'haathi'] },
  { emoji: '🦁', hindi: 'शेर', phonetic: 'Sher', english: 'Lion', category: 'Animal', synonyms: ['शेर', 'sher', 'ser'] },
  { emoji: '☀️', hindi: 'सूरज', phonetic: 'Suraj', english: 'Sun', category: 'Nature', synonyms: ['सूरज', 'suraj', 'surya', 'sury'] },
  { emoji: '🔴', hindi: 'लाल', phonetic: 'Laal', english: 'Red', category: 'Color', synonyms: ['लाल', 'laal', 'lal'] },
  { emoji: '🟢', hindi: 'हरा', phonetic: 'Hara', english: 'Green', category: 'Color', synonyms: ['हरा', 'hara'] },
];

// --- App State ---
let currentIndex = 0;
let score = 0;
let completedStars = new Array(WORDS.length).fill(false); // Tracks which words have been correctly pronounced
let isListening = false;
let audioCtx = null;
let hindiVoice = null;

// Speech APIs References
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

// --- Initialize Speech Recognition ---
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'hi-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
}

// --- DOM References ---
const splashScreen = document.getElementById('splash-screen');
const gameScreen = document.getElementById('game-screen');
const completionScreen = document.getElementById('completion-screen');

const startBtn = document.getElementById('start-btn');
const homeBtn = document.getElementById('home-btn');
const resetBtn = document.getElementById('reset-btn');
const soundToggle = document.getElementById('sound-toggle');
const listenBtn = document.getElementById('listen-btn');
const micBtn = document.getElementById('mic-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const revealBtn = document.getElementById('reveal-btn');
const replayBtn = document.getElementById('replay-btn');

const scoreText = document.getElementById('score-text');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar');
const starsTrack = document.getElementById('stars-track');
const wordCategory = document.getElementById('word-category');
const wordEmoji = document.getElementById('word-emoji');
const wordHindi = document.getElementById('word-hindi');
const wordPhonetic = document.getElementById('word-phonetic');
const wordEnglish = document.getElementById('word-english');
const cardStatusBadge = document.getElementById('card-status-badge');

const statusBubble = document.getElementById('status-bubble');
const statusText = document.getElementById('status-text');
const micPulseRing = document.getElementById('mic-pulse-ring');
const micIcon = document.getElementById('mic-icon');
const recordingDots = document.getElementById('recording-dots');
const bgBubblesContainer = document.getElementById('bg-bubbles-container');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

// Resize Canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize sound context
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Check Sound Preference
function soundsEnabled() {
  return soundToggle.checked;
}

// --- Sound Synthesizer (Web Audio API) ---
function playSoundTone(freqs, type, duration, slide = false) {
  if (!soundsEnabled()) return;
  initAudio();
  
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = type;
  
  if (slide && freqs.length > 1) {
    osc.frequency.setValueAtTime(freqs[0], now);
    osc.frequency.exponentialRampToValueAtTime(freqs[1], now + duration);
  } else {
    // Sequence of discrete notes
    let timeOffset = 0;
    const noteLength = duration / freqs.length;
    freqs.forEach((freq, idx) => {
      osc.frequency.setValueAtTime(freq, now + timeOffset);
      timeOffset += noteLength;
    });
  }
  
  gainNode.gain.setValueAtTime(0.15, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start(now);
  osc.stop(now + duration);
}

// Custom Sounds
function playClickSound() {
  // Bubble Pop sound
  playSoundTone([800, 1500], 'sine', 0.1, true);
}

function playSuccessSound() {
  // Joyful rising arpeggio (C5 - E5 - G5 - C6)
  playSoundTone([523.25, 659.25, 783.99, 1046.50], 'triangle', 0.45);
}

function playRetrySound() {
  // Gentle encouraging descending tones (A4 -> E4)
  playSoundTone([440.00, 329.63], 'sine', 0.35);
}

function playMicStartSound() {
  // Small friendly double note
  playSoundTone([600, 900], 'sine', 0.12);
}

// --- Speech Synthesis (Hindi TTS) ---
function initVoices() {
  // Speech synthesis voices load asynchronously
  if (window.speechSynthesis) {
    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      hindiVoice = voices.find(voice => voice.lang.includes('hi') || voice.lang.includes('hi-IN'));
    };
    checkVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }
  }
}
initVoices();

function speakWord(text) {
  if (!window.speechSynthesis) {
    updateStatusBubble("Text to speech is not supported in this browser. 😔");
    return;
  }
  
  // Stop existing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN';
  utterance.rate = 0.82; // Slower rate so child can absorb pronunciation
  utterance.pitch = 1.1; // Cute slightly higher pitched voice for kids
  
  if (hindiVoice) {
    utterance.voice = hindiVoice;
  }
  
  utterance.onstart = () => {
    listenBtn.classList.add('bg-indigo-700', 'scale-105');
  };
  
  utterance.onend = () => {
    listenBtn.classList.remove('bg-indigo-700', 'scale-105');
  };
  
  window.speechSynthesis.speak(utterance);
}

function speakFeedback(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN';
  utterance.rate = 0.85;
  utterance.pitch = 1.15;
  if (hindiVoice) {
    utterance.voice = hindiVoice;
  }
  window.speechSynthesis.speak(utterance);
}

// --- Dynamic Floating Emojis Background ---
const FLOATING_EMOJIS = ['🎈', '🧸', '🥭', '🍌', '🍎', '🐱', '🐶', '🐘', '🦁', '☀️', '⭐', '🌈', '🍭', '🍦', '🍩'];
function createFloatingBackgroundBubbles() {
  bgBubblesContainer.innerHTML = '';
  const numBubbles = 15;
  for (let i = 0; i < numBubbles; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bg-bubble flex items-center justify-center';
    
    // Pick random emoji
    const emoji = FLOATING_EMOJIS[Math.floor(Math.random() * FLOATING_EMOJIS.length)];
    bubble.innerText = emoji;
    
    // Random size (30px to 80px)
    const size = Math.floor(Math.random() * 50) + 30;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.fontSize = `${size * 0.6}px`;
    
    // Random horizontal position
    bubble.style.left = `${Math.random() * 100}vw`;
    
    // Random animation delay and duration
    bubble.style.animationDelay = `${Math.random() * 10}s`;
    bubble.style.animationDuration = `${Math.random() * 10 + 10}s`; // 10s to 20s
    
    bgBubblesContainer.appendChild(bubble);
  }
}
createFloatingBackgroundBubbles();

// --- Confetti / Star Particles Animation ---
let particles = [];
class StarParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 20 + 15;
    
    // Color schemes (Pastel / Playful)
    const colors = [
      '#FF6B6B', // Coral Red
      '#4D96FF', // Sky Blue
      '#6BCB77', // Pastel Green
      '#FFD93D', // Yellow Star
      '#FF8AAE', // Cute Pink
      '#9B5DE5', // Purple
      '#00F5D4'  // Cyan
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    
    // Outward explosion speed
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 4;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 5; // upward bias
    
    this.rotation = Math.random() * Math.PI * 2;
    this.vRotation = (Math.random() - 0.5) * 0.2;
    
    this.gravity = 0.18;
    this.drag = 0.98;
    this.alpha = 1.0;
    this.fadeSpeed = Math.random() * 0.015 + 0.01;
  }
  
  update() {
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.vRotation;
    this.alpha -= this.fadeSpeed;
  }
  
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    
    // Draw Star Shape
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = this.size;
    const innerRadius = this.size / 2;
    let rot = Math.PI / 2 * 3;
    let cx = 0;
    let cy = 0;
    let step = Math.PI / spikes;

    ctx.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
      cx = Math.cos(rot) * outerRadius;
      cy = Math.sin(rot) * outerRadius;
      ctx.lineTo(cx, cy);
      rot += step;

      cx = Math.cos(rot) * innerRadius;
      cy = Math.sin(rot) * innerRadius;
      ctx.lineTo(cx, cy);
      rot += step;
    }
    ctx.lineTo(0, -outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function spawnStarsConfetti() {
  const cardBounds = document.getElementById('flashcard').getBoundingClientRect();
  const centerX = cardBounds.left + cardBounds.width / 2;
  const centerY = cardBounds.top + cardBounds.height / 2;
  
  // Create 60 star particles
  for (let i = 0; i < 60; i++) {
    particles.push(new StarParticle(centerX, centerY));
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Filter active particles
  particles = particles.filter(p => p.alpha > 0);
  
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  
  requestAnimationFrame(animateParticles);
}
// Start Animation Loop
animateParticles();

// --- Speech Recognition Logic ---
function initSpeechRecognition() {
  if (!recognition) {
    updateStatusBubble("Oops! Speech Recognition is not supported in this browser. Please use Chrome/Edge for voice inputs!");
    return;
  }

  recognition.onstart = () => {
    isListening = true;
    playMicStartSound();
    
    // UI states when listening
    micPulseRing.classList.remove('scale-100', 'opacity-0');
    micPulseRing.classList.add('animate-pulse-glow', 'scale-110', 'opacity-60');
    micIcon.classList.add('hidden');
    recordingDots.classList.remove('hidden');
    
    statusBubble.classList.remove('bg-slate-100', 'border-slate-200');
    statusBubble.classList.add('bg-pink-100', 'border-pink-200');
    updateStatusBubble("Listening... बोलिए! 🎙️");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim().toLowerCase();
    evaluateSpeech(transcript);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    
    // Normal Error Responses
    let message = "Oops, I couldn't hear clearly. Try again! 💫";
    if (event.error === 'not-allowed') {
      message = "Microphone permission is blocked! Please enable it in your browser address bar. 🎙️❌";
    } else if (event.error === 'no-speech') {
      message = "No speech detected. Speak clearly into your mic! 🎙️👶";
    }
    
    statusBubble.classList.remove('bg-pink-100', 'border-pink-200');
    statusBubble.classList.add('bg-amber-100', 'border-amber-200');
    updateStatusBubble(message);
    playRetrySound();
    resetMicUI();
  };

  recognition.onend = () => {
    isListening = false;
    resetMicUI();
  };
}

function resetMicUI() {
  micPulseRing.classList.remove('animate-pulse-glow', 'scale-110', 'opacity-60');
  micPulseRing.classList.add('scale-100', 'opacity-0');
  micIcon.classList.remove('hidden');
  recordingDots.classList.add('hidden');
}

function toggleListening() {
  playClickSound();
  if (!SpeechRecognition) {
    updateStatusBubble("Voice recognition is unavailable on this browser. Try Skip/Key button to proceed! 🔑");
    return;
  }
  
  if (isListening) {
    recognition.stop();
  } else {
    initAudio();
    recognition.start();
  }
}

// --- Normalize and Match Word Logic ---
function cleanString(str) {
  // Remove spaces, basic punctuation, and normalize unicode Hindi letters if any
  return str.replace(/[\s\.,-\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
}

function evaluateSpeech(transcript) {
  const currentWord = WORDS[currentIndex];
  const cleanedTranscript = cleanString(transcript);
  
  console.log(`Target: ${currentWord.hindi} / Phonetic: ${currentWord.phonetic}`);
  console.log(`Heard: ${transcript} (Cleaned: ${cleanedTranscript})`);
  
  // Check matching rules
  let isMatch = false;
  
  // Check exact Devanagari match
  if (cleanedTranscript.includes(cleanString(currentWord.hindi)) || cleanString(currentWord.hindi).includes(cleanedTranscript)) {
    isMatch = true;
  }
  
  // Check custom phonetic synonyms mapping
  if (!isMatch && currentWord.synonyms) {
    for (let syn of currentWord.synonyms) {
      if (cleanedTranscript.includes(cleanString(syn)) || cleanString(syn).includes(cleanedTranscript)) {
        isMatch = true;
        break;
      }
    }
  }

  // Also check if transcription sounds like phonetic or English transcription
  if (!isMatch && cleanedTranscript === cleanString(currentWord.phonetic)) {
    isMatch = true;
  }

  if (isMatch) {
    handleSuccess();
  } else {
    handleMismatch(transcript);
  }
}

function handleSuccess(isSkip = false) {
  playSuccessSound();
  spawnStarsConfetti();
  
  // Update Word Stars mapping
  if (!completedStars[currentIndex]) {
    completedStars[currentIndex] = true;
    score++;
    updateStarsCounter();
  }
  
  cardStatusBadge.classList.remove('hidden');
  
  statusBubble.classList.remove('bg-pink-100', 'border-pink-200', 'bg-slate-100', 'border-slate-200');
  statusBubble.classList.add('bg-green-100', 'border-green-200');
  
  if (isSkip) {
    updateStatusBubble(`Skipped! Let's go to the next word! 🔑`);
    speakFeedback("स्किप");
  } else {
    updateStatusBubble(`🎉 बहुत बढ़िया! (Superb!) You pronounced it correctly! Let's go to the next word!`);
    speakFeedback("ठीक है");
  }
  
  // Highlight "Next" button in cheerful green animation
  nextBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
  nextBtn.classList.add('bg-green-500', 'hover:bg-green-600', 'animate-bounce');
  
  // Update progress star map
  renderProgressStars();
}

function handleMismatch(heardText) {
  playRetrySound();
  
  statusBubble.classList.remove('bg-pink-100', 'border-pink-200', 'bg-green-100', 'border-green-200');
  statusBubble.classList.add('bg-yellow-100', 'border-yellow-200');
  
  const displayHeard = heardText ? `"${heardText}"` : "nothing";
  updateStatusBubble(`💫 You said ${displayHeard}. Let's try again! Speak slowly and listen first! 🗣️`);
  
  speakFeedback("गलत है फिर से कोशिश करें");
  
  // Wobble card animation for fun
  const flashcard = document.getElementById('flashcard');
  flashcard.classList.add('animate-wobble');
  setTimeout(() => flashcard.classList.remove('animate-wobble'), 500);
}

// --- Navigation and Rendering ---
function renderWordCard() {
  const word = WORDS[currentIndex];
  
  // Render details
  wordCategory.innerText = word.category;
  wordEmoji.innerText = word.emoji;
  wordHindi.innerText = word.hindi;
  wordPhonetic.innerText = `"${word.phonetic}"`;
  wordEnglish.innerText = `meaning: ${word.english}`;
  
  // Reset success styling
  cardStatusBadge.classList.add('hidden');
  nextBtn.classList.remove('bg-green-500', 'hover:bg-green-600', 'animate-bounce');
  nextBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
  
  // Reset Status Balloon
  statusBubble.className = "bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl py-3.5 px-5 text-sm font-semibold max-w-sm mb-5 relative w-full shadow-inner transition-colors duration-300";
  
  if (completedStars[currentIndex]) {
    cardStatusBadge.classList.remove('hidden');
    updateStatusBubble("✨ You already earned a star for this word! Press Listen or speak to review!");
  } else {
    updateStatusBubble(`First listen to pronunciation, then click mic to say "${word.hindi}"!`);
  }
  
  // Nav buttons states
  prevBtn.disabled = (currentIndex === 0);
  prevBtn.style.opacity = (currentIndex === 0) ? "0.5" : "1";
  
  // Update progress tracking
  progressText.innerText = `${currentIndex + 1} / ${WORDS.length} Words`;
  progressBar.style.width = `${((currentIndex + 1) / WORDS.length) * 100}%`;
  
  renderProgressStars();
}

function updateStatusBubble(text) {
  statusText.innerText = text;
}

function updateStarsCounter() {
  scoreText.innerText = score;
}

function renderProgressStars() {
  starsTrack.innerHTML = '';
  WORDS.forEach((_, idx) => {
    const starSpan = document.createElement('span');
    starSpan.className = 'transition-transform duration-300 cursor-pointer hover:scale-125';
    starSpan.innerText = completedStars[idx] ? '⭐' : '☆';
    starSpan.title = `Word ${idx + 1}`;
    starSpan.onclick = () => {
      playClickSound();
      currentIndex = idx;
      renderWordCard();
    };
    starsTrack.appendChild(starSpan);
  });
}

function nextWord() {
  playClickSound();
  if (currentIndex < WORDS.length - 1) {
    currentIndex++;
    renderWordCard();
  } else {
    // Game completed! Show congratulations screen
    showScreen(completionScreen);
    document.getElementById('final-score-text').innerText = `${score} / ${WORDS.length}`;
    if (score === WORDS.length) {
      // Perfect Score confetti shower!
      setTimeout(spawnStarsConfetti, 300);
      setTimeout(spawnStarsConfetti, 800);
    }
  }
}

function prevWord() {
  playClickSound();
  if (currentIndex > 0) {
    currentIndex--;
    renderWordCard();
  }
}

// Force unlock skip word
function revealWord() {
  playClickSound();
  handleSuccess(true);
  
  // Auto-advance to the next word after a brief delay so they hear "स्किप"
  setTimeout(() => {
    nextWord();
  }, 1200);
}

// Restart session
function restartGame() {
  playClickSound();
  currentIndex = 0;
  score = 0;
  completedStars.fill(false);
  updateStarsCounter();
  showScreen(gameScreen);
  renderWordCard();
}

// Screen Switch utility
function showScreen(target) {
  [splashScreen, gameScreen, completionScreen].forEach(screen => {
    screen.classList.add('hidden');
  });
  target.classList.remove('hidden');
}

// --- Wire Up Event Listeners ---
startBtn.addEventListener('click', () => {
  initAudio();
  playClickSound();
  showScreen(gameScreen);
  renderWordCard();
});

homeBtn.addEventListener('click', () => {
  playClickSound();
  showScreen(splashScreen);
});

resetBtn.addEventListener('click', () => {
  if (confirm("Restart from the beginning? All your golden stars will reset!")) {
    restartGame();
  }
});

listenBtn.addEventListener('click', () => {
  playClickSound();
  const targetWord = WORDS[currentIndex].hindi;
  speakWord(targetWord);
});

wordEmoji.addEventListener('click', () => {
  // Easter egg: make it bounce and repeat pronunciation when emoji clicked
  wordEmoji.classList.add('animate-bounce');
  setTimeout(() => wordEmoji.classList.remove('animate-bounce'), 1000);
  speakWord(WORDS[currentIndex].hindi);
});

micBtn.addEventListener('click', toggleListening);
prevBtn.addEventListener('click', prevWord);
nextBtn.addEventListener('click', nextWord);
revealBtn.addEventListener('click', revealWord);
replayBtn.addEventListener('click', restartGame);

// Load Speech Recognition support check
initSpeechRecognition();
