/**
 * screens.js — one function per game mode, and the router that picks between
 * them.
 *
 * Every function here is a pure consumer: it reads state and calls graphics
 * primitives. None of them mutate the game, which is what lets the renderer
 * run at a different rate from the simulation.
 */

import {
  COL, ALPHABET, NAME_LENGTH, WALK_HOME_DURATION, STATION_ENERGY_COST
} from './config.js';
import {
  ITEMS, RECIPES, STATIONS, STORIES, STORYMAP, STAGES, TRADES, MENU, BOARD, FINAL_STAGE
} from './data.js';
import { SPR } from './sprites.js';
import { S, ui, session, count, invList, foodList, score } from './state.js';
import {
  W, H, present, px, rect, frame, hline, vline, disc, panel,
  text, textR, textC, wrap, sprite, statBar, headerBar, statusBar, listRow,
  sky, cloud, sun, seaBand, groundBand, drawChar, shirtOver, currentBodySprite
} from './graphics.js';

/* ======================= home ========================================= */

function drawStats() {
  rect(0, 10, W, 12, COL.panel);
  hline(0, 21, W, COL.panel2);
  const rows = [
    ['iHunger', S.hunger, COL.O],
    ['iHappy', S.happy, COL.Y],
    ['iEnergy', S.energy, COL.T],
    ['iKnow', Math.min(100, S.know), COL.L]
  ];
  rows.forEach((row, i) => {
    const x = 1 + i * 28;
    sprite(row[0], x, 12, {});
    statBar(x + 10, 13, 16, row[1], row[2]);
  });
}

function drawMenu() {
  rect(0, 79, W, 17, COL.panel);
  hline(0, 79, W, COL.panel2);
  for (let i = 0; i < MENU.length; i++) {
    const x = 5 + i * 18;
    if (i === S.sel) panel(x - 3, 79, 17, 17, COL.Y);
    sprite(MENU[i].icon, x, 81, {});
  }
}

function drawHome() {
  sky(22, 54);
  sun(92, 37); cloud(13, 32); cloud(60, 29);
  seaBand(54, 60, ui.anim);
  groundBand(60, 79);
  sprite('house', 2, 57, {});
  sprite('palm', 92, 59, {});
  drawChar(44, 44);
  statusBar(); drawStats(); drawMenu();
  if (ui.msg) { panel(10, 34, 92, 16, COL.K); textC(ui.msg, 40, COL.W); }
}

/* ======================= hatching ===================================== */

function drawHatch() {
  sky(0, 50); seaBand(50, 58, ui.anim); groundBand(58, 96);
  sun(98, 36); cloud(8, 36);
  sprite('palm', 2, 42, {}); sprite('palm', 94, 46, {});
  textC('ARE YOU READY TO', 8, COL.W, 1, 0, W, COL.u);
  textC('PUNG-GO!', 17, COL.Y, 2, 0, W, COL.u);

  const sway = (Math.sin(ui.anim * 4) > 0 ? 0 : 1) + (Math.sin(ui.anim * 1.7) > 0 ? 0 : 1);
  for (let i = 0; i < 18; i++) px(47 + i, 61, COL.grass2);
  sprite('egg', 44 + (sway - 1), 30, {});

  if (Math.floor(ui.anim * 1.6) % 2 === 0) {
    panel(12, 78, 88, 14, COL.K);
    textC('> CONFIRM TO HATCH', 82, COL.Y);
  }
}

/**
 * The hatching cutscene, in three acts driven by one clock:
 *   0.0-2.0s  the egg rocks while a crack spreads across it
 *   2.0-2.5s  a flash, then the shell lifts apart
 *   2.5s+     the child hops out among the shards
 */
