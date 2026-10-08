/**
 * device3d.js — the physical toy.
 *
 * Everything WebGL lives here: the egg body, the painted front face, the
 * recessed screen, the buttons, and the pointer handling that drives them.
 * The game does not know this module exists; it only fills a 112x96
 * framebuffer, which this module uploads as a texture.
 *
 * Three notes on why the geometry is the way it is:
 *
 *  1. The body is a `LatheGeometry` whose front and back vertices are then
 *     clamped to a plane. A flat screen on a curved shell has to protrude;
 *     planing the egg first gives the screen somewhere flush to sit.
 *  2. The screen texture is the game canvas upscaled 4x with nearest-
 *     neighbour filtering. At 1x the 112x96 grid lands on fractional texels
 *     and the pixel art smears.
 *  3. Colours go through `linearColor()`. The renderer outputs sRGB, so a raw
 *     hex assigned to a material is interpreted as linear and comes out
 *     washed out.
 */

import {
  FLAT_FRONT_Z, FLAT_BACK_Z, MAX_PIXEL_RATIO, TEXTURE_SCALE,
  SCREEN_W, SCREEN_H, KAMPONG, SHELLS, applyTheme
} from './config.js';
import { FONT } from './sprites.js';
import { S, save } from './state.js';
import { canvas as screenCanvas } from './graphics.js';

/* ======================= module state ================================= */

let renderer = null;
let scene = null;
let camera = null;
let toy = null;
let screenTexture = null;

/** Lathe-derived measurements the texture painters need. */
let geo = null;
/** The materials `applyShell` repaints. */
let gfx = null;

let buttonMeshes = [];
const buttonsByName = {};

/** Drag-to-turn state. `tYaw`/`tPitch` are targets the render loop eases to. */
export const drag = { on: false, x: 0, y: 0, yaw: 0, pitch: 0, tYaw: 0, tPitch: 0, moved: 0, btn: null };

let viewport = null;

/** The upscaled copy of the game screen that becomes the WebGL texture. */
const texCanvas = document.createElement('canvas');
texCanvas.width = SCREEN_W * TEXTURE_SCALE;
texCanvas.height = SCREEN_H * TEXTURE_SCALE;
const texCtx = texCanvas.getContext('2d');
texCtx.imageSmoothingEnabled = false;

/** Callback fired after a shell is applied, so the gallery can restyle cards. */
let onShellChanged = () => {};
export function setShellChangedHandler(fn) { onShellChanged = fn; }

/* ======================= colour helpers =============================== */

/** Convert an sRGB hex into the linear space the renderer expects. */
function linearColor(hex) {
  const c = new THREE.Color(hex);
  if (c.convertSRGBToLinear) c.convertSRGBToLinear();
  return c;
}

/** Flag a renderer, texture or material as sRGB across three.js versions. */
function setSRGB(obj) {
  if (!obj) return;
  if ('outputColorSpace' in obj && THREE.SRGBColorSpace !== undefined) obj.outputColorSpace = THREE.SRGBColorSpace;
  else if ('outputEncoding' in obj && THREE.sRGBEncoding !== undefined) obj.outputEncoding = THREE.sRGBEncoding;
  else if ('colorSpace' in obj && THREE.SRGBColorSpace !== undefined) obj.colorSpace = THREE.SRGBColorSpace;
  else if ('encoding' in obj && THREE.sRGBEncoding !== undefined) obj.encoding = THREE.sRGBEncoding;
}

/** A small deterministic PRNG, so a shell's decoration is the same every load. */
function rngFrom(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function roundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 126);
  grd.addColorStop(0, 'rgba(104,88,60,0.55)');
  grd.addColorStop(0.42, 'rgba(104,88,60,0.22)');
  grd.addColorStop(1, 'rgba(104,88,60,0)');
  g.fillStyle = grd;
  g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
  return new THREE.CanvasTexture(c);
}

/* ======================= kampong motifs =============================== */
/* Each painter draws one motif at the origin on a Canvas 2D context, reading
   its colours from the live KAMPONG theme. Scattering them is drawMotif's
   job, so a new shell design only has to name which motifs it uses. */

