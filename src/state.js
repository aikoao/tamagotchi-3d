/**
 * state.js — the game, with no idea that a screen or a renderer exists.
 *
 * Three objects hold everything:
 *   `S`       persistent save state (what the player has earned)
 *   `ui`      transient view state (selection, animation clocks, messages)
 *   `session` the minigame currently running and the result waiting to show
 *
 * All three are exported as `const` objects and mutated in place rather than
 * reassigned, so every importing module keeps a valid reference for the life
 * of the page.
 */

import {
  STORAGE_KEY, KNOW_MAX, NAME_LENGTH, ALPHABET, SHELLS,
  STATION_ENERGY_COST, CRACK_DURATION
} from './config.js';
import { ITEMS, STAGES, TRADES, STORYMAP, FINAL_STAGE } from './data.js';
import { beep, sfxBad, sfxLevel, sfxOk, setSoundEnabled } from './audio.js';

/* ======================= persistent state ============================= */

/** A brand new save. Also the schema `sanitize()` repairs against. */
export function fresh() {
  return {
    hatched: false, day: 1, t: 0,
    hunger: 78, happy: 72, energy: 90, know: 0,
    stage: 0, trade: null, tradeCount: { fisher: 0, boatman: 0, tapper: 0 }, collected: [],
    inv: { FISH: 1, HERB: 1, OTAK: 1 }, stories: [], read: [], visits: 0, crafts: 0, hasNet: false,
    name: '', demo: true, sound: true, shell: 'original', sel: 0, mode: 'home'
  };
}

/** The live save state. */
export const S = fresh();

/** Replace every field of `S` in place, so references stay valid. */
function replaceState(next) {
  for (const key in S) delete S[key];
  Object.assign(S, next);
}

/** Wipe the save and start over. */
export function resetState() {
  replaceState(fresh());
  resetUi();
  session.game = null;
  session.pending = null;
  setSoundEnabled(S.sound);
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* private mode */ }
}

export function save() {
  try {
    const copy = {};
    for (const key in S) copy[key] = S[key];
    delete copy.mode;   // view state is never persisted
    delete copy.sel;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  } catch (e) { /* quota or private mode; the game keeps running */ }
}

/**
 * A save written by an older build can hold ids this build no longer knows.
 * Drop anything unrecognised here rather than letting a lookup throw halfway
 * through a frame — an exception escaping the render loop stops rAF for good.
 */
export function sanitize() {
  const base = fresh();
  S.stories = (Array.isArray(S.stories) ? S.stories : []).filter((id) => !!STORYMAP[id]);
  S.read = (Array.isArray(S.read) ? S.read : []).filter((id) => !!STORYMAP[id]);
  S.collected = (Array.isArray(S.collected) ? S.collected : []).filter((id) => !!TRADES[id]);
  if (S.trade && !TRADES[S.trade]) S.trade = null;

  const counts = {};
  for (const key in base.tradeCount) counts[key] = (S.tradeCount && +S.tradeCount[key]) || 0;
  S.tradeCount = counts;

  const inv = {};
  for (const key in (S.inv || {})) if (ITEMS[key] && S.inv[key] > 0) inv[key] = S.inv[key];
  S.inv = inv;

  S.stage = Math.max(0, Math.min(FINAL_STAGE, +S.stage || 0));
  if (S.stage === FINAL_STAGE && !S.trade) S.trade = 'fisher';
  if (!SHELLS[S.shell]) S.shell = 'original';
  S.name = String(S.name || '').toUpperCase().replace(/[^A-Z ]/g, '').slice(0, NAME_LENGTH);
  ['hunger', 'happy', 'energy'].forEach((key) => {
    S[key] = Math.max(0, Math.min(100, +S[key] || 0));
  });
  S.know = Math.max(0, +S.know || 0);
  S.day = Math.max(1, +S.day || 1);
  S.mode = 'home';
  S.sel = 0;
}

/** @returns true if a save was restored. */
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { setSoundEnabled(S.sound); return false; }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;
    replaceState(Object.assign(fresh(), parsed));
    sanitize();
    setSoundEnabled(S.sound);
    return true;
  } catch (e) {
    replaceState(fresh());
    return false;
  }
}

/* ======================= transient view state ========================= */