function drawCrack() {
  const t = ui.crack;
  sky(0, 50); seaBand(50, 58, ui.anim); groundBand(58, 96);
  sun(98, 36); cloud(8, 36);
  sprite('palm', 2, 42, {}); sprite('palm', 94, 46, {});
  for (let i = 0; i < 18; i++) px(47 + i, 61, COL.grass2);

  if (t < 2.0) {
    const amplitude = t < 1.3 ? 1 : 2;                     // wobbles harder as it cracks
    const shake = Math.round(Math.sin(t * (8 + t * 7)) * amplitude);
    const stage = t < 0.6 ? 'egg' : (t < 1.3 ? 'egg1' : (t < 1.75 ? 'egg2' : 'egg3'));
    sprite(stage, 44 + shake, 30, {});
    if (t > 1.3 && Math.floor(t * 12) % 2 === 0) {         // flecks of shell
      px(42 + shake, 34, COL.W); px(68 + shake, 40, COL.W); px(40 + shake, 46, COL.W);
    }
    textC(t < 1.3 ? 'IT IS MOVING...' : 'ALMOST...', 86, COL.W, 1, 0, W, COL.u);
  } else if (t < 2.5) {
    const k = (t - 2.0) / 0.5;
    if (k < 0.12) { rect(0, 0, W, H, COL.W); textC('CRACK!', 86, COL.K, 1, 0, W); return; }
    const e = (k - 0.12) / 0.88;
    const lift = Math.round(e * e * 16);
    const slide = Math.round(e * 9);
    const tip = Math.round(e * 4);
    sprite('eggBot', 44 + slide, 30, {});
    sprite('eggTop', 44 - slide - tip, 30 - lift, {});
    if (e > 0.25) sprite(currentBodySprite(), 44, 31, shirtOver());
    textC('CRACK!', 86, COL.Y, 1, 0, W, COL.u);
  } else {
    const k = t - 2.5;
    const hop = k < 0.6 ? -Math.round(Math.abs(Math.sin(k * 9)) * 3) : 0;
    sprite('shardL', 33, 55, {});
    sprite('shardR', 72, 56, {});
    sprite(currentBodySprite(), 44, 31 + hop, shirtOver());
    if (Math.floor(k * 6) % 2 === 0) {
      px(36, 30, COL.Y); px(76, 32, COL.Y); px(40, 24, COL.Y); px(72, 26, COL.Y);
    }
    textC('A KAMPONG KID!', 86, COL.Y, 1, 0, W, COL.u);
  }
}

function drawNaming() {
  rect(0, 0, W, H, COL.panel);
  sprite(currentBodySprite(), 44, 15, shirtOver());
  for (let i = 0; i < NAME_LENGTH; i++) {
    const x = 6 + i * 20;
    const active = i === ui.ni;
    panel(x, 48, 18, 22, active ? COL.Y : COL.panel2);
    const ch = ALPHABET[ui.nm[i]];
    if (ch !== ' ') text(ch, x + 4, 52, COL.K, 3);
    if (active && Math.floor(ui.anim * 3) % 2 === 0) rect(x + 3, 66, 12, 2, COL.r);
  }
  headerBar('NAME YOUR KID');
  panel(2, 76, 108, 18, COL.head);
  textC('SELECT / BACK = LETTER', 80, COL.W);
  textC(ui.ni >= NAME_LENGTH - 1 ? 'CONFIRM = DONE' : 'CONFIRM = NEXT', 87, COL.A);
}

function drawEvolve() {
  sky(0, 96);
  for (let i = 0; i < 18; i++) {
    const a = ui.anim * 2 + i * 0.8;
    const r = 16 + ((ui.anim * 22 + i * 9) % 34);
    disc(56 + Math.cos(a) * r, 48 + Math.sin(a) * r * 0.7, 2, i % 2 ? COL.Y : COL.W);
  }
  textC('EVOLVED!', 8, COL.W, 2, 0, W, COL.u);
  drawChar(44, 26, true);
  panel(4, 62, 104, 16, COL.K);
  const stage = STAGES[S.stage];
  const finished = S.stage === FINAL_STAGE && S.trade && TRADES[S.trade];
  textC(finished ? TRADES[S.trade].n : stage.n, 67, COL.Y);
  if (S.stage === FINAL_STAGE && S.trade) textC('SKILLED RESIDENT', 82, COL.W);
  else if (Math.floor(ui.anim * 1.6) % 2 === 0) textC('> CONFIRM', 82, COL.W);
}