function mHouse(g, s) {
  g.save(); g.scale(s, s);
  g.fillStyle = KAMPONG.woodDark;
  [-20, -8, 8, 20].forEach((x) => g.fillRect(x - 2.5, 15, 5, 15));     // stilts
  g.fillStyle = KAMPONG.wood; g.fillRect(-26, -6, 52, 22);
  g.fillStyle = KAMPONG.woodDark; g.fillRect(-26, 13, 52, 3);
  g.fillStyle = KAMPONG.cream;
  g.fillRect(-19, 0, 13, 10); g.fillRect(6, 0, 13, 10);                // windows
  g.fillStyle = KAMPONG.woodDark;
  g.fillRect(-13.2, 0, 1.8, 10); g.fillRect(11.8, 0, 1.8, 10);
  g.beginPath(); g.moveTo(0, -31); g.lineTo(35, -5); g.lineTo(-35, -5); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(253,240,213,0.26)'; g.lineWidth = 1.8;
  for (let i = -28; i <= 28; i += 7) { g.beginPath(); g.moveTo(0, -29); g.lineTo(i, -6); g.stroke(); }
  g.restore();
}

function mKelong(g, s) {
  g.save(); g.scale(s, s);
  g.fillStyle = KAMPONG.woodDark;
  [-20, -7, 7, 20].forEach((x) => g.fillRect(x - 2, 5, 4, 24));
  g.fillStyle = KAMPONG.wood; g.fillRect(-26, -1, 52, 7);
  g.fillStyle = KAMPONG.woodDark;
  g.beginPath(); g.moveTo(-15, -20); g.lineTo(15, -20); g.lineTo(22, -1); g.lineTo(-22, -1); g.closePath(); g.fill();
  g.fillStyle = KAMPONG.cream; g.fillRect(-6, -14, 12, 9);
  g.restore();
}

function mPalm(g, s) {
  g.save(); g.scale(s, s);
  g.strokeStyle = KAMPONG.wood; g.lineWidth = 5.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-2, 30); g.quadraticCurveTo(-6, 6, 2, -10); g.stroke();
  g.fillStyle = KAMPONG.leaf;
  for (let i = 0; i < 5; i++) {
    g.save(); g.translate(2, -12); g.rotate(-Math.PI / 2 + (i - 2) * 0.64);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(11, -15, 1, -31);
    g.quadraticCurveTo(-11, -15, 0, 0); g.fill();
    g.restore();
  }
  g.fillStyle = KAMPONG.sun;                                           // coconuts
  g.beginPath(); g.arc(-5, -9, 3.2, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(6, -7, 3.2, 0, Math.PI * 2); g.fill();
  g.restore();
}

function mBoat(g, s) {
  g.save(); g.scale(s, s);
  g.fillStyle = KAMPONG.wood;
  g.beginPath(); g.moveTo(-28, 2); g.lineTo(28, 2); g.lineTo(19, 17); g.lineTo(-19, 17); g.closePath(); g.fill();
  g.fillStyle = KAMPONG.woodDark; g.fillRect(-29, -2, 58, 4);
  g.fillStyle = KAMPONG.cream;
  g.beginPath(); g.moveTo(1, -28); g.lineTo(16, -2); g.lineTo(1, -2); g.closePath(); g.fill();
  g.fillStyle = KAMPONG.woodDark; g.fillRect(-1, -29, 2.6, 31);
  g.restore();
}

function mFish(g, s, body, eye) {
  g.save(); g.scale(s, s);
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(-16, 0); g.quadraticCurveTo(2, -13, 22, 0);
  g.quadraticCurveTo(2, 13, -16, 0); g.fill();
  g.beginPath(); g.moveTo(-15, 0); g.lineTo(-29, -11); g.lineTo(-29, 11); g.closePath(); g.fill();
  g.fillStyle = eye; g.beginPath(); g.arc(13, -2, 2.6, 0, Math.PI * 2); g.fill();
  g.restore();
}

function mWeave(g, s, color) {
  g.save(); g.scale(s, s);
  g.beginPath(); g.rect(-26, -20, 52, 40); g.clip();
  g.strokeStyle = color; g.lineWidth = 3.4;
  for (let i = -60; i < 70; i += 13) {
    g.beginPath(); g.moveTo(i, -22); g.lineTo(i + 42, 22); g.stroke();
    g.beginPath(); g.moveTo(i, 22); g.lineTo(i + 42, -22); g.stroke();
  }
  g.restore();
}

