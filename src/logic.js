/**
 * logic.js — what the three buttons do, and what happens between frames.
 *
 * Two entry points:
 *   `press(button)` routes a button to the handler for the current mode
 *   `update(dt)`    advances needs, timers and minigame physics
 *
 * Both are pure game logic: they read and write state, and never touch the
 * framebuffer or the DOM.
 */

import {
  CRACK_DURATION, CRACK_SKIPPABLE_AFTER, WALK_HOME_DURATION,
  DAY_LENGTH_DEMO, DAY_LENGTH_REAL, DECAY_RATE_DEMO, DECAY_RATE_REAL,
  DECAY_HUNGER, DECAY_HAPPY, DECAY_ENERGY, REST_RECOVERY,
  ALPHABET, NAME_LENGTH
} from './config.js';
import { ITEMS, RECIPES, STATIONS, STORYMAP, MENU } from './data.js';
import {
  S, ui, session, go, msg, count, take, give, invList, foodList,
  consume, unlock, addKnow, save, startCrack, startNaming, finishNaming,
  startStation, endStation
} from './state.js';
import { W, wrap } from './graphics.js';
import { beep, ensureContext, sfxBad, sfxGet, sfxMove, sfxOk } from './audio.js';

/**
 * Whether each direction button is being *held*, as opposed to tapped.
 * Only the Punggol Point minigame cares, where the buttons steer the sampan.
 * Shared because both the keyboard and the 3D buttons set it.
 */
export const held = { left: false, right: false };

/* ======================= input ======================================== */

/**
 * @param {'select'|'confirm'|'back'} button
 *
 * Modes are checked most-modal first: a cutscene swallows input before the
 * menus ever see it. The generic `back` handler sits after those, so every
 * ordinary sub-screen gets "back returns home" without restating it.
 */
export function press(button) {
  ensureContext();
  const mode = S.mode;

  if (mode === 'hatch') {
    if (button === 'confirm') {
      S.hatched = true;
      unlock('NAME');
      S.know = Math.max(S.know, 3);
      startCrack();
      save();
    }
    return;
  }

  if (mode === 'crack') {
    if (button === 'confirm' && ui.crack > CRACK_SKIPPABLE_AFTER) startNaming();
    return;
  }

  if (mode === 'naming') {
    const n = ALPHABET.length;
    if (button === 'select') { ui.nm[ui.ni] = (ui.nm[ui.ni] + 1) % n; sfxMove(); }
    else if (button === 'back') { ui.nm[ui.ni] = (ui.nm[ui.ni] + n - 1) % n; sfxMove(); }
    else if (button === 'confirm') {
      if (ui.ni >= NAME_LENGTH - 1) finishNaming();
      else { ui.ni++; sfxOk(); }
    }
    return;
  }

  if (mode === 'evolve') {
    if (button === 'confirm' || button === 'back') {
      if (ui.pendResult) { ui.pendResult = false; go('result'); } else go('home');
    }
    return;
  }

  if (mode === 'result') {
    if (button === 'confirm' || button === 'back') { session.pending = null; go('home'); sfxOk(); }
    return;
  }

  if (mode === 'game') { gameInput(button); return; }

  if (mode === 'home') {
    if (button === 'select') { S.sel = (S.sel + 1) % MENU.length; sfxMove(); }
    else if (button === 'back') { S.sel = (S.sel + MENU.length - 1) % MENU.length; sfxMove(); }
    else if (button === 'confirm') { go(MENU[S.sel].mode); sfxOk(); }
    return;
  }

  // every remaining screen is a sub-screen: BACK always goes home
  if (button === 'back') { go('home'); beep(320, 0.07); return; }

  if (mode === 'feed') { feedInput(button); return; }
  if (mode === 'trail') { trailInput(button); return; }
  if (mode === 'rest') { if (button === 'confirm') go('home'); return; }
  if (mode === 'bag') { bagInput(button); return; }
  if (mode === 'shop') { shopInput(button); return; }
  if (mode === 'book') { bookInput(button); return; }
  if (mode === 'story') { storyInput(button); return; }
  if (mode === 'rank') { if (button === 'confirm') go('home'); }
}

