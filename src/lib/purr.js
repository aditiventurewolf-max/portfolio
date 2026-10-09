// Cat sounds synthesised with the Web Audio API, so there are no audio files to load.
// A purr is low-passed noise pulsed by a ~20–30 Hz tremolo; mews and trills are swept tones.

let ctx = null;
const audio = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function noiseBuffer(c, seconds) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    // brown-ish noise: smoother and rumblier than white noise
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

function purr({ rate, cutoff, dur, volume = 0.6, wobble = 0 }) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur + 0.1);

  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = cutoff;
  lp.Q.value = 0.8;

  // tremolo: amplitude pulses at the purr rate
  const amp = c.createGain();
  amp.gain.value = 0.5;
  const lfo = c.createOscillator();
  lfo.frequency.setValueAtTime(rate, t);
  if (wobble) lfo.frequency.linearRampToValueAtTime(rate + wobble, t + dur);
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = 0.5;
  lfo.connect(lfoDepth).connect(amp.gain);

  // envelope, with the inhale/exhale swell real purrs have
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(volume, t + 0.12);
  env.gain.linearRampToValueAtTime(volume * 0.55, t + dur * 0.5);
  env.gain.linearRampToValueAtTime(volume, t + dur * 0.75);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(lp).connect(amp).connect(env).connect(c.destination);
  src.start(t);
  lfo.start(t);
  src.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}

function tone({ freqs, dur, volume = 0.18, type = 'triangle', vibrato = 0, delay = 0 }) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;

  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freqs[0], t);
  freqs.slice(1).forEach((f, i) => {
    osc.frequency.exponentialRampToValueAtTime(f, t + (dur * (i + 1)) / (freqs.length - 1));
  });

  if (vibrato) {
    const v = c.createOscillator();
    const vd = c.createGain();
    v.frequency.value = 28;
    vd.gain.value = vibrato;
    v.connect(vd).connect(osc.frequency);
    v.start(t);
    v.stop(t + dur + 0.05);
  }

  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freqs[0] * 1.6;
  bp.Q.value = 0.7;

  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(volume, t + 0.03);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(bp).connect(env).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Each cat gets its own repertoire. Values are tuned by ear: big cat = slower, lower, longer.
export const SOUNDS = {
  mrB: [
    () => purr({ rate: 22, cutoff: 260, dur: 1.6 }),                        // deep purr
    () => purr({ rate: 19, cutoff: 190, dur: 2.2, volume: 0.7, wobble: 3 }), // slow rumble
    () => { tone({ freqs: [320, 470, 380], dur: 0.32, vibrato: 18 }); purr({ rate: 23, cutoff: 240, dur: 1.1, volume: 0.45 }); }, // mrrp + purr
    () => tone({ freqs: [260, 420, 300], dur: 0.45, volume: 0.2, type: 'sawtooth' }), // grumpy mrow
  ],
  missP: [
    () => purr({ rate: 30, cutoff: 520, dur: 1.0, volume: 0.45 }),           // tiny fast purr
    () => tone({ freqs: [720, 1150, 820], dur: 0.35 }),                       // tiny mew
    () => { tone({ freqs: [900, 1400], dur: 0.12 }); tone({ freqs: [950, 1500], dur: 0.12, delay: 0.16 }); }, // double chirp
    () => { tone({ freqs: [680, 1000, 760], dur: 0.3 }); purr({ rate: 31, cutoff: 480, dur: 0.9, volume: 0.4 }); }, // mew + purr
  ],
};

let lastPick = {};
export function playFor(id) {
  const list = SOUNDS[id];
  if (!list) return;
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === lastPick[id]) i = (i + 1) % list.length;
  lastPick[id] = i;
  try { list[i](); } catch { /* audio is a nice-to-have */ }
}