function mWave(g, s, color) {
  g.save(); g.scale(s, s);
  g.strokeStyle = color; g.lineWidth = 4.2; g.lineCap = 'round';
  g.beginPath();
  for (let i = -32; i <= 32; i += 3) {
    const y = Math.sin(i / 8) * 6;
    if (i === -32) g.moveTo(i, y); else g.lineTo(i, y);
  }
  g.stroke(); g.restore();
}

function mGrass(g, s, blade, stem) {
  g.save(); g.scale(s, s);
  g.lineCap = 'round';
  g.strokeStyle = blade; g.lineWidth = 4.4;
  [[-16, -24], [-8, -33], [1, -37], [9, -32], [17, -23]].forEach((p) => {
    g.beginPath(); g.moveTo(0, 16); g.quadraticCurveTo(p[0] * 0.45, p[1] * 0.55, p[0], p[1]); g.stroke();
  });
  g.strokeStyle = stem; g.lineWidth = 3.2;
  g.beginPath(); g.moveTo(0, 16); g.quadraticCurveTo(-5, -6, -6, -20); g.stroke();
  g.beginPath(); g.moveTo(0, 16); g.quadraticCurveTo(6, -6, 7, -18); g.stroke();
  g.restore();
}

function mHay(g, s, fill, rings, edge) {
  g.save(); g.scale(s, s);
  g.fillStyle = fill; g.beginPath(); g.arc(0, 0, 22, 0, Math.PI * 2); g.fill();
  g.strokeStyle = rings; g.lineWidth = 3;
  for (let r = 7; r <= 17; r += 5) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = edge; g.lineWidth = 3.6;
  g.beginPath(); g.arc(0, 0, 22, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.stroke();
  g.restore();
}

function mOar(g, s, shaft, blade) {
  g.save(); g.scale(s, s); g.rotate(-0.42);
  g.strokeStyle = shaft; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -30); g.lineTo(0, 10); g.stroke();
  g.fillStyle = shaft; g.beginPath(); g.ellipse(0, 24, 9, 15, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = blade; g.beginPath(); g.ellipse(0, 24, 5, 10, 0, 0, Math.PI * 2); g.fill();
  g.restore();
}

function mRod(g, s, rod, line) {
  g.save(); g.scale(s, s);
  g.strokeStyle = rod; g.lineWidth = 4.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-20, 26); g.quadraticCurveTo(3, -2, 20, -28); g.stroke();
  g.fillStyle = line; g.beginPath(); g.arc(-11, 15, 5.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = line; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(20, -28); g.quadraticCurveTo(27, -6, 17, 12); g.stroke();
  g.beginPath(); g.arc(14, 16, 5, -Math.PI * 0.55, Math.PI * 0.85); g.stroke();
  g.restore();
}

function mDot(g, s, color) {
  g.save(); g.scale(s, s);
  g.fillStyle = color; g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.fill();
  g.restore();
}

/** Paint one motif by name, sized by the supplied RNG. */
function drawMotif(g, kind, rnd) {
  const warm = [KAMPONG.cream, KAMPONG.sun, KAMPONG.coral, KAMPONG.foam];
  const pick = warm[(rnd() * warm.length) | 0];
  if (kind === 'house') mHouse(g, 1.18 + rnd() * 0.34);
  else if (kind === 'kelong') mKelong(g, 1.08 + rnd() * 0.30);
  else if (kind === 'palm') mPalm(g, 1.12 + rnd() * 0.40);
  else if (kind === 'boat') mBoat(g, 1.02 + rnd() * 0.28);
  else if (kind === 'fish') mFish(g, 1.0 + rnd() * 0.4, pick, KAMPONG.shellDeep);
  else if (kind === 'weave') mWeave(g, 1.1 + rnd() * 0.5, KAMPONG.shellDeep);
  else if (kind === 'wave') mWave(g, 1.3 + rnd() * 0.6, KAMPONG.foam);
  else if (kind === 'grass') mGrass(g, 1.15 + rnd() * 0.40, KAMPONG.leaf, KAMPONG.leafDeep);
  else if (kind === 'hay') mHay(g, 1.00 + rnd() * 0.30, KAMPONG.wood, KAMPONG.woodDark, KAMPONG.cream);
  else if (kind === 'oar') mOar(g, 1.10 + rnd() * 0.30, KAMPONG.wood, KAMPONG.foam);
  else if (kind === 'rod') mRod(g, 1.10 + rnd() * 0.30, KAMPONG.wood, KAMPONG.foam);
  else mDot(g, 0.85 + rnd() * 0.6, pick);
}

/* ======================= textures ===================================== */

/**
 * The wrap-around body texture.
 *
 * Motifs near the poles are stretched horizontally by `maxR / radiusAtV`, so
 * a house on the narrow top of the egg still reads as a house rather than a
 * sliver; motifs near the seam are drawn twice so they do not get cut in half.
 */
function shellTexture(radiusAtV, maxR, kinds) {
  const SIZE = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const g = c.getContext('2d');

  g.fillStyle = KAMPONG.shell;
  g.fillRect(0, 0, SIZE, SIZE);
  g.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < SIZE; y += 52) g.fillRect(0, y, SIZE, 3);     // faint moulding lines

  const rnd = rngFrom(20260407);
  for (let i = 0; i < 34; i++) {
    const v = 0.14 + rnd() * 0.72;
    const y = (1 - v) * SIZE;
    const x = rnd() * SIZE;
    const r = Math.max(0.2, radiusAtV(v));
    const stretch = Math.min(1.55, maxR / r);
    const kind = kinds[(rnd() * kinds.length) | 0];
    const upright = ['house', 'kelong', 'palm', 'boat', 'grass', 'rod', 'oar'].indexOf(kind) >= 0;

    const copies = x < 110 ? [0, SIZE] : x > SIZE - 110 ? [0, -SIZE] : [0];
    for (const dx of copies) {
      g.save();
      g.translate(x + dx, y);
      g.scale(stretch, 1);
      if (!upright) g.rotate(-0.2);
      drawMotif(g, kind, rngFrom((i * 7919) >>> 0));
      g.restore();
    }
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.offset.x = 0.5;
  setSRGB(t);
  return t;
}

/** The same 3x5 bitmap font the screen uses, onto an ordinary 2D canvas. */
function pixText(c, str, x, y, scale, color) {
  str = String(str).toUpperCase();
  c.fillStyle = color;
  let cx = x;
  for (const ch of str) {
    if (ch !== ' ') {
      const glyph = FONT[ch] || FONT['?'];
      for (let r = 0; r < 5; r++) {
        for (let k = 0; k < 3; k++) {
          if (glyph.charCodeAt(r * 3 + k) === 49) c.fillRect(cx + k * scale, y + r * scale, scale, scale);
        }
      }
    }
    cx += 4 * scale;
  }
}
function pixTextWidth(str, scale) { return String(str).length * 4 * scale - scale; }

/**
 * The flat front face, painted as one decal: the planed silhouette, the cream
 * panel, a woven rattan band, the PUNG-GO! wordmark and a few side motifs.
 */
function faceDecal(flatHalf, kinds, side) {
  const PX = 400;
  const CW = 800;
  const CH = 1000;
  const c = document.createElement('canvas');
  c.width = CW; c.height = CH;
  const g = c.getContext('2d');
  const X = (x) => CW / 2 + x * PX;
  const Y = (y) => CH / 2 - y * PX;

  // silhouette of the planed-flat area
  const right = [];
  const left = [];
  for (let i = 0; i <= 200; i++) {
    const y = -1.22 + 2.44 * i / 200;
    const w = flatHalf(y) - 0.012;
    if (w > 0.006) { right.push([w, y]); left.push([-w, y]); }
  }
  if (right.length > 2) {
    g.beginPath();
    g.moveTo(X(right[0][0]), Y(right[0][1]));
    right.forEach((p) => g.lineTo(X(p[0]), Y(p[1])));
    for (let i = left.length - 1; i >= 0; i--) g.lineTo(X(left[i][0]), Y(left[i][1]));
    g.closePath();
    g.fillStyle = KAMPONG.shell;
    g.fill();

    g.save(); g.clip();
    const rnd = rngFrom(77001);
    for (let i = 0; i < 7; i++) {
      const x = (rnd() - 0.5) * 1.7;
      const y = -1.14 + rnd() * 0.52;
      g.save(); g.translate(X(x), Y(y)); g.scale(0.95, 0.95);
      drawMotif(g, kinds[(rnd() * kinds.length) | 0], rnd);
      g.restore();
    }
    g.restore();
  }

  // cream panel
  const cx = X(0);
  const cy = Y(0.22);
  const rx = 0.84 * PX;
  const ry = 0.92 * PX;
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = KAMPONG.cream; g.fill();
  g.lineWidth = 7; g.strokeStyle = KAMPONG.creamEdge; g.stroke();

  g.save();
  g.beginPath(); g.ellipse(cx, cy, rx - 5, ry - 5, 0, 0, Math.PI * 2); g.clip();

  // woven rattan band hugging the panel edge
  g.save();
  g.beginPath();
  g.ellipse(cx, cy, rx - 10, ry - 10, 0, 0, Math.PI * 2);
  g.ellipse(cx, cy, rx - 34, ry - 34, 0, 0, Math.PI * 2);
  g.clip('evenodd');
  g.strokeStyle = 'rgba(191,140,98,0.42)'; g.lineWidth = 5;
  for (let i = -CH; i < CW + CH; i += 18) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + CH, CH); g.stroke();
    g.beginPath(); g.moveTo(i, CH); g.lineTo(i + CH, 0); g.stroke();
  }
  g.restore();

  // wordmark, in the same bitmap font as the screen
  const WORD = 'PUNG-GO!';
  const SCALE = 9;
  pixText(g, WORD, cx - pixTextWidth(WORD, SCALE) / 2, Y(0.88) - (5 * SCALE) / 2, SCALE,
    KAMPONG.word || KAMPONG.coral);

  // small motifs tucked beside the window
  [[-0.70, 0.30], [0.70, 0.26], [-0.68, -0.16], [0.68, -0.12], [-0.34, -0.52], [0.34, -0.52]]
    .forEach((p, i) => {
      g.save(); g.translate(X(p[0]), Y(p[1])); g.scale(0.62, 0.62);
      drawMotif(g, side, rngFrom(900 + i * 31));
      g.restore();
    });
  g.restore();

  const t = new THREE.CanvasTexture(c);
  setSRGB(t);
  return { tex: t, w: CW / PX, h: CH / PX };
}

