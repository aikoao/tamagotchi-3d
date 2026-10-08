/**
 * config.js — every tuning value, colour and theme in the project.
 *
 * This module has no imports. Anything that would otherwise be a magic number
 * buried in a draw call lives here, so behaviour can be retuned without
 * reading the code that uses it.
 */

/* ======================= screen & timing ============================== */

/** Logical size of the Tamagotchi screen, in game pixels. */
export const SCREEN_W = 112;
export const SCREEN_H = 96;

/**
 * The screen is blown up by this factor with nearest-neighbour filtering
 * before it becomes a WebGL texture. Without it the 112x96 grid lands on
 * fractional texels and the pixel art smears.
 */
export const TEXTURE_SCALE = 4;

/** Largest delta-time one frame may report, so a backgrounded tab cannot
 *  fast-forward the simulation when it returns. */
export const MAX_FRAME_DT = 0.05;

/** The screen repaints at 40fps; game logic still runs every frame. */
export const PAINT_INTERVAL = 0.025;
/** How often the collection cards re-check what is unlocked. */
export const GALLERY_REFRESH_INTERVAL = 0.5;
/** How often state is flushed to localStorage while idling. */
export const AUTOSAVE_INTERVAL = 4;

/** Seconds spent walking home before the bedroom scene begins. */
export const WALK_HOME_DURATION = 1.9;
/** Total length of the egg-hatching cutscene, and when CONFIRM may skip it. */
export const CRACK_DURATION = 3.4;
export const CRACK_SKIPPABLE_AFTER = 1.2;

/** One in-game day, in seconds, at demo speed and at real speed. */
export const DAY_LENGTH_DEMO = 26;
export const DAY_LENGTH_REAL = 900;
/** Stat decay multiplier: demo mode runs about 28x faster than real time. */
export const DECAY_RATE_DEMO = 1;
export const DECAY_RATE_REAL = 0.035;
/** Per-second drain of each need while the child is awake. */
export const DECAY_HUNGER = 0.72;
export const DECAY_HAPPY = 0.55;
export const DECAY_ENERGY = 0.06;
/** Energy recovered per second once the child is in bed. */
export const REST_RECOVERY = 30;

/* ======================= rules ======================================== */

/** A trail station costs this much energy, and is refused below this floor. */
export const STATION_ENERGY_COST = 15;
/** Knowledge is capped so the stat bar stays meaningful. */
export const KNOW_MAX = 999;
/** How many letters the player may give their child. */
export const NAME_LENGTH = 5;
/** The alphabet the name-entry screen scrolls through. */
export const ALPHABET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Bump this when a change makes older saves unrepairable. Older keys are
 * simply abandoned rather than migrated.
 */
export const STORAGE_KEY = 'punggol-tama-v4';

/* ======================= the physical toy ============================= */

/** How far forward and back the egg is planed flat, in world units. A curved
 *  shell cannot carry a flat screen, so both faces are clamped to a plane. */
export const FLAT_FRONT_Z = 0.34;
export const FLAT_BACK_Z = 0.32;
/** Past this device pixel ratio the gain is invisible and the cost is not. */
export const MAX_PIXEL_RATIO = 1.6;

/* ======================= screen palette =============================== */

/**
 * Sprites are stored as rows of characters; each character is a key into
 * `HEX`. Drawing never wants the hex string, because the framebuffer is a
 * Uint32Array — so every colour is packed once into a little-endian
 * 0xAABBGGRR word and read from `COL` thereafter.
 */
export const HEX = {
  K: '#2b1b3d', W: '#ffffff', E: '#2b1b3d',   // outline, white, eye
  S: '#f8dcc0', s: '#e3bb9a', H: '#5a3b2a',   // skin, skin shadow, hair
  C: '#ff7a59', c: '#e0543a',                 // shirt + shadow, recoloured per stage
  B: '#c08552', b: '#8a5a38', D: '#5c3b22',   // wood light / mid / dark
  G: '#5fc46a', g: '#35924a',                 // leaf, leaf shadow
  Y: '#ffd34d', y: '#e0a81f',                 // gold, gold shadow
  R: '#f0584f', r: '#c43a36',                 // alert red, deep red
  T: '#2ec4b6', t: '#15867f',                 // teal, deep teal
  U: '#6bd8f5', u: '#1b9ad6', V: '#aeecfb',   // sky blue, deep blue, foam
  P: '#f08a8a', N: '#fff8ec', n: '#c5c9c0',   // pink, bone white, grey
  M: '#9fb3c8', L: '#a06bdc', O: '#ff9e4f',   // fish grey, knowledge purple, orange
  A: '#f7e3b4', X: '#7b5ea8'                  // sand, deep purple
};

/** Pack `#rrggbb` into the ABGR word that canvas ImageData expects. */
export function packColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255);
}

/** The draw-time palette: every `HEX` entry, plus the scenery tones. */
export const COL = {};
for (const key in HEX) COL[key] = packColor(HEX[key]);

/* Scenery tones have no sprite character because only the scene painters
   ever reference them. */
