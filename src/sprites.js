/**
 * sprites.js — all art in the project, as data plus the code that derives
 * more art from it. No image files are loaded anywhere.
 *
 * A sprite is an array of equal-length strings. Each character is a key into
 * the palette in config.js; `.` means transparent. Storing art this way means
 * a sprite can be recoloured, mirrored or transformed with ordinary string
 * operations, which is exactly what the generators at the bottom do: six
 * outfits, a walk frame for every one of them, a sleeping head and four
 * stages of a cracking egg are all produced from rows that already exist.
 */

/* ======================= bitmap font ================================== */

/**
 * A 3x5 glyph per character, flattened to 15 '0'/'1' characters, row-major.
 * Hand-drawn rather than loaded, so the screen has no font dependency and
 * renders identically everywhere.
 */
export const FONT = {
  ' ': '000000000000000', A: '010101111101101', B: '110101110101110', C: '011100100100011',
  D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011',
  H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101',
  L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110',
  T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101',
  X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '111001011001111',
  4: '101101111001001', 5: '111100111001111', 6: '011100111101111', 7: '111001001010010',
  8: '111101111101111', 9: '111101111001110',
  '.': '000000000000010', ',': '000000000010100', '!': '010010010000010', '?': '110001010000010',
  "'": '010010000000000', ':': '000010000010000', '-': '000000111000000', '+': '000010111010000',
  '/': '001001010100100', '(': '001010010010001', ')': '100010010010100', '%': '101001010100101',
  '>': '100110111110100', '<': '001011111011001', '=': '000111000111000', '*': '000101010101000',
  x: '000101010101000', '#': '101111101111101', '&': '110101110101011'
};

/* ======================= authored sprites ============================= */