/* ======================= the scene ==================================== */

/** @returns true if WebGL came up and the toy was built. */
export function build(viewportEl) {
  viewport = viewportEl;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1));
  setSRGB(renderer);
  viewport.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.42, 6.6);
  camera.lookAt(0, 0.16, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcbbfa6, 0.56));
  const key = new THREE.DirectionalLight(0xffffff, 0.74); key.position.set(3.0, 4.6, 4.6); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe6cc, 0.24); fill.position.set(-4.2, 1.2, 2.6); scene.add(fill);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.32); rimLight.position.set(-1.6, 2.4, -4.2); scene.add(rimLight);

  toy = new THREE.Group();
  scene.add(toy);

  /* ---- egg profile ---- */
  const profile = [
    [0.00, -1.24], [0.36, -1.21], [0.64, -1.11], [0.87, -0.95], [1.02, -0.72],
    [1.10, -0.42], [1.13, -0.08], [1.12, 0.24], [1.06, 0.54], [0.96, 0.80],
    [0.82, 1.02], [0.64, 1.20], [0.44, 1.32], [0.23, 1.39], [0.00, 1.42]
  ];
  const spline = new THREE.SplineCurve(profile.map((p) => new THREE.Vector2(p[0], p[1])));
  const pts = spline.getPoints(80);
  const maxR = pts.reduce((m, p) => Math.max(m, p.x), 0);

  const radiusAtV = (v) => {
    const i = Math.max(0, Math.min(pts.length - 1, Math.round(v * (pts.length - 1))));
    return pts[i].x;
  };
  const radiusAtY = (y) => {
    let best = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if ((y >= a.y && y <= b.y) || (y <= a.y && y >= b.y)) {
        const t = (b.y === a.y) ? 0 : (y - a.y) / (b.y - a.y);
        best = Math.max(best, a.x + (b.x - a.x) * t);
      }
    }
    return best;
  };
  /** Half-width of the planed-flat front face at height y, or 0 if the egg is
   *  still too narrow there to have been cut. */
  const flatHalf = (y) => {
    const r = radiusAtY(y);
    const zr = 0.56 * r;
    if (zr <= FLAT_FRONT_Z) return 0;
    return r * Math.sqrt(Math.max(0, 1 - (FLAT_FRONT_Z / zr) * (FLAT_FRONT_Z / zr)));
  };
  geo = { radiusAtV, maxR, flatHalf };

  /* ---- body: lathed egg, then planed flat front and back ---- */
  const eggGeo = new THREE.LatheGeometry(pts, 120);
  eggGeo.scale(1, 1, 0.56);
  const pos = eggGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let z = pos.getZ(i);
    if (z > FLAT_FRONT_Z) z = FLAT_FRONT_Z;
    else if (z < -FLAT_BACK_Z) z = -FLAT_BACK_Z;
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
  eggGeo.computeVertexNormals();
  const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.66, metalness: 0.0 });
  toy.add(new THREE.Mesh(eggGeo, bodyMat));

  /* ---- painted front face ---- */
  const faceMat = new THREE.MeshStandardMaterial({
    transparent: true, roughness: 0.7, metalness: 0.0,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.5), faceMat);
  face.position.set(0, 0, FLAT_FRONT_Z + 0.004);
  toy.add(face);

  /* ---- recessed window: a thin rim ring sunk into the flat face ---- */
  const outer = roundedRectShape(1.30, 1.12, 0.085);
  outer.holes.push(roundedRectShape(1.12, 0.96, 0.045));
  const rim = new THREE.Mesh(
    new THREE.ExtrudeGeometry(outer, {
      depth: 0.075, bevelEnabled: true, bevelSize: 0.012,
      bevelThickness: 0.012, bevelSegments: 2, curveSegments: 14
    }),
    new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.0 })
  );
  rim.position.set(0, 0.14, FLAT_FRONT_Z - 0.012);
  toy.add(rim);

  /* ---- the screen, at the bottom of that well ---- */
  screenTexture = new THREE.CanvasTexture(texCanvas);
  screenTexture.magFilter = THREE.LinearFilter;
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.generateMipmaps = false;
  setSRGB(screenTexture);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.12, 0.96),
    new THREE.MeshBasicMaterial({ map: screenTexture })
  );
  screen.position.set(0, 0.14, FLAT_FRONT_Z + 0.012);
  toy.add(screen);

  /* ---- three buttons on the apron ---- */
  buttonMeshes = [];
  [
    { name: 'select', x: -0.42, y: -0.84 },
    { name: 'confirm', x: 0.00, y: -0.92 },
    { name: 'back', x: 0.42, y: -0.84 }
  ].forEach((def) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.104, 0.122, 0.13, 36),
      new THREE.MeshStandardMaterial({ roughness: 0.44, metalness: 0.0 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(def.x, def.y, FLAT_FRONT_Z + 0.012);
    mesh.userData.name = def.name;
    mesh.userData.z0 = FLAT_FRONT_Z + 0.012;
    mesh.userData.press = 0;
    toy.add(mesh);
    buttonMeshes.push(mesh);
    buttonsByName[def.name] = mesh;
  });

  /* ---- key ring ---- */
  const gold = new THREE.MeshStandardMaterial({ roughness: 0.34, metalness: 0.3 });
  const tab = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.19, 20), gold);
  tab.position.set(0, 1.44, 0); toy.add(tab);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.047, 14, 36), gold);
  ring.position.set(0, 1.64, 0); toy.add(ring);

  /* ---- contact shadow ---- */
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.36, 0.06);
  shadow.scale.set(0.8, 0.46, 1);
  scene.add(shadow);

  gfx = {
    bodyMat, faceMat, rimMat: rim.material, gold,
    btnMats: {
      select: buttonsByName.select.material,
      confirm: buttonsByName.confirm.material,
      back: buttonsByName.back.material
    }
  };

  applyShell(S.shell || 'original');
  resize();
  addEventListener('resize', resize);
  return true;
}

