/**
 * data.js — the game's content. No logic, no imports.
 *
 * Everything here is declarative: adding a story, a recipe or a trade means
 * adding an entry, not touching any of the code that consumes it.
 */

/* ======================= items & crafting ============================= */

/**
 * An item's shape decides what the UI offers for it:
 *   `food` -> listed in EAT, CONFIRM feeds it
 *   `toy`  -> stays in the BAG, CONFIRM plays with it
 *   `tool` -> a permanent upgrade
 *   none   -> a raw material, only useful in a recipe
 */
export const ITEMS = {
  FISH:    { n: 'FISH',         s: 'fish' },
  PRAWN:   { n: 'PRAWN',        s: 'prawn' },
  CRAB:    { n: 'CRAB',         s: 'crab' },
  LATEX:   { n: 'LATEX',        s: 'latex' },
  ROPE:    { n: 'ROPE',         s: 'rope' },
  HERB:    { n: 'HERB',         s: 'herb' },
  SHELL:   { n: 'SHELL',        s: 'shell' },
  OTAK:    { n: 'OTAK-OTAK',    s: 'parcel',    food: { hunger: 30, happy: 12 } },
  CHILLI:  { n: 'CHILLI CRAB',  s: 'crabdish',  food: { hunger: 38, know: 4 } },
  CEREAL:  { n: 'CEREAL PRAWN', s: 'prawndish', food: { hunger: 30, energy: 14 } },
  CHAPTEH: { n: 'CHAPTEH',      s: 'chapteh',   toy:  { happy: 32 } },
  KNET:    { n: 'KELONG NET',   s: 'knet',      tool: 'fish' }
};

/** Mama shop recipes, in the order they are shown. */
export const RECIPES = [
  { out: 'OTAK',    need: { FISH: 2, HERB: 1 } },
  { out: 'CHILLI',  need: { CRAB: 1, HERB: 1 } },
  { out: 'CEREAL',  need: { PRAWN: 2, HERB: 1 } },
  { out: 'CHAPTEH', need: { LATEX: 2, SHELL: 1 } },
  { out: 'KNET',    need: { ROPE: 2, LATEX: 1 } }
];

/* ======================= heritage trail =============================== */

/**
 * In the physical concept each station carries its own QR code. Here they are
 * reachable from GO OUT, from the number keys, and from a deep link such as
 * `index.html#point`.
 */
export const STATIONS = [
  { id: 'rubber', n: 'RUBBER TRAIL',  game: 'tap',  story: 'RUBBER',  trade: 'tapper' },
  { id: 'kelong', n: 'KELONG NET',    game: 'net',  story: 'MUSSEL',  trade: 'boatman' },
  { id: 'point',  n: 'PUNGGOL POINT', game: 'fish', story: 'SEAFOOD', trade: 'fisher' }
];

/** @returns {object|null} the station with this id. */
export function stationById(id) {
  return STATIONS.find((s) => s.id === id) || null;
}

/* ======================= stories ====================================== */

/**
 * Researched Punggol history, unlocked as the child explores.
 * Sources: Roots.gov.sg, BiblioAsia, NLB Infopedia, RememberSingapore,
 * Wikipedia. Upper case because the 3x5 bitmap font has no lower case.
 */
