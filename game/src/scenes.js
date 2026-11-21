// Twin Harbour scenes: every scene is painted twice from the same code.
// variant 0 = left picture, variant 1 = right picture. The seven differences
// of a scene are the places where the two variants deliberately disagree.
// All art is drawn with plain canvas shapes — no image files, no network.
//
// Panel size: 560 x 420. Difference coordinates live in that space.

export const PANEL_W = 560;
export const PANEL_H = 420;

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function poly(ctx, points, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function gull(ctx, x, y, s) {
  ctx.strokeStyle = '#24303a';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, y);
  ctx.quadraticCurveTo(x - 4 * s, y - 7 * s, x, y);
  ctx.quadraticCurveTo(x + 4 * s, y - 7 * s, x + 9 * s, y);
  ctx.stroke();
}

function cloud(ctx, x, y, s) {
  circle(ctx, x, y, 20 * s, '#ffffff');
  circle(ctx, x + 18 * s, y + 4 * s, 15 * s, '#ffffff');
  circle(ctx, x - 18 * s, y + 5 * s, 14 * s, '#ffffff');
  rect(ctx, x - 26 * s, y, 52 * s, 12 * s, '#ffffff');
}

function boat(ctx, x, y, s, hull, flag) {
  poly(ctx, [[x - 42 * s, y], [x + 42 * s, y], [x + 30 * s, y + 16 * s], [x - 30 * s, y + 16 * s]], hull);
  ctx.strokeStyle = '#5b3a1e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 52 * s);
  ctx.stroke();
  poly(ctx, [[x + 2, y - 50 * s], [x + 2, y - 12 * s], [x + 34 * s, y - 12 * s]], '#f4f1de');
  poly(ctx, [[x, y - 52 * s], [x + 26 * s, y - 44 * s], [x, y - 38 * s]], flag);
}

function lighthouse(ctx, x, baseY, h, lit) {
  const w = 46;
  rect(ctx, x - w / 2, baseY - h, w, h, '#f4f1de');
  rect(ctx, x - w / 2, baseY - h, w, 16, '#c0392b');
  rect(ctx, x - w / 2, baseY - h + 44, w, 16, '#c0392b');
  rect(ctx, x - w / 2, baseY - h + 88, w, 16, '#c0392b');
  rect(ctx, x - 16, baseY - h - 18, 32, 18, '#2c3e50');
  circle(ctx, x, baseY - h - 9, 7, lit ? '#ffd166' : '#3a4a56');
  if (lit) {
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 16, baseY - h - 9);
    ctx.lineTo(x - 90, baseY - h + 14);
    ctx.moveTo(x + 16, baseY - h - 9);
    ctx.lineTo(x + 90, baseY - h + 14);
    ctx.stroke();
  }
  rect(ctx, x - 10, baseY - h + 26, 20, 14, lit ? '#ffd166' : '#33414d');
}

function sea(ctx, y, top, deep) {
  const g = ctx.createLinearGradient(0, y, 0, PANEL_H);
  g.addColorStop(0, top);
  g.addColorStop(1, deep);
  ctx.fillStyle = g;
  ctx.fillRect(0, y, PANEL_W, PANEL_H - y);
}

function sky(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PANEL_W, 300);
}

