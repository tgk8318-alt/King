# King

[Remotion](https://www.remotion.dev/) で動画をプログラムから自動生成するサンプルです。
動画の中身は React コンポーネントで書き、フレーム番号に応じてアニメーションさせます。

## 必要なもの

- [Node.js](https://nodejs.org) 22 以上（`.nvmrc` 参照）

## 使い方

```bash
npm install

# ブラウザでプレビュー・編集（http://localhost:3000）
npm run studio

# MP4 に書き出し → out/hello-king.mp4
npm run render

# 静止画（サムネイル）を書き出し → out/thumbnail.png
npm run still
```

初回の書き出し時に、Remotion が描画用の Chrome Headless Shell を自動でダウンロードします。

## 中身を変えてみる

- `src/HelloKing.tsx` … 動画本体。文字・色・アニメーションはここ
- `src/Root.tsx` … 動画の長さ（`durationInFrames`）、fps、解像度、デフォルトの文字

コードを触らずに文字だけ差し替えて書き出すこともできます:

```bash
npx remotion render HelloKing out/custom.mp4 \
  --props='{"title":"こんにちは","subtitle":"自動生成テスト","color":"#e11d48"}'
```

JSON やスプレッドシートのデータからこの `--props` を作れば、大量の動画を自動生成できます。

## ライセンスについて

Remotion は個人や小規模チーム（社員 3 人以下）なら無料ですが、それより大きな会社での利用には
有料の Company License が必要です。詳しくは https://www.remotion.dev/license を参照してください。