COL.sky1 = packColor('#4cc6ee');
COL.sky2 = packColor('#8fe0f7');
COL.sky3 = packColor('#c8f1fc');
COL.sea1 = packColor('#1b9ad6');
COL.sea2 = packColor('#2bb3e0');
COL.sand = packColor('#f3dca6');
COL.grass = packColor('#5fc46a');
COL.grass2 = packColor('#3f9f55');
COL.panel = packColor('#fff8ec');
COL.panel2 = packColor('#ffe9c9');
COL.head = packColor('#15867f');
COL.head2 = packColor('#0f6a66');
COL.purpD = packColor('#6d3fa0');
COL.blueD = packColor('#0f6f9c');
COL.greenD = packColor('#1f6b3c');
COL.coral = packColor('#ff7a59');
COL.coral2 = packColor('#e0543a');
COL.shadow = packColor('#00000022');

/* ======================= collectible shell themes ===================== */

/**
 * `KAMPONG` is the *live* theme. The Canvas 2D motif painters in device3d.js
 * read from it, so they never need to know which shell is selected. It is
 * mutated in place rather than reassigned, which keeps every import valid.
 */
export const KAMPONG = {
  shell: '#ADB69A', shellDeep: '#86907F', cream: '#E7DACA', creamEdge: '#BF8C62',
  wood: '#BF8C62', woodDark: '#86907F', leaf: '#86907F', leafDeep: '#6F7869',
  sun: '#BF8C62', coral: '#ECA385', foam: '#E7DACA', gold: '#BF8C62'
};

/** Copy a shell's palette into the live theme. */
export function applyTheme(palette) {
  for (const key in palette) KAMPONG[key] = palette[key];
}

/**
 * The four collectible designs. `kinds` is the vocabulary of kampong motifs
 * scattered over that shell's body; `pal` is the complete material palette.
 */
export const SHELLS = {
  original: {
    n: 'ORIGINAL', side: 'palm',
    kinds: ['house', 'palm', 'kelong', 'house', 'boat', 'palm', 'house', 'fish', 'wave', 'dot', 'weave', 'palm'],
    pal: {
      shell: '#ADB69A', shellDeep: '#86907F', cream: '#E7DACA', creamEdge: '#BF8C62',
      wood: '#BF8C62', woodDark: '#86907F', leaf: '#86907F', leafDeep: '#6F7869',
      sun: '#BF8C62', coral: '#ECA385', word: '#8E6236', foam: '#E7DACA', gold: '#BF8C62',
      bezel: '#BF8C62', bSelect: '#BF8C62', bConfirm: '#BF8C62', bBack: '#BF8C62'
    }
  },
  farmer: {
    n: 'FARMER', side: 'grass',
    kinds: ['grass', 'hay', 'grass', 'hay', 'grass', 'dot', 'hay', 'grass'],
    pal: {
      shell: '#646F0E', shellDeep: '#46500A', cream: '#FEF0B9', creamEdge: '#C0410C',
      wood: '#FCB72C', woodDark: '#C0410C', leaf: '#E4C512', leafDeep: '#FCB72C',
      sun: '#FCB72C', coral: '#C0410C', word: '#C0410C', foam: '#FEF0B9', gold: '#FCB72C',
      bezel: '#C0410C', bSelect: '#C0410C', bConfirm: '#C0410C', bBack: '#C0410C'
    }
  },
  boatman: {
    n: 'BOATMAN', side: 'oar',
    kinds: ['boat', 'oar', 'boat', 'oar', 'wave', 'boat', 'dot', 'oar'],
    pal: {
      shell: '#66A2AD', shellDeep: '#35656F', cream: '#FBE8DA', creamEdge: '#EFD5BE',
      wood: '#EFD5BE', woodDark: '#35656F', leaf: '#C0CFC8', leafDeep: '#8AB7BA',
      sun: '#EFD5BE', coral: '#35656F', word: '#35656F', foam: '#C0CFC8', gold: '#EFD5BE',
      bezel: '#35656F', bSelect: '#35656F', bConfirm: '#35656F', bBack: '#35656F'
    }
  },
  fisherman: {
    n: 'FISHERMAN', side: 'fish',
    kinds: ['fish', 'rod', 'fish', 'rod', 'wave', 'fish', 'dot', 'rod'],
    pal: {
      shell: '#6E6458', shellDeep: '#514A41', cream: '#F5EACC', creamEdge: '#D79F4A',
      wood: '#D79F4A', woodDark: '#514A41', leaf: '#E7DBCD', leafDeep: '#6C6C74',
      sun: '#D79F4A', coral: '#D79F4A', word: '#6E6458', foam: '#E7DBCD', gold: '#D79F4A',
      bezel: '#6C6C74', bSelect: '#D79F4A', bConfirm: '#D79F4A', bBack: '#D79F4A'
    }
  }
};

/** Display order of the shell picker. */
export const SHELL_ORDER = ['original', 'farmer', 'boatman', 'fisherman'];