/** Repaint the whole toy for a chosen shell design. */
export function applyShell(id) {
  if (!SHELLS[id]) id = 'original';
  S.shell = id;
  const def = SHELLS[id];
  applyTheme(def.pal);

  if (!gfx || !geo) { onShellChanged(); return; }

  const oldBody = gfx.bodyMat.map;
  const oldFace = gfx.faceMat.map;
  gfx.bodyMat.map = shellTexture(geo.radiusAtV, geo.maxR, def.kinds);
  gfx.bodyMat.needsUpdate = true;
  gfx.faceMat.map = faceDecal(geo.flatHalf, def.kinds, def.side).tex;
  gfx.faceMat.needsUpdate = true;
  if (oldBody) oldBody.dispose();                  // textures are 1024px; leaking them is not free
  if (oldFace) oldFace.dispose();

  gfx.rimMat.color.copy(linearColor(def.pal.bezel));
  gfx.gold.color.copy(linearColor(def.pal.gold));
  gfx.btnMats.select.color.copy(linearColor(def.pal.bSelect));
  gfx.btnMats.confirm.color.copy(linearColor(def.pal.bConfirm));
  gfx.btnMats.back.color.copy(linearColor(def.pal.bBack));

  onShellChanged();
  save();
}

function resize() {
  if (!renderer) return;
  const w = viewport.clientWidth || 360;
  const h = viewport.clientHeight || 400;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // pull the camera back far enough that the toy always fits, whatever the aspect
  const fov = camera.fov * Math.PI / 180;
  const need = Math.max(3.78, 2.80 / camera.aspect);
  camera.position.z = (need / 2) / Math.tan(fov / 2);
  camera.updateProjectionMatrix();
}