/* ======================= resting ====================================== */

function drawRest() {
  const t = ui.anim;
  if (t < WALK_HOME_DURATION) drawWalkHome(t);
  else drawBedroom(t - WALK_HOME_DURATION);
}

function drawWalkHome(t) {
  sky(14, 54); seaBand(54, 60, ui.anim); groundBand(60, 96);
  sun(96, 30); cloud(60, 26);
  sprite('house', 4, 62, {});
  sprite('palm', 94, 64, {});

  const k = Math.min(1, t / WALK_HOME_DURATION);
  const x = Math.round(62 - 46 * k);
  const step = Math.floor(t * 7) % 2;
  const base = currentBodySprite();
  const name = (step && SPR[base + '_w']) ? base + '_w' : base;

  for (let i = 0; i < 16; i++) px(x + 4 + i, 80, COL.grass2);
  sprite(name, x, 80 - 29 - (step ? 1 : 0), shirtOver());
  headerBar('WALKING HOME');
}

/** The bedroom, seen from directly above. */
function drawBedroom(t) {
  rect(0, 14, W, 62, COL.B);
  for (let x = 3; x < W; x += 11) { vline(x, 14, 62, COL.b); vline(x + 1, 14, 62, COL.D); }

  // woven mat on the floor
  rect(5, 42, 23, 30, COL.A); frame(5, 42, 23, 30, COL.b);
  for (let i = 3; i < 30; i += 4) hline(6, 42 + i, 21, COL.n);
  for (let i = 3; i < 23; i += 4) vline(5 + i, 43, 28, COL.n);

  // bedside table with a kerosene lamp
  rect(84, 24, 23, 20, COL.b); frame(84, 24, 23, 20, COL.D);
  rect(91, 34, 9, 3, COL.D);
  rect(93, 27, 5, 7, COL.Y);
  disc(95, 25, 2, COL.O);

  // slippers
  [86, 97].forEach((x) => {
    rect(x, 52, 8, 11, COL.b); frame(x, 52, 8, 11, COL.D); hline(x + 1, 55, 6, COL.A);
  });

  // bed
  rect(34, 16, 44, 58, COL.b); frame(34, 16, 44, 58, COL.D);
  rect(36, 18, 40, 54, COL.N);
  rect(39, 20, 34, 16, COL.W); frame(39, 20, 34, 16, COL.n);

  sprite('headsleep', 44, 21, shirtOver());

  // blanket pulled up to the chin, with two hands over it
  rect(36, 35, 40, 37, COL.C);
  hline(36, 35, 40, COL.W); hline(36, 36, 40, COL.c);
  for (let y = 43; y < 72; y += 7) hline(37, y, 38, COL.c);
  rect(38, 39, 5, 7, COL.S); rect(69, 39, 5, 7, COL.S);

  const z = Math.floor(t * 1.6) % 3;
  if (z >= 0) text('Z', 66, 31 - z * 2, COL.K);
  if (z >= 1) text('Z', 72, 25 - z * 2, COL.D, 2);
  if (z >= 2) text('Z', 81, 17 - z, COL.b, 2);

  headerBar('RESTING');
  rect(0, 76, W, 20, COL.panel); hline(0, 76, W, COL.panel2);
  textC('ENERGY ' + Math.round(S.energy) + '%', 80, COL.K);
  statBar(10, 87, 92, S.energy, COL.T);
}

/* ======================= menus ======================================== */

