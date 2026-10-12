// 落ち着いたBGM（public/bgm.wav）を音源ファイルなしで合成するスクリプト。
// 実行: node scripts/make-bgm.mjs
// 明るい長調のやわらかいパッド＋オルゴール風の分散和音とメロディ＋軽いエコー。
import { writeFileSync, mkdirSync } from "node:fs";

const SAMPLE_RATE = 44100;
const SECONDS = 8;
const N = SAMPLE_RATE * SECONDS;
const left = new Float32Array(N);
const right = new Float32Array(N);

const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

// コード進行（ハ長調）: C → G → F → C（各2秒）。明るく穏やかな王道進行
const chords = [
  [60, 64, 67, 74],
  [59, 62, 67, 74],
  [60, 65, 69, 72],
  [60, 64, 67, 72],
];
const CHORD_LEN = 2;

// パッド: ゆっくり立ち上がって消える、柔らかい和音
chords.forEach((notes, c) => {
  const start = c * CHORD_LEN;
  const len = CHORD_LEN + 0.6; // 次の和音と少し重ねる
  for (const [i, m] of notes.entries()) {
    const f = freq(m);
    const pan = 0.3 + 0.4 * (i / (notes.length - 1));
    for (let s = 0; s < len * SAMPLE_RATE; s++) {
      const idx = Math.floor(start * SAMPLE_RATE) + s;
      if (idx >= N) break;
      const t = s / SAMPLE_RATE;
      const env = Math.min(1, t / 0.8) * Math.min(1, (len - t) / 0.8);
      const vibrato = 1 + 0.002 * Math.sin(2 * Math.PI * 4.5 * t);
      const ph = 2 * Math.PI * f * vibrato * t;
      const v =
        (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph)) *
        env *
        0.04;
      left[idx] += v * (1 - pan);
      right[idx] += v * pan;
    }
  }
});

// オルゴール風の音を1つ鳴らす
const bell = (midi, start, gain, pan) => {
  const f = freq(midi);
  for (let s = 0; s < 1.6 * SAMPLE_RATE; s++) {
    const idx = Math.floor(start * SAMPLE_RATE) + s;
    if (idx >= N) break;
    const t = s / SAMPLE_RATE;
    const env = Math.min(1, t / 0.005) * Math.exp(-t * 3.5);
    const ph = 2 * Math.PI * f * t;
    const v =
      (Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.1 * Math.sin(4 * ph)) *
      env *
      gain;
    left[idx] += v * (1 - pan);
    right[idx] += v * pan;
  }
};

// 分散和音（1オクターブ上、0.25秒刻みで上がって下がる）
chords.forEach((notes, c) => {
  [0, 1, 2, 3, 2, 1, 2, 3].forEach((p, k) => {
    bell(notes[p] + 12, c * CHORD_LEN + k * 0.25, 0.035, 0.35);
  });
});

// ゆったりしたメロディ（[音, 開始秒]）
const melody = [
  [79, 0], [76, 0.75], [77, 1.5],
  [79, 2], [74, 2.75], [76, 3.5],
  [77, 4], [81, 4.75], [79, 5.5],
  [76, 6], [72, 6.75],
];
for (const [m, t] of melody) bell(m + 12, t, 0.05, 0.6);

// 左右でずらしたエコーで広がりを出す
const addEcho = (buf, other, delaySec, gain) => {
  const d = Math.floor(delaySec * SAMPLE_RATE);
  for (let i = N - 1; i >= d; i--) buf[i] += other[i - d] * gain;
};
const dryL = left.slice();
const dryR = right.slice();
addEcho(left, dryR, 0.33, 0.35);
addEcho(right, dryL, 0.41, 0.35);

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