/** Selection, animation clocks and one-shot effects. Never persisted. */
export const ui = {
  idx: 0, page: 0,
  msg: null, msgT: 0,
  anim: 0,
  fx: null, fxT: 0,
  story: null, wrapId: null, wrapLines: null,
  pendResult: false,
  nm: [0, 0, 0, 0, 0], ni: 0,
  crack: 0
};

export function resetUi() {
  Object.assign(ui, {
    idx: 0, page: 0, msg: null, msgT: 0, anim: 0, fx: null, fxT: 0,
    story: null, wrapId: null, wrapLines: null, pendResult: false,
    nm: [0, 0, 0, 0, 0], ni: 0, crack: 0
  });
}

/** Switch screens. Always resets the cursor, so no screen inherits another's. */
export function go(mode) {
  S.mode = mode;
  ui.idx = 0;
  ui.page = 0;
}

/** Flash a short message over the current screen. */
export function msg(text) {
  ui.msg = text;
  ui.msgT = 2.0;
}

/* ======================= hatching & naming ============================ */

export function startCrack() {
  ui.crack = 0;
  go('crack');
  sfxOk();
  setTimeout(() => beep(300, 0.07, 'square', 0.05), 520);
  setTimeout(() => beep(260, 0.08, 'square', 0.055), 1180);
  setTimeout(() => sfxLevel(), 1900);
}

export function startNaming() {
  ui.nm = new Array(NAME_LENGTH).fill(0);
  ui.ni = 0;
  go('naming');
}

export function finishNaming() {
  const name = ui.nm.map((i) => ALPHABET[i]).join('').replace(/^ +| +$/g, '');
  S.name = name || 'KIDDO';
  go('home');
  sfxLevel();
  save();
}

/* ======================= inventory ==================================== */

export function count(id) { return S.inv[id] || 0; }
export function give(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; }
export function take(id, n = 1) {
  const left = (S.inv[id] || 0) - n;
  if (left <= 0) delete S.inv[id]; else S.inv[id] = left;
}
/** Everything currently carried, in a stable order. */
export function invList() { return Object.keys(S.inv).filter((k) => S.inv[k] > 0 && ITEMS[k]); }
/** Only the items the EAT screen should offer. */
export function foodList() { return invList().filter((k) => ITEMS[k].food); }

/** Apply an item's effects and consume one of it. */
export function consume(id) {
  const item = ITEMS[id];
  if (item.toy) {
    S.happy = Math.min(100, S.happy + item.toy.happy);
    addKnow(2);
    ui.fx = { k: 'play', s: item.s };
  } else if (item.food) {
    S.hunger = Math.min(100, S.hunger + item.food.hunger);
    if (item.food.energy) S.energy = Math.min(100, S.energy + item.food.energy);
    if (item.food.happy) S.happy = Math.min(100, S.happy + item.food.happy);
    if (item.food.know) addKnow(item.food.know);
    ui.fx = { k: 'eat', s: item.s };
  } else {
    return false;
  }
  ui.fxT = 1.4;
  take(id, 1);
  return true;
}

/* ======================= progression ================================== */

/** @returns true if this story had not been found before. */
export function unlock(id) {
  if (S.stories.indexOf(id) < 0) { S.stories.push(id); return true; }
  return false;
}

export function score() { return S.know * 10 + S.visits * 50 + S.crafts * 30; }

export function addKnow(n) {
  S.know = Math.min(KNOW_MAX, S.know + n);
  checkEvolve();
}

/**
 * Promote the child if their knowledge has passed a stage threshold.
 * At the final stage they take up whichever trade they practised most.
 * @returns true if a promotion happened.
 */
export function checkEvolve() {
  let target = S.stage;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (S.know >= STAGES[i].need) { target = i; break; }
  }
  if (target <= S.stage) return false;

  S.stage = target;
  if (S.stage === 1) unlock('FARMS');
  if (S.stage === 2) unlock('PIGS');
  if (S.stage === FINAL_STAGE) {
    let best = 'fisher';
    let bestCount = -1;
    for (const key in S.tradeCount) {
      if (S.tradeCount[key] > bestCount) { bestCount = S.tradeCount[key]; best = key; }
    }
    S.trade = best;
    unlock('NEWTOWN');
    if (!S.collected) S.collected = [];
    if (S.collected.indexOf(best) < 0) S.collected.push(best);
  }
  go('evolve');
  ui.anim = 0;
  sfxLevel();
  return true;
}