/* ======================= per-frame ==================================== */

export function isReady() { return renderer !== null; }

/** True while anything is moving, so a still toy costs no GPU time. */
export function isMoving() {
  return drag.on
    || Math.abs(drag.tYaw - drag.yaw) > 0.001 || Math.abs(drag.tPitch - drag.pitch) > 0.001
    || Math.abs(drag.tYaw) > 0.001 || Math.abs(drag.tPitch) > 0.001
    || buttonMeshes.some((m) => m.userData.press > 0);
}

/** Copy the game screen into the toy's texture. Only on painted frames. */
export function uploadScreen() {
  texCtx.imageSmoothingEnabled = false;
  texCtx.drawImage(screenCanvas, 0, 0, texCanvas.width, texCanvas.height);
  screenTexture.needsUpdate = true;
}

/** Ease the rotation toward its target, spring the buttons back, and draw. */
export function render(dt) {
  drag.yaw += (drag.tYaw - drag.yaw) * 0.12;
  drag.pitch += (drag.tPitch - drag.pitch) * 0.12;
  if (!drag.on) { drag.tYaw *= 0.955; drag.tPitch *= 0.955; }   // settles back to facing front
  toy.rotation.y = drag.yaw;
  toy.rotation.x = drag.pitch;

  buttonMeshes.forEach((m) => {
    if (m.userData.press > 0) m.userData.press = Math.max(0, m.userData.press - dt * 7);
    m.position.z = m.userData.z0 - m.userData.press * 0.075;
  });
  renderer.render(scene, camera);
}

