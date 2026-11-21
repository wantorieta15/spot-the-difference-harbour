// Twin Harbour — the hand-in program for the spot-the-difference bounty.
// Node 22, standard library only. It takes the game (game/), the screenshots
// (screenshots/) and the dossier library (vendor/makefun-game.ts) from beside
// this file and lays them out in the grader's output directory, then writes
// /output/dossier.json — the summary the judge reads — with the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The game itself is plain static files a desktop browser loads offline:
// game/index.html plus its ES modules, no library and no network request.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, mirrored here so a bad hand-in fails loudly at home
// instead of silently on the server: at most 4 screenshots, each at most
// 256 KiB; game/ at most 993 files and 48 MiB in all; no path under game/
// longer than 1000 bytes. The whole of /output shares the platform's own
// cap of 1000 entries and 64 MiB, so the dossier leaves room for itself.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function fail(message) {
  console.error(`twin-harbour hand-in: ${message}`);
  process.exit(1);
}

function countEntries(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    total += 1;
    if (statSync(full).isDirectory()) total += countEntries(full);
  }
  return total;
}

function checkInputs() {
  const gameDir = join(repoRoot, 'game');
  if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');
  if (countEntries(gameDir) > DOSSIER_LIMITS.game_max_files) {
    fail('game/ holds more than 993 files and directories');
  }
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotsDir).filter((n) => /\.(png|jpe?g)$/i.test(n));
  if (shots.length < 3 || shots.length > DOSSIER_LIMITS.screenshots.max) {
    fail(`expected 3 or 4 screenshots, found ${shots.length}`);
  }
  for (const shot of shots) {
    const bytes = statSync(join(shotsDir, shot)).size;
    if (bytes > DOSSIER_LIMITS.screenshots.max_bytes) {
      fail(`screenshot ${shot} is ${bytes} bytes, over the 256 KiB cap`);
    }
  }
  return shots;
}

function handIn() {
  const shots = checkInputs();

  mkdirSync(targetDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(targetDir, 'game'), { recursive: true });
  mkdirSync(join(targetDir, 'screenshots'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(targetDir, 'screenshots'), { recursive: true });

  const dossier = buildDossier(targetDir, DOSSIER_LIMITS);
  writeFileSync(join(targetDir, 'dossier.json'), dossier);

  const shotList = shots.slice().sort().join(', ');
  console.log(`twin-harbour hand-in: wrote ${targetDir} (game/ + ${shots.length} screenshots: ${shotList})`);
}

handIn();