/** Jump straight to a finished character. Used by the collection cards. */
export function wearTrade(id) {
  if (!S.hatched) { S.hatched = true; unlock('NAME'); }
  if (!S.name) S.name = 'KIDDO';
  S.stage = FINAL_STAGE;
  S.trade = id;
  S.hunger = Math.max(S.hunger, 70);
  S.happy = Math.max(S.happy, 70);
  S.energy = Math.max(S.energy, 70);
  S.know = Math.max(S.know, STAGES[FINAL_STAGE].need);
  if (!S.collected) S.collected = [];
  if (S.collected.indexOf(id) < 0) S.collected.push(id);
  unlock('NEWTOWN');
  session.pending = null;
  session.game = null;
  go('home');
  sfxLevel();
  save();
}

/** One step up the growth ladder. Used by the Grow up demo button. */
export function growUp() {
  if (!S.hatched) { S.hatched = true; unlock('NAME'); go('home'); }
  if (!S.name) S.name = 'KIDDO';
  const next = Math.min(FINAL_STAGE, S.stage + 1);
  S.know = Math.max(S.know, STAGES[next].need);
  S.hunger = Math.max(S.hunger, 70);
  S.energy = Math.max(S.energy, 70);
  S.happy = Math.max(S.happy, 70);
  checkEvolve();
  save();
}

/* ======================= stations ===================================== */

/**
 * The running minigame and the result screen waiting to be shown.
 * `game` is null outside a minigame; its `k` field names which one.
 */
export const session = { game: null, pending: null };

/** Start a station's minigame, if the child has the energy for it. */
export function startStation(station) {
  if (S.energy < STATION_ENERGY_COST) { msg('TOO TIRED'); sfxBad(); return; }
  S.energy = Math.max(0, S.energy - STATION_ENERGY_COST);

  if (station.game === 'tap') {
    session.game = { k: 'tap', st: station, m: 8, dir: 1, sp: 62, taps: 0, max: 5, hit: 0, perf: 0, flash: 0, zone: 46, zw: 18 };
  } else if (station.game === 'net') {
    session.game = {
      k: 'net', st: station, time: 18, cur: 0, fixed: 0, shake: 0,
      holes: [{ x: 0, y: 0, s: 0 }, { x: 2, y: 1, s: 0 }, { x: 1, y: 2, s: 0 }, { x: 3, y: 0, s: 0 }]
    };
  } else if (station.game === 'fish') {
    session.game = { k: 'fish', st: station, time: 22, bx: 48, drops: [], spawn: 0, got: {}, miss: 0, pop: 0 };
  }
  go('game');
  beep(640, 0.07);
}

/** Score the finished minigame, hand out loot, and queue the result screen. */
export function endStation() {
  const G = session.game;
  if (!G) return;
  const station = G.st;
  const out = {};
  let bonus = 0;

  if (G.k === 'tap') {
    out.LATEX = G.hit;
    if (G.perf >= 2) out.HERB = 1;
    if (G.hit >= 4) out.HERB = (out.HERB || 0) + 1;
    bonus = G.hit * 2 + G.perf;
  } else if (G.k === 'net') {
    out.ROPE = G.fixed;
    if (G.fixed >= 3) out.SHELL = 1;
    bonus = G.fixed * 2;
  } else {
    for (const key in G.got) if (key !== 'JUNK') out[key] = G.got[key];
    bonus = Math.min(8, (G.got.FISH || 0) + (G.got.PRAWN || 0) + (G.got.CRAB || 0));
  }

  for (const key in out) if (out[key] > 0) give(key, out[key]);

  const know = 4 + Math.min(8, bonus);
  S.visits++;
  S.tradeCount[station.trade] = (S.tradeCount[station.trade] || 0) + 1;
  S.happy = Math.min(100, S.happy + 14);

  const newStory = unlock(station.story);
  if (S.visits === 1) unlock('SUMANG');
  if (S.visits === 3) unlock('TRACKS');
  if (S.visits === 5) unlock('ROAD');
  if (S.visits === 7) unlock('ZOO');

  session.pending = { title: station.n, out, know, newStory };
  session.game = null;
  addKnow(know);                        // may promote, which switches to 'evolve'
  if (S.mode !== 'evolve') go('result'); else ui.pendResult = true;
  save();
}

/** True while the hatching cutscene is still playing. */
export function crackFinished() { return ui.crack >= CRACK_DURATION; }