/** The sprite table. Generators below add derived entries to it. */
export const SPR = {
  kid: [
    '........................', '.........HHHHHH.........', '.......HHHHHHHHHH.......',
    '......HHHHHHHHHHHH......', '......HHSSSSSSSSHH......', '......HSSSSSSSSSSH......',
    '......SSSSSSSSSSSS......', '......SSEESSSSEESS......', '......SSEESSSSEESS......',
    '......SSSSSSSSSSSS......', '......PPSSWWWWSSPP......', '......PPSSSSSSSSPP......',
    '.......SSSSSSSSSS.......', '........SSSSSSSS........', '..........SSSS..........',
    '.......CCCCCCCCCC.......', '.....SSCCCCCCCCCCSS.....', '.....SSCCCCCCCCCCSS.....',
    '.....SSCCCCCCCCCCSS.....', '.....SSCCCCCCCCCCSS.....', '.......CCCCCCCCCC.......',
    '.......cccccccccc.......', '.......cccccccccc.......', '........SSS..SSS........',
    '........SSS..SSS........', '........SSS..SSS........', '........SSS..SSS........',
    '.......KKKK..KKKK.......', '........................', '........................'],
  youth: [
    '.........HHHHHH.........', '.......HHHHHHHHHH.......', '......HHHHHHHHHHHH......',
    '......HHSSSSSSSSHH......', '......HSSSSSSSSSSH......', '......SSSSSSSSSSSS......',
    '......SSEESSSSEESS......', '......SSEESSSSEESS......', '......SSSSSSSSSSSS......',
    '......PPSSWWWWSSPP......', '......PPSSSSSSSSPP......', '.......SSSSSSSSSS.......',
    '........SSSSSSSS........', '..........SSSS..........', '.......CCCCCCCCCC.......',
    '.....SSCCCCCCCCCCSS.....', '.....SSCCCCCCCCCCSS.....', '.....SSCCCCCCCCCCSS.....',
    '.....SSCCCCCCCCCCSS.....', '.....SSCCCCCCCCCCSS.....', '.......CCCCCCCCCC.......',
    '.......cccccccccc.......', '.......cccccccccc.......', '........SSS..SSS........',
    '........SSS..SSS........', '........SSS..SSS........', '........SSS..SSS........',
    '........SSS..SSS........', '.......KKKK..KKKK.......', '........................'],
  egg: [
    '........................', '........................', '........................',
    '........................', '........................', '........................',
    '........................', '.........KKKKKK.........', '.......KKNNNNNNKK.......',
    '......KNNNNNNNNNNK......', '.....KNNNNNNNNNNNNK.....', '....KNNNNNNNNNNNNNNK....',
    '....KNNNNNNNNNNNNNNK....', '...KNNNNNNNNNNNNNNNNK...', '...KNNTTNNNNTTNNNNTTK...',
    '...KNNNNNNNNNNNNNNNNK...', '...KNNNNNNNNNNNNNNNNK...', '..KNNNNNNNNNNNNNNNNNNK..',
    '..KNNOONNNNOONNNNOONNK..', '..KNNNNNNNNNNNNNNNNNNK..', '..KNNNNNNNNNNNNNNNNNNK..',
    '..KNNNNNNNNNNNNNNNNNNK..', '...KNNTTNNNNTTNNNNTTK...', '...KNNNNNNNNNNNNNNNNK...',
    '...KNNNNNNNNNNNNNNNNK...', '....KNNNNNNNNNNNNNNK....', '.....KNNNNNNNNNNNNK.....',
    '......KNNNNNNNNNNK......', '.......KKNNNNNNKK.......', '.........KKKKKK.........'],
  hat: [
    '......KKKKKK......', '....KKYYYYYYKK....', '...KYYYYYYYYYYK...',
    '.KKYYYYYYYYYYYYKK.', 'KYYYYYYYYYYYYYYYYK', 'KKKKKKKKKKKKKKKKKK'],

  /* ---- held tools ---- */
  rod: [
    '......KK', '.....KK.', '.....KK.', '....KK..', '....KK..', '...KK...', '...KK...', '..KK....',
    '..KK....', '.KK.....', '.KK.....', '........', '........', '........', '........', '........'],
  hoe: [
    '...bb...', '...bb...', '...bb...', '...bb...', '...bb...', '...bb...', '...bb...', '...bb...',
    '...bb...', '...bb...', 'KKKbb...', 'KKKbb...', 'KKK.....', '........', '........', '........'],
  oar: [
    '..BB..', '..BB..', '..BB..', '..BB..', '..BB..', '..BB..', '..BB..', '..BB..',
    '.KBBK.', 'KBBBBK', 'KBBBBK', 'KBBBBK', 'KBBBBK', '.KBBK.', '..KK..', '......', '......', '......'],
  can: [
    '..KKKK..', '..KNNK..', '.KKNNKK.', '.KNNNNK.', 'KNnnnnNK', 'KNnnnnNK',
    'KNnnnnNK', 'KNnnnnNK', 'KNnnnnNK', '.KNNNNK.', '..KKKK..', '........'],
  sack: [
    '..K..K..', '..KKKK..', '.KBBBBK.', 'KBbOObBK', 'KBbbbbBK', 'KBObbObK',
    'KBbbbbBK', 'KBbOObBK', 'KBbbbbBK', '.KBBBBK.', '..KKKK..', '........'],
  basket: [
    'KKKKKKKKKKKK', 'KBbbbbbbbbBK', 'KBbbbbbbbbBK', 'KBbbbbbbbbBK', '.KBbbbbbbBK.', '..KKKKKKKK..',
    '............', '............', '............'],

  /* ---- scenery ---- */
  house: [
    '..........KK..........', '.........KKKK.........', '........KKbbKK........',
    '.......KKbbbbKK.......', '......KKbbbbbbKK......', '.....KKbbbbbbbbKK.....',
    '....KKbbbbbbbbbbKK....', '...KKbbbbbbbbbbbbKK...', '..KKbbbbbbbbbbbbbbKK..',
    '.KKbbbbbbbbbbbbbbbbKK.', 'KKKKKKKKKKKKKKKKKKKKKK', '...KBBBBBBBBBBBBBBK...',
    '...KBBKKKKBBKKKKBBK...', '...KBBKYYKBBKYYKBBK...', '...KBBKYYKBBKYYKBBK...',
    '...KBBKKKKBBKKKKBBK...', '...KBBBBBBBBBBBBBBK...', '...KKKKKKKKKKKKKKKK...'],
  palm: [
    '....GG....GG....', '..GGGGGGGGGGGG..', '.GGGgggGGgggGGG.', 'GGg...GGGG...gGG',
    '......GGGG......', '.......BB.......', '.......Bb.......', '.......BB.......',
    '.......Bb.......', '.......BB.......', '.......Bb.......', '.......BB.......',
    '.......Bb.......', '......BBBb......', '.....gGGGGg.....', '....ggGGGGgg....'],

  /* ---- items, 10x10 ---- */
  fish:      ['..........', '.....KKKK.', '...KKMMMMK', 'K.KMMMMMMK', 'KKMMEMMMMK', 'KKMMMMMMMK', 'K.KMMMMMMK', '...KKMMMMK', '.....KKKK.', '..........'],
  latex:     ['..........', '.KKKKKKKK.', '.KnnnnnnK.', '.KnNNNNnK.', '.KnNNNNnK.', '.KnNNNNnK.', '..KnnnnK..', '...KKKK...', '..........', '..........'],
  rope:      ['..........', '...KKKK...', '..KBBBBK..', '.KBBKKBBK.', 'KBBK..KBBK', 'KBBK..KBBK', '.KBBKKBBK.', '..KBBBBK..', '...KKKK...', '..........'],
  herb:      ['..........', '.......GG.', '.....GGGG.', '...GGGGGg.', '..GGGGGgg.', '.GGGGGgg..', '.GGGgg....', '.Kgg......', '.K........', '..........'],
  shell:     ['..........', '....KK....', '...KPPK...', '..KPPPPK..', '.KPPPPPPK.', 'KPPPPPPPPK', 'KPKPKPKPPK', 'KKKKKKKKKK', '..........', '..........'],
  plate:     ['..........', '..........', '...KKKK...', '..KMMMMK..', '.KMMEMMMK.', 'KNNNNNNNNK', 'KNNNNNNNNK', '.KKKKKKKK.', '..........', '..........'],
  bowl:      ['..........', '...K..K...', '..........', '.KKKKKKKK.', '.KOOOOOOK.', '.KNOOOONK.', '..KNNNNK..', '...KKKK...', '..........', '..........'],
  parcel:    ['..........', '..KKKKKK..', '.KGGGGGGK.', 'KGgGGGGgGK', 'KGGGGGGGGK', 'KGgGGGGgGK', '.KGGGGGGK.', '..KKKKKK..', '..........', '..........'],
  chapteh:   ['...W.W....', '..W.W.W...', '...WWW....', '..KRRRK...', '.KRRRRRK..', '..KRRRK...', '...KKK....', '..........', '..........', '..........'],
  knet:      ['..........', '.b.b.b.b..', 'bbbbbbbbb.', '.b.b.b.b..', 'bbbbbbbbb.', '.b.b.b.b..', 'bbbbbbbbb.', '.b.b.b.b..', '..........', '..........'],
  junk:      ['..........', '..KKK.....', '..KnnK....', '..KnnK....', '..KnnK....', '..KnnKKK..', '..KnnnnnK.', '.KnnnnnnnK', '.KKKKKKKKK', '..........'],
  prawn:     ['....KKK...', '..KKPPPK..', '.KPPPPPK..', 'KPPEPPK...', 'KPPPPK....', 'KPPPPK....', '.KPPPPKK..', '..KPPPPPK.', '...KKPPPK.', '.....KKK..'],
  crab:      ['..........', '.K......K.', 'KRK....KRK', 'KRRK..KRRK', '.KRRRRRRK.', 'KRRERRERRK', 'KRRRRRRRRK', '.KRRRRRRK.', 'K.K.KK.K.K', '..........'],
  crabdish:  ['..........', '..K....K..', '.KRK..KRK.', '.KRRKKRRK.', '..KRRRRK..', '.KRRRRRRK.', 'KNNNNNNNNK', 'KNNNNNNNNK', '.KKKKKKKK.', '..........'],
  prawndish: ['..........', '..........', '.KPK.KPK..', 'KPPPKPPPK.', '.KPKKKPK..', 'KKKKKKKKKK', 'KYYYYYYYYK', '.KYYYYYYK.', '..KKKKKK..', '..........'],

  /* ---- menu icons, 11x13 ---- */
  mEat:  ['K.K.K..KKK.', 'K.K.K.KNNNK', 'KKKKK.KNNNK', '.KKK..KNNNK', '..K....KKK.', '..K.....K..', '..K.....K..', '..K.....K..', '..K.....K..', '..K.....K..', '.KKK...KKK.', '...........', '...........'],
  mGo:   ['...KKKKK...', '..KRRRRRK..', '.KRRRRRRRK.', 'KRRKKKKKRRK', 'KRRKNNNKRRK', 'KRRKNNNKRRK', 'KRRKKKKKRRK', '.KRRRRRRRK.', '..KRRRRRK..', '...KRRRK...', '....KRK....', '.....K.....', '...........'],
  mBag:  ['...KKKKK...', '..K.....K..', '..K.....K..', 'KKKKKKKKKKK', 'KBBBBBBBBBK', 'KBBBBBBBBBK', 'KKKKKKKKKKK', 'KBbbbbbbbBK', 'KBbbbKbbbBK', 'KBbbbbbbbBK', 'KBbbbbbbbBK', '.KKKKKKKKK.', '...........'],
  mShop: ['KKKKKKKKKKK', 'KRRNNRRNNRK', 'KKKKKKKKKKK', '.KBBBBBBBK.', '.KBYYYYYBK.', '.KBYKKKYBK.', '.KBYKNKYBK.', '.KBYKNKYBK.', '.KBYKKKYBK.', '.KBBBBBBBK.', '.KKKKKKKKK.', '...........', '...........'],
  mBook: ['...........', '...........', '.KKKKKKKKK.', 'KNNNNKNNNNK', 'KNUUNKNUUNK', 'KNNNNKNNNNK', 'KNUUNKNUUNK', 'KNNNNKNNNNK', 'KNUUNKNUUNK', 'KNNNNKNNNNK', '.KKKKKKKKK.', '...........', '...........'],
  mTop:  ['.KKKKKKKKK.', '.KYYYYYYYK.', 'KKYYYYYYYKK', 'KYKYYYYYKYK', 'KYKYYYYYKYK', 'KKKYYYYYKKK', '..KYYYYYK..', '...KYYYK...', '....KYK....', '...KYYYK...', '..KKYYYKK..', '..KKKKKKK..', '...........'],

  /* ---- stat icons, 9x9 ---- */
  iHunger: ['.........', 'KKKKKKKKK', 'KNNNNNNNK', '.KOOOOOK.', '.KOOOOOK.', '..KOOOK..', '...KKK...', '.........', '.........'],
  iHappy:  ['..KKKKK..', '.KYYYYYK.', 'KYKYYYKYK', 'KYKYYYKYK', 'KYYYYYYYK', 'KYKYYYKYK', '.KYKKKYK.', '..KKKKK..', '.........'],
  iEnergy: ['.....KK..', '....KYK..', '...KYK...', '..KYYYYK.', '.KYYYYK..', '...KYK...', '..KYK....', '..KK.....', '.........'],
  iKnow:   ['.........', '.KK...KK.', 'KLLK.KLLK', 'KLLKKKLLK', 'KLLKLKLLK', 'KLLKLKLLK', 'KLLKLKLLK', '.KKKKKKK.', '.........']
};

