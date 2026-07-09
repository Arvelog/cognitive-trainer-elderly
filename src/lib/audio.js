import confetti from 'canvas-confetti';

const audioCtx = () => {
  if (!window._actx) window._actx = new (window.AudioContext || window.webkitAudioContext)();
  return window._actx;
};

const playTone = (freq, dur, type = 'sine') => {
  try {
    const c = audioCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0.15;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.stop(c.currentTime + dur);
  } catch (e) {
    // Audio is optional; ignore failures in browsers without support.
  }
};

export const playCorrect = () => {
  playTone(523, 0.12);
  setTimeout(() => playTone(659, 0.12), 120);
  setTimeout(() => playTone(784, 0.2), 240);
};

export const playWrong = () => {
  playTone(300, 0.15, 'square');
  setTimeout(() => playTone(250, 0.2, 'square'), 150);
};

export const playVictory = () => {
  [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.2), i * 150));
};

export const fireConfetti = () => {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
};

export const speakText = (text, { rate = 0.78, pitch = 1 } = {}) => {
  if (!text || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;

  window.speechSynthesis.cancel();
  const utterance = new window.SpeechSynthesisUtterance(String(text));
  utterance.lang = 'uk-UA';
  utterance.rate = Math.min(1.2, Math.max(0.5, Number(rate) || 0.78));
  utterance.pitch = Math.min(1.5, Math.max(0.5, Number(pitch) || 1));
  const ukrainianVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang?.toLowerCase().startsWith('uk'));
  if (ukrainianVoice) utterance.voice = ukrainianVoice;
  window.speechSynthesis.speak(utterance);
  return true;
};

export const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export const pick = (a) => a[Math.floor(Math.random() * a.length)];
