/**
 * graphics.js — the pixel renderer.
 *
 * The 112x96 screen is a single `Uint32Array` aliased onto a canvas
 * `ImageData` buffer, so setting a pixel is one array write with no per-pixel
 * canvas call. Nothing in here knows what a game mode is; it only offers
 * primitives that screens.js composes.
 *
 * This is the one module allowed to touch the framebuffer. Everything else
 * draws through these functions.
 */

import { SCREEN_W, SCREEN_H, COL } from './config.js';
import { FONT, SPR } from './sprites.js';
import { S, ui } from './state.js';
import { STAGES, TRADES, FINAL_STAGE } from './data.js';

export const W = SCREEN_W;
export const H = SCREEN_H;

/** The offscreen canvas the 3D texture and the 2D fallback both copy from. */
export const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d', { alpha: false });
const image = ctx.createImageData(W, H);

/** The framebuffer itself: one packed ABGR word per pixel. */
const buf = new Uint32Array(image.data.buffer);

/** Push the framebuffer to the canvas. Called once per painted frame. */
export function present() { ctx.putImageData(image, 0, 0); }

/* ======================= primitives =================================== */

export function clear(color = COL.sky2) { buf.fill(color); }

export function px(x, y, color) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  buf[y * W + x] = color;
}

export function rect(x, y, w, h, color) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, color);
}

export function frame(x, y, w, h, color) {
  for (let i = 0; i < w; i++) { px(x + i, y, color); px(x + i, y + h - 1, color); }
  for (let j = 0; j < h; j++) { px(x, y + j, color); px(x + w - 1, y + j, color); }
}

export function hline(x, y, w, color) { for (let i = 0; i < w; i++) px(x + i, y, color); }
export function vline(x, y, h, color) { for (let j = 0; j < h; j++) px(x, y + j, color); }

export function disc(cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) px(cx + x, cy + y, color);
  }
}

/** A filled box with its corners knocked off, which reads as rounded. */
export function panel(x, y, w, h, fill, border) {
  rect(x, y, w, h, fill);
  if (border !== undefined) {
    frame(x, y, w, h, border);
    px(x, y, fill); px(x + w - 1, y, fill); px(x, y + h - 1, fill); px(x + w - 1, y + h - 1, fill);
  } else {
    px(x, y, COL.panel2); px(x + w - 1, y, COL.panel2);
    px(x, y + h - 1, COL.panel2); px(x + w - 1, y + h - 1, COL.panel2);
  }
}

/* ======================= text ========================================= */

function glyph(ch, x, y, color, scale) {
  const g = FONT[ch] || FONT['?'];
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < 3; k++) {
      if (g.charCodeAt(r * 3 + k) === 49) {
        if (scale === 1) px(x + k, y + r, color);
        else rect(x + k * scale, y + r * scale, scale, scale, color);
      }
    }
  }
}

/**
 * @param {string} str
 * @param {number} [scale=1] pixel size of one glyph cell
 * @param {number} [shadow]  optional drop-shadow colour, offset by one cell
 * @returns the x the cursor ended at
 */
export function text(str, x, y, color, scale = 1, shadow) {
  str = String(str).toUpperCase();
  let cx = x;
  for (const ch of str) {
    if (ch !== ' ') {
      if (shadow !== undefined) glyph(ch, cx + scale, y + scale, shadow, scale);
      glyph(ch, cx, y, color === undefined ? COL.K : color, scale);
    }
    cx += 4 * scale;
  }
  return cx - scale;
}

/** Rendered width of `str`, so callers can right-align or centre it. */
export function textWidth(str, scale = 1) { return String(str).length * 4 * scale - scale; }

/** Right-aligned to `rx`. */
export function textR(str, rx, y, color, scale, shadow) {
  text(str, rx - textWidth(str, scale), y, color, scale, shadow);
}

/** Centred between `x0` and `x1`, defaulting to the full screen. */
export function textC(str, y, color, scale, x0, x1, shadow) {
  const a = x0 === undefined ? 0 : x0;
  const b = x1 === undefined ? W : x1;
  text(str, a + (((b - a) - textWidth(str, scale)) >> 1), y, color, scale, shadow);
}

/** Greedy word wrap to `n` characters per line. */
export function wrap(str, n) {
  const out = [];
  let line = '';
  for (const word of String(str).toUpperCase().split(' ')) {
    if (!line.length) line = word;
    else if ((line + ' ' + word).length <= n) line += ' ' + word;
    else { out.push(line); line = word; }
  }
  if (line.length) out.push(line);
  return out;
}

/* ======================= sprites ====================================== */

/**
 * Blit a sprite by name.
 * @param {object} [over]  per-character colour overrides, which is how one
 *                         body sprite wears every shirt in the game
 * @param {number} [scale]
 */
export function sprite(name, x, y, over, scale = 1) {
  const data = SPR[name];
  if (!data) return;
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    for (let k = 0; k < row.length; k++) {
      const ch = row[k];
      if (ch === '.') continue;
      const color = (over && over[ch] !== undefined) ? over[ch] : COL[ch];
      if (color === undefined) continue;
      if (scale === 1) px(x + k, y + r, color);
      else rect(x + k * scale, y + r * scale, scale, scale, color);
    }
  }
}

