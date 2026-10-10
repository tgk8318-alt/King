import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type HelloKingProps = {
  title: string;
  subtitle: string;
  color: string;
};

// 動画の中身は普通の React コンポーネント。
// useCurrentFrame() で今のフレーム番号を受け取り、それに応じて見た目を変える。
export const HelloKing: React.FC<HelloKingProps> = ({
  title,
  subtitle,
  color,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // タイトル: バネのように弾んで登場
  const titleScale = spring({ frame, fps, config: { damping: 12 } });

  // サブタイトル: 1秒後からフェードイン & 下からスライド
  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [30, 50], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 最後の0.5秒で全体をフェードアウト
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // 背景のグラデーション角度をゆっくり回す
  const angle = interpolate(frame, [0, durationInFrames], [0, 90]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${color}, #0f172a)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
        color: "white",
        opacity: fadeOut,
      }}
    >
      <h1 style={{ fontSize: 160, margin: 0, transform: `scale(${titleScale})` }}>
        {title}
      </h1>
      <p
        style={{
          fontSize: 60,
          marginTop: 40,
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        {subtitle}
      </p>
    </AbsoluteFill>
  );
};