/* ======================= generated sprites ============================ */

/**
 * Six outfits built from the shared head: singlet / short sleeve / long
 * sleeve, crossed with shorts / long trousers, so that no two trades dress
 * alike without any of them being drawn by hand.
 */
function buildOutfits() {
  const head = SPR.youth.slice(0, 14);
  const SHOULDER_PLAIN = '.......CCCCCCCCCC.......';
  const SHOULDER_VEST  = '.......CCSSSSSSCC.......';
  const ARM_BARE       = '.....SSCCCCCCCCCCSS.....';
  const ARM_LONG       = '.....CCCCCCCCCCCCCC.....';
  const ARM_CUFF       = '.....CcCCCCCCCCCCcC.....';
  const WAIST          = '.......cccccccccc.......';
  const LEG_BARE       = '........SSS..SSS........';
  const LEG_PANT       = '........ccc..ccc........';
  const SHOES          = '.......KKKK..KKKK.......';
  const EMPTY          = '........................';

  ['sv', 'ss', 'ls'].forEach((sleeve) => {
    ['sh', 'lp'].forEach((leg) => {
      const rows = head.slice();
      rows.push(sleeve === 'sv' ? SHOULDER_VEST : SHOULDER_PLAIN);
      if (sleeve === 'ls') rows.push(ARM_LONG, ARM_LONG, ARM_LONG, ARM_CUFF, ARM_BARE);
      else rows.push(ARM_BARE, ARM_BARE, ARM_BARE, ARM_BARE, ARM_BARE);
      rows.push(SHOULDER_PLAIN, WAIST, WAIST);
      if (leg === 'lp') rows.push(LEG_PANT, LEG_PANT, LEG_PANT, LEG_PANT, LEG_BARE);
      else rows.push(LEG_BARE, LEG_BARE, LEG_BARE, LEG_BARE, LEG_BARE);
      rows.push(SHOES, EMPTY);
      SPR[`y_${sleeve}_${leg}`] = rows;
    });
  });
}