/** The shared body of EAT and BAG: a scrolling window of four rows. */
function drawItemList(list) {
  const start = Math.max(0, Math.min(ui.idx - 2, list.length - 4));
  for (let i = 0; i < Math.min(4, list.length); i++) {
    const key = list[start + i];
    if (!key) break;
    const y = 18 + i * 14;
    const on = (start + i) === ui.idx;
    listRow(on, y);
    sprite(ITEMS[key].s, 4, y + 2, {});
    text(ITEMS[key].n, 17, y + 4, COL.K);
    textR('x' + count(key), 106, y + 4, on ? COL.K : COL.u);
  }
}

function drawFeed() {
  rect(0, 0, W, H, COL.panel);
  headerBar('EAT');
  const list = foodList();
  if (!list.length) {
    textC('NOTHING TO EAT', 38, COL.K, 1);
    textC('COOK AT THE MAMA SHOP', 56, COL.K);
    panel(2, 80, 108, 14, COL.coral); textC('BACK', 84, COL.W);
    return;
  }
  drawItemList(list);
  const item = ITEMS[list[ui.idx]];
  panel(2, 76, 108, 18, COL.coral);
  textC('+' + item.food.hunger + ' HUNGER', 80, COL.W);
  textC('CONFIRM TO EAT', 87, COL.A);
}

function drawBag() {
  rect(0, 0, W, H, COL.panel);
  headerBar('BAG');
  const list = invList();
  if (!list.length) {
    textC('BAG IS EMPTY', 44, COL.K, 1);
    panel(2, 80, 108, 14, COL.coral); textC('BACK', 84, COL.W);
    return;
  }
  drawItemList(list);
  const item = ITEMS[list[ui.idx]];
  panel(2, 76, 108, 18, COL.head);
  textC(list.length + ' KINDS CARRIED', 80, COL.W);
  textC(
    item && item.toy ? 'CONFIRM TO PLAY' : item && item.food ? 'CONFIRM TO EAT' : 'SELECT TO SCROLL',
    87, COL.A
  );
}

function drawTrail() {
  rect(0, 0, W, H, COL.panel);
  headerBar('WHERE TO?');
  const options = STATIONS.map((s) => s.n).concat(['REST AT HOME']);
  for (let i = 0; i < options.length; i++) {
    const y = 18 + i * 14;
    const on = i === ui.idx;
    listRow(on, y);
    text(i < STATIONS.length ? (i + 1) + '.' : '  ', 5, y + 4, on ? COL.r : COL.u);
    text(options[i], 15, y + 4, COL.K);
  }
  const tired = S.energy < STATION_ENERGY_COST;
  panel(2, 76, 108, 18, tired ? COL.r : COL.head);
  textC('ENERGY ' + Math.round(S.energy) + '   COST ' + STATION_ENERGY_COST, tired ? 78 : 82, COL.W);
  if (tired) textC('TOO TIRED - REST FIRST', 86, COL.A);
}

function drawShop() {
  rect(0, 0, W, H, COL.panel);
  headerBar('MAMA SHOP');
  const recipe = RECIPES[ui.idx];
  const out = ITEMS[recipe.out];
  textR((ui.idx + 1) + '/' + RECIPES.length, 108, 5, COL.A);

  panel(2, 18, 108, 18, COL.panel2);
  sprite(out.s, 5, 20, {});
  text(out.n, 19, 22, COL.K);
  const effect = out.food ? ('+' + out.food.hunger + ' HUNGER')
    : out.toy ? ('+' + out.toy.happy + ' HAPPY')
      : 'TOOL: 2X FISH';
  text(effect, 19, 29, COL.u);

  let affordable = true;
  const keys = Object.keys(recipe.need);
  let x = 6;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const need = recipe.need[key];
    const have = count(key);
    if (have < need) affordable = false;
    panel(x - 2, 39, 34, 27, have >= need ? COL.panel2 : COL.n);
    sprite(ITEMS[key].s, x + 10, 42, {});
    textC(have + ' / ' + need, 55, have >= need ? COL.g : COL.r, 1, x - 2, x + 32);
    x += 36;
  }

  panel(2, 70, 108, 24, affordable ? COL.g : COL.n);
  if (ui.msg) textC(ui.msg, 79, COL.W);
  else {
    textC(affordable ? '> CONFIRM TO MAKE' : 'NEED MORE ITEMS', 76, COL.W);
    textC('SELECT FOR NEXT RECIPE', 85, affordable ? COL.A : COL.W);
  }
}

