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
  if (window.confetti) {
    window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
    return;
  }

  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
  s.onload = () => window.confetti && window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
  document.head.appendChild(s);
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