function feedInput(button) {
  const list = foodList();
  if (!list.length) return;
  if (button === 'select') { ui.idx = (ui.idx + 1) % list.length; sfxMove(); }
  else if (button === 'confirm') {
    consume(list[ui.idx]);
    sfxGet();
    if (S.mode !== 'evolve') go('home');
    save();
  }
}

function bagInput(button) {
  const list = invList();
  if (!list.length) return;
  if (button === 'select') { ui.idx = (ui.idx + 1) % list.length; sfxMove(); }
  else if (button === 'confirm') {
    // a raw material has neither food nor toy effects, so say so rather than
    // silently doing nothing
    if (consume(list[ui.idx])) {
      sfxGet();
      if (S.mode !== 'evolve') go('home');
      save();
    } else { msg('RAW MATERIAL'); sfxBad(); }
  }
}

function trailInput(button) {
  const n = STATIONS.length + 1;      // the stations, plus REST AT HOME
  if (button === 'select') { ui.idx = (ui.idx + 1) % n; sfxMove(); }
  else if (button === 'confirm') {
    if (ui.idx < STATIONS.length) startStation(STATIONS[ui.idx]);
    else { go('rest'); ui.anim = 0; beep(320, 0.3, 'sine', 0.04); }
  }
}

function shopInput(button) {
  if (button === 'select') { ui.idx = (ui.idx + 1) % RECIPES.length; sfxMove(); }
  else if (button === 'confirm') {
    const recipe = RECIPES[ui.idx];
    for (const key in recipe.need) {
      if (count(key) < recipe.need[key]) { msg('NOT ENOUGH'); sfxBad(); return; }
    }
    for (const key in recipe.need) take(key, recipe.need[key]);
    give(recipe.out, 1);
    S.crafts++;
    if (ITEMS[recipe.out].tool === 'fish') S.hasNet = true;
    addKnow(3);
    unlock('PORT');
    if (S.crafts >= 3) unlock('MATILDA');
    if (S.crafts >= 5) unlock('LAST');
    msg('MADE ' + ITEMS[recipe.out].n);
    sfxGet();
    save();
  }
}

function bookInput(button) {
  if (!S.stories.length) return;
  if (button === 'select') { ui.idx = (ui.idx + 1) % S.stories.length; sfxMove(); }
  else if (button === 'confirm') {
    // read the pick *before* `go`, which resets ui.idx
    const pick = S.stories[ui.idx];
    go('story');
    ui.story = pick;
    ui.page = 0;
    sfxOk();
  }
}

function storyInput(button) {
  const story = STORYMAP[ui.story];
  if (!story) { go('book'); return; }          // a stale id from an older save
  const pages = Math.ceil(wrap(story.x, 25).length / 5);
  if (button !== 'confirm' && button !== 'select') return;

  ui.page++;
  if (ui.page < pages) { sfxMove(); return; }

  if (!S.read) S.read = [];
  if (S.read.indexOf(story.id) < 0) { S.read.push(story.id); addKnow(6); }
  if (S.mode !== 'evolve') go('book');
  sfxOk();
  save();
}

/** Minigame controls. Each game binds the three buttons differently. */
function gameInput(button) {
  const G = session.game;
  if (!G) return;

  if (G.k === 'tap') {
    if (button === 'confirm') {
      const distance = Math.abs(G.m - (G.zone + G.zw / 2));
      if (distance <= G.zw / 2) {
        G.hit++;
        if (distance <= 3) { G.perf++; beep(1040, 0.1); } else beep(800, 0.09);
        G.flash = 0.3;
      } else { sfxBad(); G.flash = -0.3; }
      G.taps++;
      G.sp = Math.min(104, G.sp + 8);          // the needle speeds up as you go
      if (G.taps >= G.max) setTimeout(endStation, 420);
    } else if (button === 'back') { session.game = null; go('home'); }
    return;
  }

  if (G.k === 'net') {
    if (button === 'select') {
      let next = G.cur;
      for (let i = 1; i <= G.holes.length; i++) {
        const j = (G.cur + i) % G.holes.length;
        if (G.holes[j].s < 3) { next = j; break; }   // skip holes already mended
      }
      G.cur = next;
      sfxMove();
    } else if (button === 'confirm') {
      const hole = G.holes[G.cur];
      if (hole.s < 3) {
        hole.s++;
        G.shake = 0.14;
        beep(580 + hole.s * 100, 0.06);
        if (hole.s >= 3) { G.fixed++; sfxGet(); gameInput('select'); }
      }
      if (G.fixed >= G.holes.length) setTimeout(endStation, 380);
    } else if (button === 'back') { session.game = null; go('home'); }
    return;
  }

  if (G.k === 'fish') {
    // BACK steers the sampan right, so it must never quit here.
    // CONFIRM is the way out of this one.
    if (button === 'confirm') { session.game = null; go('home'); }
  }
}