function waves(ctx, y, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 3;
  for (const wx of [40, 150, 260, 380, 480]) {
    ctx.beginPath();
    ctx.moveTo(wx, y);
    ctx.quadraticCurveTo(wx + 14, y - 9, wx + 28, y);
    ctx.quadraticCurveTo(wx + 42, y + 9, wx + 56, y);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Scene 1 — Sunset Harbour
// ---------------------------------------------------------------------------
function paintSunset(ctx, v) {
  sky(ctx, '#ff9a5a', '#ffd6a5');
  if (v === 0) circle(ctx, 470, 70, 30, '#fff3b0'); // sun present on the left
  if (v === 1) {
    // right picture: the sun is gone, only its glow stays
    ctx.fillStyle = 'rgba(255, 243, 176, 0.35)';
    ctx.beginPath();
    ctx.arc(470, 70, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  cloud(ctx, 250, 60, 1);
  if (v === 1) { /* cloud stays on both sides; difference 7 is the second cloud */ }
  cloud(ctx, 120, 45, 0.7);
  if (v === 0) cloud(ctx, 330, 110, 0.6);
  gull(ctx, 150, 90, 1);
  gull(ctx, 200, 70, 0.8);
  if (v === 0) gull(ctx, 105, 120, 0.9);
  lighthouse(ctx, 110, 300, 150, v === 0);
  sea(ctx, 300, '#e07a5f', '#3d5a80');
  waves(ctx, 330, 'rgba(255,255,255,0.5)');
  waves(ctx, 375, 'rgba(255,255,255,0.35)');
  boat(ctx, 300, 300, 1, '#8d5a2b', v === 0 ? '#c0392b' : '#2471a3');
  boat(ctx, 450, 330, 0.65, '#5b7d5a', '#c0392b');
  // buoy
  if (v === 0) {
    circle(ctx, 90, 340, 12, '#e63946');
    rect(ctx, 86, 322, 8, 10, '#e63946');
  }
  // dock crates
  rect(ctx, 400, 350, 120, 12, '#6b4226');
  rect(ctx, 410, 330, 22, 20, '#a67c52');
  rect(ctx, 436, 330, 22, 20, '#8d6b45');
  if (v === 0) rect(ctx, 462, 330, 22, 20, '#a67c52');
}

// ---------------------------------------------------------------------------
// Scene 2 — Lighthouse Cove
// ---------------------------------------------------------------------------
function paintCove(ctx, v) {
  sky(ctx, '#1d3557', '#457b9d');
  circle(ctx, 60, 50, 2.5, '#ffffff');
  circle(ctx, 120, 38, 2, '#ffffff');
  if (v === 0) circle(ctx, 500, 46, 3, '#ffe066');
  circle(ctx, 470, 90, 2, '#ffffff');
  cloud(ctx, 180, 70, 0.8);
  cloud(ctx, 380, 55, 0.65);
  gull(ctx, 220, 110, 0.9);
  gull(ctx, 260, 95, 0.8);
  // rocky shore
  poly(ctx, [[0, 420], [0, 350], [120, 330], [200, 380], [180, 420]], '#5a5a5a');
  poly(ctx, [[360, 420], [400, 340], [500, 320], [560, 360], [560, 420]], '#4a4a4a');
  // gull on the right rock
  if (v === 0) gull(ctx, 480, 300, 1);
  lighthouse(ctx, 280, 340, 210, true);
  if (v === 1) rect(ctx, 257, 130, 46, 16, '#f4f1de'); // right picture: top stripe is white, not red
  if (v === 0) {
    ctx.strokeStyle = '#5b3a1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(280, 112);
    ctx.lineTo(280, 78);
    ctx.stroke();
    poly(ctx, [[280, 78], [312, 86], [280, 94]], '#e63946');
  }
  // lighthouse window lights: left has two lit, right has one
  rect(ctx, 268, 190, 24, 14, v === 0 ? '#ffd166' : '#ffd166');
  rect(ctx, 268, 232, 24, 14, v === 0 ? '#ffd166' : '#33414d');
  sea(ctx, 340, '#457b9d', '#1d3557');
  waves(ctx, 368, 'rgba(255,255,255,0.5)');
  if (v === 0) waves(ctx, 398, 'rgba(255,255,255,0.4)');
  // sailboat: left sail up, right sail lowered
  if (v === 0) boat(ctx, 140, 320, 0.8, '#7d3c2c', '#e63946');
  else {
    poly(ctx, [[98, 320], [182, 320], [170, 336], [110, 336]], '#7d3c2c');
    rect(ctx, 136, 288, 5, 32, '#5b3a1e');
  }
}

// ---------------------------------------------------------------------------
// Scene 3 — Fish Market Dawn
// ---------------------------------------------------------------------------
function paintMarket(ctx, v) {
  sky(ctx, '#f7ede2', '#f2c094');
  cloud(ctx, 90, 55, 0.8);
  cloud(ctx, 420, 45, 0.7);
  // market awning
  rect(ctx, 60, 100, 440, 16, '#b23a48');
  for (let i = 0; i < 11; i++) {
    if (i % 2 === 0) rect(ctx, 60 + i * 40, 100, 20, 16, v === 0 ? '#e63946' : '#b23a48');
  }
  rect(ctx, 60, 116, 440, 8, '#7f1d2d');
  rect(ctx, 70, 124, 8, 190, '#6b4226');
  rect(ctx, 482, 124, 8, 190, '#6b4226');
  // sign
  rect(ctx, 120, 150, 110, 44, '#f4f1de');
  ctx.strokeStyle = '#6b4226';
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 150, 110, 44);
  if (v === 0) {
    ctx.fillStyle = '#1d3557';
    ctx.font = 'bold 24px Trebuchet MS, sans-serif';
    ctx.fillText('FISH', 148, 181);
  }
  // lantern
  circle(ctx, 90, 140, 12, v === 0 ? '#ffd166' : '#8a94a0');
  if (v === 0) {
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(90, 140, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
  rect(ctx, 86, 122, 8, 8, '#5b3a1e');
  // stall counter
  rect(ctx, 60, 300, 440, 16, '#8d5a2b');
  rect(ctx, 60, 316, 440, 60, '#a67c52');
  // fish on the counter: left 5, right 4
  const fishX = [110, 170, 230, 290, 350];
  fishX.forEach((fx, i) => {
    if (v === 1 && i === 4) return;
    ctx.fillStyle = '#b8c4cc';
    ctx.beginPath();
    ctx.ellipse(fx, 296, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    poly(ctx, [[fx + 20, 296], [fx + 32, 288], [fx + 32, 304]], '#b8c4cc');
    circle(ctx, fx - 12, 293, 2, '#1d3557');
  });
  // basket: left full of fish, right empty
  ctx.strokeStyle = '#6b4226';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(400, 300, 34, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (v === 0) {
    ctx.fillStyle = '#b8c4cc';
    ctx.beginPath();
    ctx.ellipse(388, 294, 12, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(408, 292, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // crates and barrel
  rect(ctx, 430, 340, 60, 40, '#8d6b45');
  rect(ctx, 430, 340, 60, 8, '#a67c52');
  if (v === 0) {
    circle(ctx, 510, 360, 20, '#7d5a3a');
    rect(ctx, 494, 344, 32, 6, '#5b3a1e');
    rect(ctx, 494, 368, 32, 6, '#5b3a1e');
  }
  // cat on the crates
  if (v === 0) {
    ctx.fillStyle = '#e07a5f';
    ctx.beginPath();
    ctx.ellipse(460, 330, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    circle(ctx, 480, 318, 10, '#e07a5f');
    poly(ctx, [[474, 310], [478, 300], [482, 310]], '#e07a5f');
    poly(ctx, [[484, 310], [488, 300], [492, 310]], '#e07a5f');
  }
  // cobblestones
  ctx.fillStyle = '#d9c9b8';
  ctx.fillRect(0, 376, PANEL_W, 44);
  for (const cx of [30, 110, 190, 270, 350, 430, 510]) {
    ctx.fillStyle = '#c4b096';
    ctx.beginPath();
    ctx.ellipse(cx, 398, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const SCENES = [
  {
    name: 'Sunset Harbour',
    paint: paintSunset,
    diffs: [
      { x: 470, y: 70, r: 30, label: 'the sun' },
      { x: 105, y: 120, r: 16, label: 'a seagull' },
      { x: 312, y: 254, r: 20, label: 'the boat flag colour' },
      { x: 90, y: 338, r: 18, label: 'the red buoy' },
      { x: 473, y: 340, r: 16, label: 'a dock crate' },
      { x: 110, y: 190, r: 16, label: 'the lighthouse window light' },
      { x: 330, y: 110, r: 22, label: 'a cloud' },
    ],
  },
  {
    name: 'Lighthouse Cove',
    paint: paintCove,
    diffs: [
      { x: 296, y: 86, r: 18, label: 'the lighthouse flag' },
      { x: 480, y: 300, r: 16, label: 'the gull on the rock' },
      { x: 140, y: 292, r: 30, label: 'the sailboat sail' },
      { x: 380, y: 398, r: 24, label: 'a wave crest' },
      { x: 280, y: 239, r: 16, label: 'a lighthouse window light' },
      { x: 500, y: 46, r: 12, label: 'a bright star' },
      { x: 280, y: 138, r: 18, label: 'a lighthouse stripe' },
    ],
  },
  {
    name: 'Fish Market Dawn',
    paint: paintMarket,
    diffs: [
      { x: 350, y: 296, r: 18, label: 'a fish on the counter' },
      { x: 460, y: 326, r: 24, label: 'the market cat' },
      { x: 90, y: 140, r: 18, label: 'the lantern light' },
      { x: 230, y: 108, r: 16, label: 'an awning stripe' },
      { x: 510, y: 360, r: 22, label: 'a barrel' },
      { x: 400, y: 294, r: 22, label: 'fish in the basket' },
      { x: 175, y: 172, r: 24, label: 'the FISH sign' },
    ],
  },
];
