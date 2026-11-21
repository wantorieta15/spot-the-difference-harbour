// Twin Harbour — spot the difference. Two pictures side by side, seven
// differences per scene, three scenes. Mouse and keyboard play. The canvas
// holds both panels: left panel at x 0..560, right panel at x 600..1160.
import { SCENES, PANEL_W, PANEL_H } from './scenes.js';
import { playFound, playMiss, playWin, playClick } from './audio.js';

const GAP = 40;
const PANEL_X = [20, 20 + PANEL_W + GAP];
const PANEL_Y = 20;
const TOTAL_TIME = 300;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sceneLabel = document.getElementById('sceneLabel');
const counterEl = document.getElementById('counter');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const missesEl = document.getElementById('mistakes');
const messageEl = document.getElementById('message');
const hintBtn = document.getElementById('hintBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const overlay = document.getElementById('overlay');

const game = {
  scene: 0,
  found: new Set(),
  flashes: [],
  mistakes: 0,
  score: 0,
  hints: 0,
  timeLeft: TOTAL_TIME,
  status: 'title', // title | playing | sceneDone | won | lost
  cursor: { x: PANEL_W / 2, y: PANEL_H / 2, panel: 0 },
  hintMark: null,
  startedAt: null,
};

function scene() {
  return SCENES[game.scene];
}

function remaining() {
  return scene().diffs.length - game.found.size;
}

function drawPanel(panel) {
  const ox = PANEL_X[panel];
  ctx.save();
  ctx.translate(ox, PANEL_Y);
  ctx.fillStyle = '#06121f';
  ctx.fillRect(-6, -6, PANEL_W + 12, PANEL_H + 12);
  scene().paint(ctx, panel);
  // markers on the differences already found
  let n = 0;
  for (const idx of game.found) {
    n += 1;
    const d = scene().diffs[idx];
    ctx.strokeStyle = '#2ee66b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#2ee66b';
    ctx.beginPath();
    ctx.arc(d.x, d.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#06210f';
    ctx.font = 'bold 13px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), d.x, d.y + 1);
  }
  // hint ring, if a hint is showing
  if (game.hintMark !== null) {
    const d = scene().diffs[game.hintMark];
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // wrong-click flashes
  for (const f of game.flashes) {
    if (f.panel !== panel) continue;
    ctx.strokeStyle = 'rgba(230, 57, 70, 0.9)';
    ctx.lineWidth = 4;
    const s = 12;
    ctx.beginPath();
    ctx.moveTo(f.x - s, f.y - s);
    ctx.lineTo(f.x + s, f.y + s);
    ctx.moveTo(f.x + s, f.y - s);
    ctx.lineTo(f.x - s, f.y + s);
    ctx.stroke();
  }
  // keyboard cursor
  if (game.status === 'playing' && game.cursor.panel === panel) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.cursor.x, game.cursor.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(game.cursor.x - 20, game.cursor.y);
    ctx.lineTo(game.cursor.x - 8, game.cursor.y);
    ctx.moveTo(game.cursor.x + 8, game.cursor.y);
    ctx.lineTo(game.cursor.x + 20, game.cursor.y);
    ctx.moveTo(game.cursor.x, game.cursor.y - 20);
    ctx.lineTo(game.cursor.x, game.cursor.y - 8);
    ctx.moveTo(game.cursor.x, game.cursor.y + 8);
    ctx.lineTo(game.cursor.x, game.cursor.y + 20);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrame() {
  ctx.fillStyle = '#0d1b2a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPanel(0);
  drawPanel(1);
  // panel labels
  ctx.fillStyle = '#eaf2f8';
  ctx.font = 'bold 15px Trebuchet MS, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('A', PANEL_X[0] + 4, PANEL_Y - 4 + 4);
  ctx.fillText('B', PANEL_X[1] + 4, PANEL_Y - 4 + 4);
}

function refreshHud() {
  const s = scene();
  sceneLabel.textContent = `Scene ${game.scene + 1} / ${SCENES.length} — ${s.name}`;
  counterEl.textContent = `${remaining()} difference${remaining() === 1 ? '' : 's'} left`;
  const m = Math.floor(Math.max(0, game.timeLeft) / 60);
  const sec = Math.max(0, game.timeLeft) % 60;
  timerEl.textContent = `${m}:${String(sec).padStart(2, '0')}`;
  scoreEl.textContent = `Score ${game.score}`;
  missesEl.textContent = `Misses ${game.mistakes}`;
  nextBtn.disabled = game.status !== 'sceneDone';
}

function showOverlay(html) {
  overlay.innerHTML = `<div class="panel">${html}</div>`;
  overlay.style.display = 'flex';
}

function hideOverlay() {
  overlay.style.display = 'none';
  overlay.innerHTML = '';
}

function pickAt(panel, x, y) {
  const diffs = scene().diffs;
  for (let i = 0; i < diffs.length; i++) {
    if (game.found.has(i)) continue;
    const d = diffs[i];
    const dx = x - d.x;
    const dy = y - d.y;
    if (dx * dx + dy * dy <= (d.r + 8) * (d.r + 8)) return i;
  }
  return -1;
}

function selectAt(panel, x, y) {
  if (game.status !== 'playing') return;
  const idx = pickAt(panel, x, y);
  if (idx >= 0) {
    game.found.add(idx);
    game.score += 100;
    playFound();
    const d = scene().diffs[idx];
    messageEl.textContent = `Found it — ${d.label}! ${remaining()} to go.`;
    if (remaining() === 0) sceneComplete();
  } else {
    game.mistakes += 1;
    game.score = Math.max(0, game.score - 25);
    game.flashes.push({ panel, x, y, at: Date.now() });
    setTimeout(() => {
      game.flashes.shift();
      drawFrame();
    }, 700);
    playMiss();
    messageEl.textContent = 'Not a difference — minus 25 points. Look closer!';
  }
  refreshHud();
  drawFrame();
}

function sceneComplete() {
  game.status = 'sceneDone';
  const bonus = game.timeLeft * 2;
  game.score += bonus;
  playWin();
  if (game.scene + 1 >= SCENES.length) {
    game.status = 'won';
    showOverlay(
      `<h2>YOU FOUND THEM ALL!</h2><p>Every difference in all three harbour scenes — ` +
        `sunset, cove and market — is circled.</p>` +
        `<p class="big">Final score: ${game.score}</p>` +
        `<p>Press R to play again.</p>`,
    );
  } else {
    showOverlay(
      `<h2>SCENE CLEAR!</h2><p>All 7 differences in ${scene().name} found.</p>` +
        `<p class="big">Time bonus +${bonus} — score ${game.score}</p>` +
        `<p>Press N for the next scene.</p>`,
    );
  }
  refreshHud();
}

function nextScene() {
  if (game.status !== 'sceneDone') return;
  game.scene += 1;
  game.found = new Set();
  game.hintMark = null;
  game.status = 'playing';
  hideOverlay();
  messageEl.textContent = `Scene ${game.scene + 1}: ${scene().name} — find 7 differences!`;
  refreshHud();
  drawFrame();
}

function restart() {
  game.scene = 0;
  game.found = new Set();
  game.flashes = [];
  game.mistakes = 0;
  game.score = 0;
  game.hints = 0;
  game.timeLeft = TOTAL_TIME;
  game.status = 'playing';
  game.hintMark = null;
  game.startedAt = Date.now();
  hideOverlay();
  messageEl.textContent = 'Scene 1: Sunset Harbour — find 7 differences!';
  refreshHud();
  drawFrame();
}

function useHint() {
  if (game.status !== 'playing') return;
  const left = scene().diffs.map((d, i) => i).filter((i) => !game.found.has(i));
  if (left.length === 0) return;
  game.hintMark = left[Math.floor(Math.random() * left.length)];
  game.hints += 1;
  game.score = Math.max(0, game.score - 50);
  playClick();
  messageEl.textContent = `Hint: something differs inside the gold ring (−50 points).`;
  refreshHud();
  drawFrame();
  setTimeout(() => {
    game.hintMark = null;
    drawFrame();
  }, 2500);
}

function tick() {
  if (game.status === 'playing') {
    game.timeLeft -= 1;
    if (game.timeLeft <= 0) {
      game.timeLeft = 0;
      game.status = 'lost';
      showOverlay(
        `<h2>TIME UP!</h2><p>You found ${SCENES.reduce((a, s, i) => a + (i < game.scene ? s.diffs.length : 0), 0) + game.found.size} ` +
          `of 21 differences.</p><p class="big">Score: ${game.score}</p><p>Press R to try again.</p>`,
      );
    }
    refreshHud();
  }
}

canvas.addEventListener('click', (ev) => {
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  const cx = (ev.clientX - r.left) * sx;
  const cy = (ev.clientY - r.top) * sy;
  for (let p = 0; p < 2; p++) {
    const x0 = PANEL_X[p];
    if (cx >= x0 && cx < x0 + PANEL_W && cy >= PANEL_Y && cy < PANEL_Y + PANEL_H) {
      game.cursor = { x: cx - x0, y: cy - PANEL_Y, panel: p };
      selectAt(p, cx - x0, cy - PANEL_Y);
      return;
    }
  }
});

canvas.addEventListener('mousemove', (ev) => {
  if (game.status !== 'playing') return;
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  const cx = (ev.clientX - r.left) * sx;
  const cy = (ev.clientY - r.top) * sy;
  for (let p = 0; p < 2; p++) {
    const x0 = PANEL_X[p];
    if (cx >= x0 && cx < x0 + PANEL_W && cy >= PANEL_Y && cy < PANEL_Y + PANEL_H) {
      game.cursor = { x: cx - x0, y: cy - PANEL_Y, panel: p };
      drawFrame();
      return;
    }
  }
});

document.addEventListener('keydown', (ev) => {
  const step = ev.shiftKey ? 24 : 8;
  if (game.status === 'title' && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault();
    restart();
    return;
  }
  if (ev.key === 'r' || ev.key === 'R') {
    restart();
    return;
  }
  if (ev.key === 'n' || ev.key === 'N') {
    nextScene();
    return;
  }
  if (ev.key === 'h' || ev.key === 'H') {
    useHint();
    return;
  }
  if (game.status !== 'playing') return;
  const c = game.cursor;
  if (ev.key === 'ArrowLeft') {
    c.x = Math.max(0, c.x - step);
    ev.preventDefault();
  } else if (ev.key === 'ArrowRight') {
    c.x = Math.min(PANEL_W, c.x + step);
    ev.preventDefault();
  } else if (ev.key === 'ArrowUp') {
    c.y = Math.max(0, c.y - step);
    ev.preventDefault();
  } else if (ev.key === 'ArrowDown') {
    c.y = Math.min(PANEL_H, c.y + step);
    ev.preventDefault();
  } else if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    selectAt(c.panel, c.x, c.y);
    return;
  } else if (ev.key === 'Tab') {
    c.panel = 1 - c.panel;
    ev.preventDefault();
  } else {
    return;
  }
  drawFrame();
});

hintBtn.addEventListener('click', useHint);
nextBtn.addEventListener('click', nextScene);
restartBtn.addEventListener('click', restart);

// Screenshot presets, used only to take the entry's own screenshots:
// ?shot=start  title screen, ?shot=play  scene 1 with 3 found, 4 left,
// ?shot=play2  scene 2 with 2 found, 5 left, ?shot=win  finished game.
function applyShot() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (shot === 'play') {
    game.status = 'playing';
    game.startedAt = Date.now();
    game.found = new Set([0, 1, 2]);
    game.score = 300;
    game.timeLeft = 241;
    messageEl.textContent = 'Found it — the sun! 4 to go.';
  } else if (shot === 'play2') {
    game.scene = 1;
    game.status = 'playing';
    game.startedAt = Date.now();
    game.found = new Set([0, 3]);
    game.score = 520;
    game.timeLeft = 188;
    messageEl.textContent = 'Found it — a wave crest! 5 to go.';
  } else if (shot === 'win') {
    game.scene = 2;
    game.status = 'won';
    game.found = new Set([0, 1, 2, 3, 4, 5, 6]);
    game.score = 2840;
    game.timeLeft = 96;
    showOverlay(
      `<h2>YOU FOUND THEM ALL!</h2><p>Every difference in all three harbour scenes — ` +
        `sunset, cove and market — is circled.</p>` +
        `<p class="big">Final score: 2840</p><p>Press R to play again.</p>`,
    );
  } else {
    game.status = 'title';
    showOverlay(
      `<h2>TWIN HARBOUR</h2><p>Two pictures of the same harbour — but seven things ` +
        `are different. Find them all before the clock runs out!</p>` +
        `<p>3 scenes &middot; 7 differences each &middot; mouse or keyboard</p>` +
        `<p class="big">Click anywhere or press Enter to start</p>`,
    );
  }
  refreshHud();
  drawFrame();
}

overlay.addEventListener('click', () => {
  if (game.status === 'title') restart();
});

setInterval(tick, 1000);
applyShot();