/* ======================= simulation =================================== */

/**
 * One tick of the world.
 * @param {number} dt seconds since the last frame, already clamped
 */
export function update(dt) {
  if (ui.msgT > 0) { ui.msgT -= dt; if (ui.msgT <= 0) ui.msg = null; }
  if (ui.fxT > 0) { ui.fxT -= dt; if (ui.fxT <= 0) ui.fx = null; }
  ui.anim += dt;

  if (!S.hatched) { S.mode = 'hatch'; return; }

  if (S.mode === 'crack') {
    ui.crack += dt;
    if (ui.crack >= CRACK_DURATION) startNaming();
    return;
  }

  const rate = S.demo ? DECAY_RATE_DEMO : DECAY_RATE_REAL;
  S.t += dt;
  if (S.t >= (S.demo ? DAY_LENGTH_DEMO : DAY_LENGTH_REAL)) { S.t = 0; S.day++; }

  if (S.mode !== 'rest') {
    S.hunger = Math.max(0, S.hunger - DECAY_HUNGER * rate * dt);
    S.happy = Math.max(0, S.happy - DECAY_HAPPY * rate * dt);
    S.energy = Math.max(0, S.energy - DECAY_ENERGY * rate * dt);
  } else {
    // energy only recovers once the walk home has finished and they are in bed
    if (ui.anim >= WALK_HOME_DURATION) S.energy = Math.min(100, S.energy + REST_RECOVERY * dt);
    const rested = S.energy >= 100 && ui.anim > WALK_HOME_DURATION + 1.2;
    if (rested || ui.anim > WALK_HOME_DURATION + 6) { S.energy = 100; go('home'); save(); }
    return;
  }

  if (S.mode !== 'game' || !session.game) return;
  updateGame(session.game, dt);
}

function updateGame(G, dt) {
  if (G.k === 'tap') {
    G.m += G.dir * G.sp * dt;
    if (G.m > 104) { G.m = 104; G.dir = -1; }
    if (G.m < 8) { G.m = 8; G.dir = 1; }
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    if (G.flash < 0) G.flash = Math.min(0, G.flash + dt);
    return;
  }

  if (G.k === 'net') {
    G.time -= dt;
    if (G.shake > 0) G.shake -= dt;
    if (G.time <= 0) endStation();
    return;
  }

  if (G.k === 'fish') {
    G.time -= dt;

    const speed = 76;
    if (held.left) G.bx -= speed * dt;
    if (held.right) G.bx += speed * dt;
    G.bx = Math.max(2, Math.min(W - 22, G.bx));

    G.spawn -= dt;
    if (G.spawn <= 0) {
      G.spawn = 0.48 + Math.random() * 0.4;
      const r = Math.random();
      const kind = r < 0.42 ? 'FISH' : r < 0.64 ? 'PRAWN' : r < 0.82 ? 'CRAB' : 'JUNK';
      G.drops.push({ x: 3 + Math.random() * (W - 16), y: -10, v: 26 + Math.random() * 20, k: kind });
    }

    for (let i = G.drops.length - 1; i >= 0; i--) {
      const drop = G.drops[i];
      drop.y += drop.v * dt;
      const caught = drop.y > 40 && drop.y < 58 && drop.x + 7 > G.bx && drop.x < G.bx + 20;
      if (caught) {
        if (drop.k === 'JUNK') { G.miss++; sfxBad(); }
        else {
          G.got[drop.k] = (G.got[drop.k] || 0) + (S.hasNet ? 2 : 1);   // the kelong net doubles a catch
          beep(860, 0.05);
          G.pop = 0.22;
        }
        G.drops.splice(i, 1);
        continue;
      }
      if (drop.y > 72) G.drops.splice(i, 1);   // sinks into the sea before it reaches the HUD
    }

    if (G.pop > 0) G.pop -= dt;
    if (G.time <= 0) endStation();
  }
}
