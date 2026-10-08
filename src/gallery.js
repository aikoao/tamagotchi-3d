/**
 * gallery.js — the two card grids beside the toy.
 *
 * These are ordinary DOM buttons with a small canvas inside, not part of the
 * game screen. The portraits reuse the same sprite data the game renders, so
 * a character never has to be drawn twice.
 */

import { HEX, SHELLS, SHELL_ORDER } from './config.js';
import { TRADES, TRADE_ORDER, FINAL_STAGE } from './data.js';
import { SPR } from './sprites.js';
import { S, wearTrade } from './state.js';
import { sfxOk } from './audio.js';
import { applyShell } from './device3d.js';

/** Blit a sprite onto a normal 2D context, using hex rather than packed ints. */
function drawSpriteToCtx(ctx, data, ox, oy, scale, over) {
  if (!data) return;
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    for (let k = 0; k < row.length; k++) {
      const ch = row[k];
      if (ch === '.') continue;
      const hex = (over && over[ch]) || HEX[ch];
      if (!hex) continue;
      ctx.fillStyle = hex;
      ctx.fillRect((ox + k) * scale, (oy + r) * scale, scale, scale);
    }
  }
}

/** A trade's portrait: its outfit, recoloured, plus hat and tool. */
function renderPortrait(canvas, id) {
  const SCALE = 4;
  const PW = 24;
  const PH = 30;
  canvas.width = PW * SCALE;
  canvas.height = PH * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#fffbf2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const trade = TRADES[id];
  drawSpriteToCtx(ctx, SPR[trade.spr] || SPR.youth, 0, 0, SCALE, { C: HEX[trade.shirt], c: HEX[trade.sh] });
  if (trade.hat) drawSpriteToCtx(ctx, SPR.hat, 3, 0, SCALE, null);
  if (trade.tool) drawSpriteToCtx(ctx, SPR[trade.tool], trade.tx, trade.ty, SCALE, null);
}

/** A shell design chip: a flat diagram of the toy in that theme's colours. */
function renderShellChip(canvas, id) {
  const W = 54;
  const H = 64;
  const SCALE = 2;
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const g = canvas.getContext('2d');
  g.scale(SCALE, SCALE);

  const pal = SHELLS[id].pal;
  g.fillStyle = '#fffbf2'; g.fillRect(0, 0, W, H);
  g.fillStyle = pal.shell;
  g.beginPath(); g.ellipse(W / 2, H / 2 + 3, W * 0.38, H * 0.42, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = pal.cream;
  g.beginPath(); g.ellipse(W / 2, H / 2 - 1, W * 0.25, H * 0.26, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = pal.bezel;
  g.fillRect(W / 2 - 9, H / 2 - 7, 18, 14);
  g.fillStyle = pal.foam;
  g.fillRect(W / 2 - 7, H / 2 - 5, 14, 10);
  [pal.bSelect, pal.bConfirm, pal.bBack].forEach((color, i) => {
    g.fillStyle = color;
    g.beginPath(); g.arc(W / 2 - 8 + i * 8, H / 2 + 19, 2.7, 0, Math.PI * 2); g.fill();
  });
  g.fillStyle = pal.gold;
  g.beginPath(); g.arc(W / 2, H * 0.10, 3.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fffbf2';
  g.beginPath(); g.arc(W / 2, H * 0.10, 1.7, 0, Math.PI * 2); g.fill();
}

/* ======================= live state on the cards ====================== */

/** Grey out trades not yet earned; mark the one currently worn. */
export function refreshCollection() {
  // scoped to #collection, because .card also matches the shell chips
  const cards = document.querySelectorAll('#collection .card');
  for (let i = 0; i < cards.length; i++) {
    const el = cards[i];
    const id = el.dataset.trade;
    const owned = !!(S.collected && S.collected.indexOf(id) >= 0);
    el.classList.toggle('locked', !owned);
    el.setAttribute('aria-pressed', String(S.stage === FINAL_STAGE && S.trade === id));
  }
}

export function refreshShellCards() {
  const cards = document.querySelectorAll('.chipcard');
  for (let i = 0; i < cards.length; i++) {
    cards[i].setAttribute('aria-pressed', String(cards[i].dataset.shell === S.shell));
  }
}

/* ======================= building ===================================== */

function makeCard(className, dataKey, dataValue, label, paint, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset[dataKey] = dataValue;
  const canvas = document.createElement('canvas');
  paint(canvas, dataValue);
  const name = document.createElement('b');
  name.textContent = label;
  button.appendChild(canvas);
  button.appendChild(name);
  button.addEventListener('click', onClick);
  return button;
}

export function buildCollection() {
  const host = document.getElementById('collection');
  if (!host) return;
  host.innerHTML = '';
  TRADE_ORDER.forEach((id) => {
    host.appendChild(makeCard('card', 'trade', id, TRADES[id].n, renderPortrait, () => {
      wearTrade(id);
      refreshCollection();
    }));
  });
  refreshCollection();
}

export function buildShells() {
  const host = document.getElementById('shells');
  if (!host) return;
  host.innerHTML = '';
  SHELL_ORDER.forEach((id) => {
    host.appendChild(makeCard('card chipcard', 'shell', id, SHELLS[id].n, renderShellChip, () => {
      applyShell(id);
      sfxOk();
    }));
  });
  refreshShellCards();
}