export const STORIES = [
  { id: 'NAME', t: 'THE NAME', x: 'PUNGGOL IS MALAY FOR HURLING STICKS AT FRUIT TREES TO BRING THE FRUIT DOWN. ANOTHER ACCOUNT TRACES IT TO PUNGGUR, A FALLEN TREE TRUNK SEEN DRIFTING IN THE RIVER.' },
  { id: 'SUMANG', t: 'WAK SUMANG', x: 'A WARRIOR AND VIOLIN PLAYER FROM THE RIAU ISLANDS LANDED ON PUNGGOL BEACH AROUND THE 1850S AND STARTED A FISHING VILLAGE AT THE POINT. SUMANG WALK AND SUMANG LRT STILL CARRY HIS NAME.' },
  { id: 'ROAD', t: 'PUNGGOL ROAD', x: 'FOR DECADES THIS 4.5 KM ROAD WAS THE ONLY WAY INTO THE NORTH-EAST. GRANITE AND LATERITE, FULL OF POTHOLES, AND IMPASSABLE IN HEAVY RAIN. PIPED WATER AND ELECTRICITY ONLY REACHED IT IN THE 1960S.' },
  { id: 'TRACKS', t: 'THE 26 TRACKS', x: 'FROM THE LATE 1960S, 26 DIRT TRACKS BRANCHED OFF PUNGGOL ROAD. ODD NUMBERS RAN LEFT, EVEN NUMBERS RIGHT, AND EACH ONE LED TO FARMS AND KAMPONGS. ONLY TRACK 19 SURVIVES TODAY.' },
  { id: 'RUBBER', t: 'RUBBER DAYS', x: 'RUBBER ESTATES COVERED THE LAND AROUND THE 10TH MILESTONE. TAPPING BEGAN BEFORE SUNRISE, WHEN THE LATEX RAN BEST: A CUT, A CUP, THEN ON TO THE NEXT TREE.' },
  { id: 'MUSSEL', t: 'MUSSEL MONEY', x: 'AFTER THE WAR, FAMILIES SHELLED KUPANG BY HAND. SIX TO EIGHT PEOPLE TOOK THREE HOURS TO CLEAR ONE SAMPAN LOAD, BUT IT PAID DOUBLE WHAT FISHING DID.' },
  { id: 'SEAFOOD', t: 'PUNGGOL POINT', x: 'THROUGH THE 1980S AND 90S FAMILIES RODE BUS 82 OR 83 DOWN TO THE POINT FOR CHILLI CRAB, CEREAL PRAWNS AND STEAMED GROUPER, WHILE THE CHILDREN RAN UP AND DOWN THE JETTY.' },
  { id: 'PORT', t: 'FISHING PORT', x: 'PUNGGOL FISHING PORT OPENED IN MARCH 1984 AND BECAME THE MAIN FISH MARKET FOR THE EAST OF SINGAPORE. IT CLOSED IN 1997.' },
  { id: 'FARMS', t: 'THE BIG FARMS', x: 'PUNGGOL HELD PART OF SINGAPORE\'S 25,000 FARMING FAMILIES. IN 1971 YAK SENG FARM ALONE KEPT 50,000 CHICKENS, 8,000 PIGS AND 1,000 CROCODILES.' },
  { id: 'PIGS', t: 'PIG TOWN', x: 'IN 1974 THE GOVERNMENT SET ASIDE 620 ACRES OF PUNGGOL FOR PIG FARMING. AT ITS PEAK ABOUT 375,000 PIGS LIVED HERE. THE LAST 22 FARMS CLOSED IN NOVEMBER 1989.' },
  { id: 'ZOO', t: 'PUNGGOL ZOO', x: 'IN 1928 A TRADER NAMED BASAPA OPENED A PRIVATE ZOO AT 10 MILE PUNGGOL ROAD, WITH TIGERS, LIONS AND CASSOWARIES. THE WAR DESTROYED IT IN 1942.' },
  { id: 'MATILDA', t: 'MATILDA HOUSE', x: 'THE CASHIN FAMILY BUILT MATILDA HOUSE IN 1902 AND LIVED IN IT FOR FOUR GENERATIONS. IT WAS CONSERVED IN 2000 AND NOW STANDS AMONG THE HDB BLOCKS.' },
  { id: 'LAST', t: 'LAST KAMPONG', x: 'RECLAMATION WAS ANNOUNCED IN 1983 AND KAMPONG WAK SUMANG CAME DOWN IN 1985. ITS HEADMAN AWANG OSMAN, WHO HELD THE POST FROM 1932, KEPT COMING BACK TO VISIT THE SITE.' },
  { id: 'NEWTOWN', t: 'THE NEW TOWN', x: 'PUNGGOL 21 WAS ANNOUNCED IN AUGUST 1996. THE 4.2 KM PUNGGOL WATERWAY WAS FINISHED ON 26 OCTOBER 2011, CUT THROUGH GROUND THAT HAD BEEN FARMS AND KAMPONGS.' }
];

