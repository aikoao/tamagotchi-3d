/**
 * audio.js — every sound in the project, synthesised on demand.
 *
 * There are no audio files. Each cue is a short oscillator with an
 * exponential gain envelope, which is both tiny and the right texture for a
 * toy of this era.
 *
 * The AudioContext is created lazily and only ever from a user gesture,
 * because browsers refuse to start one otherwise.
 */

let ctx = null;
let enabled = true;

/** Mute or unmute every cue. Called by the Sound toggle and by state restore. */
export function setSoundEnabled(on) { enabled = !!on; }

/** True once an AudioContext exists. */
export function hasContext() { return ctx !== null; }

/** Create the context if a gesture allows it. Safe to call repeatedly. */
export function ensureContext() {
  if (ctx || !enabled) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { /* no audio available; every cue becomes a no-op */ }
}

/**
 * One note.
 * @param {number} freq  pitch in Hz
 * @param {number} dur   length in seconds
 * @param {string} type  oscillator waveform
 * @param {number} vol   peak gain
 */
export function beep(freq, dur = 0.08, type = 'square', vol = 0.05) {
  if (!enabled) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch (e) { /* a failed cue must never break a frame */ }
}

/* ---- named cues ------------------------------------------------------- */

/** Moving the selection. */
export const sfxMove = () => beep(540, 0.05);
/** Confirming something. */
export const sfxOk = () => beep(780, 0.09);
/** A refusal or a miss. */
export const sfxBad = () => beep(170, 0.15, 'sawtooth', 0.045);
/** Picking something up. */
export const sfxGet = () => { beep(680, 0.07); setTimeout(() => beep(920, 0.1), 70); };
/** Growing up, hatching, putting on a new trade. */
export const sfxLevel = () => {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.13, 'square', 0.055), i * 110));
};
