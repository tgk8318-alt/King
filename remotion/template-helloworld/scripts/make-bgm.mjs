// 高級感のある落ち着いたBGM（public/bgm.wav）を音源ファイルなしで合成するスクリプト。
// 実行: node scripts/make-bgm.mjs
// ゆったりしたテンポで、ピアノ風の音＋弦楽器風のパッド＋低音、ホールの残響つき。
import { writeFileSync, mkdirSync } from "node:fs";

const SAMPLE_RATE = 44100;
const SECONDS = 10;
const N = SAMPLE_RATE * SECONDS;
const left = new Float32Array(N);
const right = new Float32Array(N);

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

const add = (idx, v, pan) => {
  if (idx < 0 || idx >= N) return;
  left[idx] += v * (1 - pan);
  right[idx] += v * pan;
};

// 変ホ長調の、テンションを含んだ深みのある和音（各2.5秒）
// Ebmaj9 → Cm9 → Abmaj9 → Bb(add9)
const CHORD_LEN = 2.5;
const chords = [
  { bass: 39, strings: [55, 58, 62, 65], piano: [51, 58, 62, 67], melody: [[70, 0.6], [74, 1.4], [72, 2.0]] },
  { bass: 36, strings: [55, 58, 62, 63], piano: [48, 55, 58, 63], melody: [[70, 0.6], [67, 1.4]] },
  { bass: 44, strings: [60, 63, 67, 70], piano: [44, 51, 55, 60], melody: [[72, 0.6], [75, 1.4], [74, 2.0]] },
  { bass: 46, strings: [53, 58, 60, 62], piano: [46, 53, 58, 62], melody: [[74, 0.6], [70, 1.4]] },
];

// 弦楽器風: 倍音を多めに重ね、3本わずかにずらして合奏の厚みを出す
const strings = (midi, start, len, gain, pan) => {
  const f = freq(midi);
  const detunes = [-0.003, 0, 0.0035];
  for (let s = 0; s < len * SAMPLE_RATE; s++) {
    const t = s / SAMPLE_RATE;
    const env = Math.min(1, t / 1.2) * Math.min(1, (len - t) / 1.0);
    const vib = 1 + 0.0025 * Math.sin(2 * Math.PI * 5 * t + midi);
    let v = 0;
    for (const d of detunes) {
      const ph = 2 * Math.PI * f * (1 + d) * vib * t;
      for (let h = 1; h <= 6; h++) v += Math.sin(h * ph) / (h * h);
    }
    add(Math.floor(start * SAMPLE_RATE) + s, v * env * gain, pan);
  }
};

// ピアノ風: 高い倍音ほど早く減衰し、打鍵の瞬間だけ少し明るい
const piano = (midi, start, gain, pan, len = 3.5) => {
  const f = freq(midi);
  const partials = [
    [1, 1, 1.2],
    [2, 0.45, 1.8],
    [3, 0.22, 2.6],
    [4, 0.12, 3.4],
    [5, 0.06, 4.5],
  ];
  for (let s = 0; s < len * SAMPLE_RATE; s++) {
    const t = s / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.004);
    const release = Math.min(1, (len - t) / 0.3);
    let v = 0;
    for (const [h, amp, decay] of partials) {
      // ほんの少しずつ高くずれる倍音で、本物の弦らしい響きに
      const fh = f * h * (1 + 0.0004 * h * h);
      v += amp * Math.exp(-t * decay) * Math.sin(2 * Math.PI * fh * t);
    }
    add(Math.floor(start * SAMPLE_RATE) + s, v * attack * release * gain, pan);
  }
};

chords.forEach((c, i) => {
  const start = i * CHORD_LEN;
  // 低音（チェロ風）
  strings(c.bass, start, CHORD_LEN + 0.8, 0.05, 0.5);
  // 弦のパッド
  c.strings.forEach((m, k) => strings(m, start, CHORD_LEN + 0.8, 0.018, 0.25 + 0.17 * k));
  // ピアノ: 和音を下からゆっくりほぐすように弾く
  c.piano.forEach((m, k) => piano(m, start + k * 0.12, 0.05, 0.35 + 0.1 * k));
  // ピアノの静かなメロディ
  c.melody.forEach(([m, t]) => piano(m, start + t, 0.07, 0.6));
});

// ホールの残響（シンプルなシュレーダー型リバーブ）
const reverb = (input) => {
  const out = new Float32Array(N);
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ d, buf: new Float32Array(d), i: 0 }));
  for (let n = 0; n < N; n++) {
    let sum = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.buf[c.i] = input[n] + y * 0.84;
      c.i = (c.i + 1) % c.d;
      sum += y;
    }
    out[n] = sum / combs.length;
  }
  for (const d of [225, 556]) {
    const buf = new Float32Array(d);
    let i = 0;
    for (let n = 0; n < N; n++) {
      const b = buf[i];
      const y = -out[n] + b;
      buf[i] = out[n] + b * 0.5;
      i = (i + 1) % d;
      out[n] = y;
    }
  }
  return out;
};
const wetL = reverb(left);
const wetR = reverb(right.map((v, i) => (i > 300 ? right[i - 300] : 0)));
for (let i = 0; i < N; i++) {
  left[i] = left[i] * 0.75 + wetL[i] * 0.45;
  right[i] = right[i] * 0.75 + wetR[i] * 0.45;
}

// 16bit ステレオ WAV に書き出し
const data = Buffer.alloc(N * 4);
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const norm = peak > 0 ? 0.7 / peak : 1;
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(left[i] * norm * 32767), i * 4);
  data.writeInt16LE(Math.round(right[i] * norm * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/bgm.wav", import.meta.url), Buffer.concat([header, data]));
console.log("wrote public/bgm.wav");