/**
 * A stride frame for every body sprite, plus a head with its eyes shut.
 * The stride is a pure row substitution: any row that reads as a pair of
 * legs is swapped for its wider-apart twin, so this works on outfits that
 * did not exist when the table was written.
 */
function buildWalkAndSleep() {
  const stride = {
    '........SSS..SSS........': '.......SSS....SSS.......',
    '........ccc..ccc........': '.......ccc....ccc.......',
    '.......KKKK..KKKK.......': '......KKKK....KKKK......'
  };
  Object.keys(SPR)
    .filter((k) => k === 'kid' || k === 'youth' || k.indexOf('y_') === 0)
    .forEach((k) => { SPR[`${k}_w`] = SPR[k].map((row) => stride[row] || row); });

  const head = SPR.youth.slice(0, 14);
  head[6] = '......SSSSSSSSSSSS......';   // upper lid closed; the row below reads as lashes
  SPR.headsleep = head;
}

/**
 * The hatching cutscene, derived from the one egg sprite: three stages of a
 * spreading crack, the shell torn in two along that same seam, and the
 * shards that end up at the child's feet.
 */
function buildEggCrack() {
  const base = SPR.egg;

  /** The jagged line the shell will break along, as a y per column. */
  const seam = (x) => 17 + ((x % 4) < 2 ? -1 : 1);

  /** Darken the shell along the seam between two columns. */
  function carve(from, to, extra) {
    const rows = base.slice();
    for (let x = from; x <= to; x++) {
      const y = seam(x);
      const row = rows[y].split('');
      if (row[x] && row[x] !== '.') { row[x] = 'K'; rows[y] = row.join(''); }
      // tie the jagged steps together so the crack reads as one line
      const y2 = seam(x) + ((x % 4) === 1 ? 1 : ((x % 4) === 3 ? -1 : 0));
      if (y2 !== y) {
        const other = rows[y2].split('');
        if (other[x] && other[x] !== '.') { other[x] = 'K'; rows[y2] = other.join(''); }
      }
    }
    (extra || []).forEach((seg) => {
      const row = rows[seg.y].split('');
      seg.xs.forEach((x) => { if (row[x] && row[x] !== '.') row[x] = 'K'; });
      rows[seg.y] = row.join('');
    });
    return rows;
  }

  SPR.egg1 = carve(9, 14);
  SPR.egg2 = carve(6, 17);
  SPR.egg3 = carve(3, 20, [
    { y: 13, xs: [11] }, { y: 14, xs: [11] }, { y: 15, xs: [12] },
    { y: 20, xs: [8] }, { y: 21, xs: [8] }, { y: 22, xs: [7] }
  ]);

  // split the shell into two movable halves along the same seam
  const top = [];
  const bottom = [];
  for (let r = 0; r < base.length; r++) {
    const row = base[r];
    let t = '';
    let b = '';
    for (let x = 0; x < row.length; x++) {
      const isTop = r < seam(x);
      t += isTop ? row[x] : '.';
      b += isTop ? '.' : row[x];
    }
    top.push(t);
    bottom.push(b);
  }
  SPR.eggTop = top;
  SPR.eggBot = bottom;

  SPR.shardL = ['..KKK...', '.KNNNK..', 'KNNNNNK.', 'KNNNNNNK', '.KKKKKK.'];
  SPR.shardR = ['...KKK..', '..KNNNK.', '.KNNNNNK', 'KNNNNNNK', '.KKKKKK.'];
}

// Order matters: walk frames are generated from the outfits.
buildOutfits();
buildWalkAndSleep();
buildEggCrack();