/* ======================= library & leaderboard ======================== */

function drawBook() {
  rect(0, 0, W, H, COL.panel);
  headerBar('STORIES');
  if (!S.stories.length) {
    textC('NO STORIES YET', 44, COL.K, 1);
    panel(2, 80, 108, 14, COL.coral); textC('VISIT A STATION', 84, COL.W);
    return;
  }
  const start = Math.max(0, Math.min(ui.idx - 2, S.stories.length - 4));
  for (let i = 0; i < Math.min(4, S.stories.length); i++) {
    const id = S.stories[start + i];
    if (!id) break;
    const y = 18 + i * 14;
    const on = (start + i) === ui.idx;
    const seen = S.read && S.read.indexOf(id) >= 0;
    listRow(on, y);
    text(on ? '>' : ' ', 5, y + 4, COL.r);
    text((STORYMAP[id] && STORYMAP[id].t) || '?', 13, y + 4, COL.K);
    if (!seen) disc(103, y + 6, 3, COL.R);
  }
  panel(2, 76, 108, 18, COL.L);
  textC(S.stories.length + ' OF ' + STORIES.length + ' FOUND', 80, COL.W);
  textC('CONFIRM TO READ', 87, COL.A);
}

function drawStory() {
  rect(0, 0, W, H, COL.panel);
  const story = STORYMAP[ui.story];
  if (!story) { drawBook(); return; }     // a stale id from an older save
  headerBar(story.t, COL.L, COL.purpD);

  // wrapping is cached, because it is the same every frame for the same story
  if (ui.wrapId !== story.id) { ui.wrapId = story.id; ui.wrapLines = wrap(story.x, 25); }
  const lines = ui.wrapLines;
  const pages = Math.ceil(lines.length / 5);
  const page = Math.min(ui.page, pages - 1);

  panel(2, 18, 108, 56, COL.panel2);
  for (let i = 0; i < 5; i++) {
    const line = lines[page * 5 + i];
    if (line) text(line, 6, 23 + i * 10, COL.K);
  }
  panel(2, 76, 108, 18, COL.L);
  textC((page + 1) + ' / ' + pages, 80, COL.W);
  const seen = S.read && S.read.indexOf(story.id) >= 0;
  textC(
    page + 1 >= pages ? (seen ? 'CONFIRM TO CLOSE' : 'CONFIRM  +6 KNOWLEDGE') : 'CONFIRM FOR MORE',
    87, COL.A
  );
}

function drawRank() {
  rect(0, 0, W, H, COL.panel);
  headerBar('TOP EXPLORERS', COL.u, COL.blueD);
  const me = { n: S.name || 'YOU', s: score(), me: true };
  const all = BOARD.concat([me]).sort((a, b) => b.s - a.s);
  for (let i = 0; i < Math.min(5, all.length); i++) {
    const entry = all[i];
    const y = 18 + i * 14;
    panel(2, y, 108, 13, entry.me ? COL.Y : COL.panel2);
    text(String(i + 1), 5, y + 4, i === 0 ? COL.O : COL.u);
    text(entry.n.slice(0, 13), 13, y + 4, COL.K);
    textR(String(entry.s), 106, y + 4, COL.K);
  }
}