/** Visually depress a button, for presses that came from the keyboard. */
export function flashButton(name) {
  const mesh = buttonsByName[name];
  if (mesh) mesh.userData.press = 1;
}

/* ======================= pointer ====================================== */

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pickButton(ev) {
  if (!renderer) return null;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(buttonMeshes, false);
  return hits.length ? hits[0].object : null;
}

/**
 * Drag anywhere to turn the toy; press a button to use it.
 * @param {(name:string)=>void} onPress
 * @param {(name:string, down:boolean)=>void} onHold  for the buttons that steer
 */
export function bindPointer(onPress, onHold) {
  viewport.addEventListener('pointerdown', (ev) => {
    if (viewport.setPointerCapture) viewport.setPointerCapture(ev.pointerId);
    drag.moved = 0;
    drag.x = ev.clientX;
    drag.y = ev.clientY;

    const hit = pickButton(ev);
    if (hit) {
      drag.btn = hit.userData.name;
      hit.userData.press = 1;
      // the hold flag must be set *before* dispatching, or a handler that
      // asks "is this button held?" sees a tap and acts on it
      onHold(drag.btn, true);
      onPress(drag.btn);
    } else {
      drag.on = true;
      viewport.classList.add('grabbing');
    }
  });

  viewport.addEventListener('pointermove', (ev) => {
    if (!drag.on) return;
    const dx = ev.clientX - drag.x;
    const dy = ev.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.tYaw = Math.max(-0.62, Math.min(0.62, drag.tYaw + dx * 0.006));
    drag.tPitch = Math.max(-0.32, Math.min(0.38, drag.tPitch + dy * 0.005));
    drag.x = ev.clientX;
    drag.y = ev.clientY;
  });

  const release = () => {
    drag.on = false;
    drag.btn = null;
    onHold(null, false);
    viewport.classList.remove('grabbing');
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('pointerleave', () => onHold(null, false));
}
