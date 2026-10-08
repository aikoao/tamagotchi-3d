/**
 * main.js — the composition root.
 *
 * This is the only module that knows about all the others. It wires the
 * renderer to the game, the DOM to the input router and the toy to the
 * screen, then runs the frame loop. Every other module can be read, tested
 * or replaced without reference to anything here.
 */

import {
  MAX_FRAME_DT, PAINT_INTERVAL, AUTOSAVE_INTERVAL, GALLERY_REFRESH_INTERVAL,
  SHELLS, applyTheme
} from './config.js';
import { STATIONS, stationById } from './data.js';
import {
  S, ui, session, load, save, resetState, resetUi, go, growUp, startStation
} from './state.js';
import { setSoundEnabled, sfxOk, ensureContext } from './audio.js';
import { canvas as screenCanvas } from './graphics.js';
import { draw } from './screens.js';
import { press, update, held } from './logic.js';
import * as device from './device3d.js';
import { buildCollection, buildShells, refreshCollection, refreshShellCards } from './gallery.js';

const viewport = document.getElementById('viewport');
const fallbackEl = document.getElementById('fallback');

/* ======================= fallback renderer ============================ */

/** Used when WebGL is unavailable: the flat screen, with no toy around it. */
let fallbackCtx = null;
function mountFallback() {
  fallbackEl.classList.add('on');
  fallbackCtx = document.getElementById('flat').getContext('2d');
}

/* ======================= input wiring ================================= */

/**
 * Both the keyboard and the 3D buttons feed this. Only the Punggol Point
 * minigame distinguishes a hold from a tap, so the flags live in logic.js
 * and everything else ignores them.
 */
function setHeld(name, down) {
  if (name === null) { held.left = false; held.right = false; return; }
  if (name === 'select') held.left = down;
  if (name === 'back') held.right = down;
}

function bindKeyboard() {
  addEventListener('keydown', (e) => {
    if (e.repeat) {
      // auto-repeat only updates the hold flags; it must not re-fire the press
      if (e.key === 'ArrowLeft') held.left = true;
      if (e.key === 'ArrowRight') held.right = true;
      return;
    }
    let name = null;
    if (e.key === 'ArrowLeft') { name = 'select'; held.left = true; }
    else if (e.key === 'ArrowRight') { name = 'back'; held.right = true; }
    else if (e.key === 'Enter' || e.key === ' ') name = 'confirm';
    else if (e.key === 'Escape') name = 'back';
    else if (e.key >= '1' && e.key <= '3') {
      e.preventDefault();
      if (S.hatched && S.mode !== 'game') {
        const station = STATIONS[+e.key - 1];
        if (station) startStation(station);
      }
      return;
    }
    if (!name) return;
    e.preventDefault();
    device.flashButton(name);
    press(name);
  });

  addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') held.left = false;
    if (e.key === 'ArrowRight') held.right = false;
  });
}

function bindToggles() {
  const demo = document.getElementById('tgDemo');
  const sound = document.getElementById('tgSound');
  const grow = document.getElementById('tgGrow');
  const reset = document.getElementById('tgReset');

  demo.addEventListener('click', () => {
    S.demo = !S.demo;
    demo.setAttribute('aria-pressed', String(S.demo));
    save();
  });

  sound.addEventListener('click', () => {
    S.sound = !S.sound;
    setSoundEnabled(S.sound);
    sound.setAttribute('aria-pressed', String(S.sound));
    if (S.sound) { ensureContext(); sfxOk(); }
    save();
  });

  grow.addEventListener('click', () => {
    growUp();
    refreshCollection();
  });

  reset.addEventListener('click', () => {
    resetState();
    demo.setAttribute('aria-pressed', 'true');
    sound.setAttribute('aria-pressed', 'true');
    refreshCollection();
    refreshShellCards();
  });

  return { demo, sound };
}

/** `#point` or `?station=point` jumps straight into a station, as a QR scan would. */
function openDeepLink() {
  let id = (location.hash || '').replace('#', '').toLowerCase();
  if (!id) {
    try { id = (new URLSearchParams(location.search).get('station') || '').toLowerCase(); } catch (e) { /* ignore */ }
  }
  const station = stationById(id);
  if (station && S.hatched) startStation(station);
}

/* ======================= the frame loop =============================== */

let last = performance.now();
let saveTimer = 0;
let paintTimer = 0;
let galleryTimer = 0;

/**
 * An exception escaping `requestAnimationFrame` stops the loop for good and
 * the toy freezes with no way back. Catching it here and resetting to a known
 * screen means a bad frame costs one frame, not the session.
 */
function frame(now) {
  try { step(now); } catch (err) {
    console.error('frame error, recovering', err);
    try { session.pending = null; session.game = null; ui.story = null; go('home'); } catch (e) { /* last resort */ }
  }
  requestAnimationFrame(frame);
}

function step(now) {
  const dt = Math.min(MAX_FRAME_DT, (now - last) / 1000);
  last = now;

  update(dt);

  // the screen runs at 40fps while the simulation runs every frame
  paintTimer += dt;
  const paint = paintTimer >= PAINT_INTERVAL;
  if (paint) { paintTimer = 0; draw(); }

  galleryTimer += dt;
  if (galleryTimer > GALLERY_REFRESH_INTERVAL) { galleryTimer = 0; refreshCollection(); }

  if (device.isReady()) {
    // a still toy showing an unchanged screen needs no GPU work at all
    if (!paint && !device.isMoving()) { bookkeep(dt); return; }
    if (paint) device.uploadScreen();
    device.render(dt);
  } else if (fallbackCtx && paint) {
    fallbackCtx.drawImage(screenCanvas, 0, 0);
  }

  bookkeep(dt);
}

function bookkeep(dt) {
  saveTimer += dt;
  if (saveTimer > AUTOSAVE_INTERVAL) { saveTimer = 0; if (S.hatched) save(); }
}

/* ======================= bootstrap ==================================== */

function start() {
  load();
  if (!S.hatched) S.mode = 'hatch';

  const toggles = bindToggles();
  toggles.demo.setAttribute('aria-pressed', String(!!S.demo));
  toggles.sound.setAttribute('aria-pressed', String(!!S.sound));
  bindKeyboard();

  let hasWebGL = false;
  try {
    if (window.THREE && window.WebGLRenderingContext) {
      device.setShellChangedHandler(refreshShellCards);
      hasWebGL = device.build(viewport);
      device.bindPointer(press, setHeld);
    }
  } catch (err) {
    console.warn('WebGL unavailable, falling back to the flat screen', err);
    hasWebGL = false;
  }
  if (!hasWebGL) {
    mountFallback();
    applyTheme(SHELLS[S.shell || 'original'].pal);   // the chips still need a theme
  }

  buildCollection();
  buildShells();
  openDeepLink();

  last = performance.now();
  requestAnimationFrame(frame);
}

start();