function drawResult() {
  const pending = session.pending;
  sky(0, 96);
  for (let i = 0; i < 10; i++) {
    const a = ui.anim * 1.6 + i;
    const r = 30 + ((ui.anim * 10 + i * 6) % 16);
    disc(56 + Math.cos(a) * r, 46 + Math.sin(a) * r * 0.6, 2, COL.Y);
  }
  headerBar('STATION CLEAR', COL.g, COL.greenD);
  textC(pending.title, 19, COL.W, 2, 0, W, COL.u);

  const keys = Object.keys(pending.out).filter((k) => pending.out[k] > 0);
  panel(6, 32, 100, 26, COL.panel);
  if (!keys.length) textC('NOTHING GATHERED', 41, COL.n);
  else {
    let x = Math.max(8, (W - keys.length * 26) >> 1);
    for (const key of keys) {
      sprite(ITEMS[key].s, x, 34, {});
      text('x' + pending.out[key], x + 11, 45, COL.K);
      x += 26;
    }
  }
  panel(6, 60, 100, 14, COL.L);
  textC('+' + pending.know + ' KNOWLEDGE', 64, COL.W);
  if (pending.newStory) { panel(6, 76, 100, 12, COL.O); textC('NEW STORY FOUND!', 79, COL.W); }
  else if (Math.floor(ui.anim * 1.6) % 2 === 0) {
    panel(6, 76, 100, 12, COL.K); textC('> CONFIRM', 79, COL.Y);
  }
}

/* ======================= minigames ==================================== */

/** Rubber tapping: stop a sweeping needle inside the green band. */
function drawTap(G) {
  sky(14, 60); groundBand(60, 76); rect(0, 76, W, 20, COL.panel);
  sun(98, 24); cloud(20, 28);

  rect(14, 16, 16, 52, COL.b);
  rect(17, 16, 10, 52, COL.B);
  for (let i = 0; i < 5; i++) hline(15, 22 + i * 9, 14 - i, COL.D);
  for (let i = 0; i < 14; i++) px(16 + i, 24 + i * 1.4, COL.N);
  disc(22, 24, 12, COL.g); disc(13, 21, 8, COL.G); disc(32, 21, 8, COL.G); disc(22, 19, 9, COL.G);

  rect(20, 56, 12, 9, COL.K); rect(21, 57, 10, 7, COL.n);
  const fill = Math.min(6, G.hit);
  if (fill) rect(21, 64 - fill, 10, fill, COL.N);

  drawChar(50, 39, true);
  headerBar('RUBBER TAPPING');

  panel(2, 78, 108, 16, COL.panel2);
  rect(5, 81, 102, 10, COL.n);
  rect(G.zone, 81, G.zw, 10, COL.G);
  rect(G.zone + (G.zw >> 1) - 2, 81, 4, 10, COL.g);
  const m = Math.round(G.m);
  rect(m - 1, 79, 3, 14, COL.K); rect(m, 80, 1, 12, COL.R);

  text('TAP ' + G.taps + '/' + G.max, 4, 70, COL.W, 1, COL.K);
  textR('GOT ' + G.hit, 108, 70, COL.W, 1, COL.K);
  if (G.flash > 0) { panel(62, 30, 44, 14, COL.g); textC('GREAT!', 34, COL.W, 1, 62, 106); }
  if (G.flash < 0) { panel(62, 30, 44, 14, COL.r); textC('MISSED', 34, COL.W, 1, 62, 106); }
}