/* ======================= composite widgets ============================ */

/** A 0-100 bar with a highlight along its top edge. */
export function statBar(x, y, w, value, fill) {
  frame(x, y, w, 7, COL.K);
  rect(x + 1, y + 1, w - 2, 5, COL.n);
  const inner = w - 2;
  const filled = Math.max(0, Math.min(inner, Math.round(inner * value / 100)));
  if (filled > 0) {
    rect(x + 1, y + 1, filled, 5, fill);
    hline(x + 1, y + 1, filled, COL.W);
  }
}

/** The title bar at the top of every sub-screen. */
export function headerBar(title, color, shadow) {
  const c = color || COL.head;
  const d = shadow || COL.head2;
  rect(0, 0, W, 14, c);
  hline(0, 14, W, d);
  const scale = textWidth(title, 2) <= 106 ? 2 : 1;   // drop to small type rather than overflow
  text(title, 3, scale === 2 ? 2 : 5, COL.W, scale, d);
}

/** The slim day/name bar the home screen uses instead of a header. */
export function statusBar() {
  rect(0, 0, W, 10, COL.head);
  hline(0, 10, W, COL.head2);
  text('DAY ' + S.day, 3, 3, COL.W);
  if (S.name) textR(S.name, 109, 3, COL.A);
}

/** A list row, highlighted when selected. */
export function listRow(on, y) {
  panel(2, y, 108, 13, on ? COL.Y : COL.panel2);
  return y;
}

/* ======================= scenery ====================================== */

export function sky(y0, y1) {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, (y1 - y0));
    hline(0, y, W, t < 0.34 ? COL.sky1 : t < 0.68 ? COL.sky2 : COL.sky3);
  }
}

export function cloud(x, y, scale = 1) {
  const s = scale;
  disc(x, y, 3 * s, COL.W);
  disc(x + 5 * s, y - 2 * s, 4 * s, COL.W);
  disc(x + 10 * s, y, 3 * s, COL.W);
  rect(x - 3 * s, y, 16 * s, 3 * s, COL.W);
}

export function sun(x, y) { disc(x, y, 6, COL.Y); disc(x, y, 4, COL.N); }

/** Sea with a scrolling band of foam. `t` is the shared animation clock. */
export function seaBand(y0, y1, t) {
  for (let y = y0; y < y1; y++) hline(0, y, W, (y - y0) < 2 ? COL.sea2 : COL.sea1);
  for (let x = 0; x < W; x++) {
    const yy = y0 + 1 + ((Math.sin((x * 0.4) + t * 2) > 0.4) ? 0 : 2);
    if ((x + ((t * 8) | 0)) % 9 === 0) hline(x, yy, 2, COL.V);
  }
}

export function groundBand(y0, y1) {
  hline(0, y0, W, COL.sand);
  hline(0, y0 + 1, W, COL.sand);
  for (let y = y0 + 2; y < y1; y++) hline(0, y, W, (y - y0) < 4 ? COL.grass : COL.grass2);
  for (let x = 0; x < W; x += 7) px(x + ((x / 7) | 0) % 3, y0 + 4, COL.G);
}

/* ======================= the character ================================ */

/** The shirt colours for the current stage, or the current trade's uniform. */
export function shirtOver() {
  const trade = S.stage === FINAL_STAGE && S.trade ? TRADES[S.trade] : null;
  if (trade) return { C: COL[trade.shirt], c: COL[trade.sh] };
  const stage = STAGES[S.stage];
  return { C: COL[stage.shirt], c: COL[stage.sh] };
}

/** Which body sprite the child is wearing right now. */
export function currentBodySprite() {
  if (!S.hatched) return 'egg';
  const trade = (S.stage === FINAL_STAGE && S.trade) ? TRADES[S.trade] : null;
  return (trade && trade.spr && SPR[trade.spr]) ? trade.spr : STAGES[S.stage].spr;
}

/** The child, bobbing, with hat, tool, mood alert and any active effect. */
export function drawChar(x, y, noFx) {
  const bob = (Math.sin(ui.anim * 3.1) > 0) ? 0 : 1;
  const yy = y + bob;

  for (let i = 0; i < 16; i++) px(x + 4 + i, y + 29, COL.grass2);   // soft contact shadow
  sprite(currentBodySprite(), x, yy, shirtOver());

  if (S.hatched && S.stage === FINAL_STAGE && S.trade && TRADES[S.trade]) {
    const trade = TRADES[S.trade];
    if (trade.hat) sprite('hat', x + 3, yy, {});
    if (trade.tool) sprite(trade.tool, x + trade.tx, yy + trade.ty, {});
  }
  if (!noFx && (S.hunger <= 18 || S.happy <= 18) && Math.floor(ui.anim * 2) % 2 === 0) {
    disc(x + 24, yy + 4, 5, COL.R);
    text('!', x + 23, yy + 2, COL.W);
  }
  if (ui.fx && ui.fx.k === 'eat') sprite(ui.fx.s, x + 22, yy + 14, {});
  if (ui.fx && ui.fx.k === 'play') sprite(ui.fx.s, x + 22, yy + 6 + (Math.sin(ui.anim * 9) * 3 | 0), {});
}
