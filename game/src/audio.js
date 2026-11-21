// Tiny sound effects with the Web Audio API only — no audio files, no network.
let audioCtx = null;

function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

function tone(freq, ms, type, gain) {
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + ms / 1000);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + ms / 1000);
}

export function playFound() {
  tone(660, 120, 'sine', 0.12);
  setTimeout(() => tone(880, 160, 'sine', 0.12), 90);
}

export function playMiss() {
  tone(180, 180, 'square', 0.07);
}

export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 220, 'sine', 0.12), i * 130));
}

export function playClick() {
  tone(440, 60, 'triangle', 0.06);
}