/** Mending a kelong net: three stitches per hole, against the clock. */
function drawNet(G) {
  sky(14, 52); seaBand(52, 96, ui.anim);
  headerBar('MEND A NET');

  const ox = 26;
  const oy = 18;
  const cell = 14;
  const shake = G.shake > 0 ? (Math.random() * 2 | 0) : 0;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const x = ox + c * cell + shake;
      const y = oy + r * cell;
      frame(x, y, cell + 1, cell + 1, COL.b);
      frame(x + 1, y + 1, cell - 1, cell - 1, COL.B);
    }
  }
  G.holes.forEach((hole, i) => {
    const x = ox + hole.x * cell + shake;
    const y = oy + hole.y * cell;
    if (hole.s >= 3) {
      rect(x + 1, y + 1, cell - 1, cell - 1, COL.B);
      for (let k = 2; k < cell; k += 3) {
        hline(x + 1, y + k, cell - 1, COL.Y);
        vline(x + k, y + 1, cell - 1, COL.Y);
      }
      frame(x, y, cell + 1, cell + 1, COL.g);
    } else {
      rect(x + 1, y + 1, cell - 1, cell - 1, COL.sea1);
      frame(x, y, cell + 1, cell + 1, COL.K);
      frame(x + 1, y + 1, cell - 1, cell - 1, COL.K);
      for (let k = 0; k < hole.s; k++) hline(x + 2, y + 3 + k * 4, cell - 3, COL.Y);
    }
    if (i === G.cur && Math.floor(ui.anim * 5) % 2 === 0) frame(x - 2, y - 2, cell + 5, cell + 5, COL.R);
  });

  rect(0, 62, W, 34, COL.panel); hline(0, 62, W, COL.panel2);
  text('FIXED ' + G.fixed + ' / ' + G.holes.length, 4, 66, COL.K);
  statBar(4, 76, 104, Math.max(0, G.time) / 18 * 100, G.time < 6 ? COL.R : COL.T);
  text('SELECT=MOVE', 4, 88, COL.u);
  textR('CONFIRM=SEW', 108, 88, COL.u);
}

/** Punggol Point: steer a sampan under falling seafood. */
function drawFish(G) {
  sky(14, 54);
  sun(96, 26); cloud(18, 30);
  seaBand(54, 80, ui.anim);
  rect(0, 80, W, 16, COL.panel); hline(0, 80, W, COL.panel2);

  G.drops.forEach((d) => {
    sprite(d.k === 'JUNK' ? 'junk' : ITEMS[d.k].s, Math.round(d.x), Math.round(d.y), {});
  });

  const bx = Math.round(G.bx);
  rect(bx, 46, 20, 3, COL.b);
  rect(bx + 1, 49, 18, 4, COL.B);
  rect(bx + 3, 53, 14, 3, COL.b);
  px(bx, 45, COL.b); px(bx + 19, 45, COL.b);
  rect(bx + 8, 36, 2, 10, COL.D);
  rect(bx + 10, 37, 6, 7, COL.N);
  if (G.pop > 0) { disc(bx + 10, 32, 4, COL.Y); text('+', bx + 8, 30, COL.K); }

  headerBar('PUNGGOL POINT');
  const caught = (G.got.FISH || 0) + (G.got.PRAWN || 0) + (G.got.CRAB || 0);
  text('CAUGHT ' + caught, 4, 83, COL.K);
  textR('TIME ' + Math.max(0, Math.ceil(G.time)), 108, 83, G.time < 6 ? COL.r : COL.K);
  text('< SELECT', 4, 90, COL.u);
  textC('HOLD', 90, COL.u);           // the buttons steer; they are held, not tapped
  textR('BACK >', 108, 90, COL.u);
}

function drawGame() {
  const G = session.game;
  if (G.k === 'tap') drawTap(G);
  else if (G.k === 'net') drawNet(G);
  else drawFish(G);
}

/* ======================= router ======================================= */

/** The single place a game mode maps to a screen. */
export function draw() {
  switch (S.mode) {
    case 'hatch': drawHatch(); break;
    case 'crack': drawCrack(); break;
    case 'naming': drawNaming(); break;
    case 'evolve': drawEvolve(); break;
    case 'rest': drawRest(); break;
    case 'feed': drawFeed(); break;
    case 'trail': drawTrail(); break;
    case 'bag': drawBag(); break;
    case 'shop': drawShop(); break;
    case 'book': drawBook(); break;
    case 'story': drawStory(); break;
    case 'rank': drawRank(); break;
    case 'result': session.pending ? drawResult() : drawHome(); break;
    case 'game': session.game ? drawGame() : drawHome(); break;
    default: drawHome();
  }
  present();
}