/** id -> story, so a lookup never has to scan the array. */
export const STORYMAP = {};
STORIES.forEach((s) => { STORYMAP[s.id] = s; });

/* ======================= growth & trades ============================== */

/**
 * `shirt` / `sh` are sprite-palette keys. The shared body sprite is
 * recoloured per stage and per trade rather than redrawn, which is how one
 * set of rows dresses every character in the game.
 */
export const STAGES = [
  { n: 'KAMPONG CHILD',    spr: 'kid',   need: 0,  shirt: 'T', sh: 't' },
  { n: 'CURIOUS LEARNER',  spr: 'kid',   need: 15, shirt: 'C', sh: 'c' },
  { n: 'HELPFUL YOUTH',    spr: 'youth', need: 40, shirt: 'Y', sh: 'y' },
  { n: 'SKILLED RESIDENT', spr: 'youth', need: 75, shirt: 'R', sh: 'r' }
];

/** The stage at which a trade is chosen and the outfit changes. */
export const FINAL_STAGE = STAGES.length - 1;

/**
 * The six collectible trades.
 *   hat   - whether the straw hat is drawn
 *   tool  - sprite name of the held tool, placed at tx/ty
 *   spr   - which generated outfit it wears, so no two trades dress alike
 */
export const TRADES = {
  fisher:   { n: 'FISHERMAN',     hat: 1, tool: 'rod',   tx: 17, ty: 14, shirt: 'u', sh: 'K', spr: 'y_sv_sh' },
  boatman:  { n: 'BOATMAN',       hat: 1, tool: 'oar',   tx: 18, ty: 10, shirt: 't', sh: 'K', spr: 'y_ss_lp' },
  tapper:   { n: 'RUBBER TAPPER', hat: 1, tool: 'latex', tx: 16, ty: 18, shirt: 'B', sh: 'b', spr: 'y_ls_lp' },
  farmer:   { n: 'FARMER',        hat: 1, tool: 'hoe',   tx: 17, ty: 15, shirt: 'g', sh: 'K', spr: 'y_ls_sh' },
  milkman:  { n: 'MILKMAN',       hat: 0, tool: 'can',   tx: 17, ty: 16, shirt: 'N', sh: 'n', spr: 'y_ss_sh' },
  spiceman: { n: 'SPICE TRADER',  hat: 0, tool: 'sack',  tx: 16, ty: 16, shirt: 'O', sh: 'r', spr: 'y_sv_lp' }
};

/** Display order of the character collection. */
export const TRADE_ORDER = ['fisher', 'boatman', 'tapper', 'farmer', 'milkman', 'spiceman'];

/* ======================= menus ======================================== */

/** The home screen's icon bar. `mode` is the screen each icon opens. */
export const MENU = [
  { icon: 'mEat',  mode: 'feed',  label: 'EAT' },
  { icon: 'mGo',   mode: 'trail', label: 'GO OUT' },
  { icon: 'mBag',  mode: 'bag',   label: 'BAG' },
  { icon: 'mShop', mode: 'shop',  label: 'MAMA SHOP' },
  { icon: 'mBook', mode: 'book',  label: 'STORIES' },
  { icon: 'mTop',  mode: 'rank',  label: 'TOP' }
];

/** Fictional rivals on the leaderboard; the player is inserted and re-sorted. */
export const BOARD = [
  { n: 'RIVERKID92', s: 1200 },
  { n: 'PUNGGOLFAN', s: 980 },
  { n: 'KAMPONGGAL', s: 760 },
  { n: 'HERITAGEBRO', s: 540 }
];
