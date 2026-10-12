import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";

const SPARKLE_COUNT = 60;
const COLOR = "#FFD400";

// 4本の光の筋をもつ星形
const Star: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ overflow: "visible" }}>
    <path
      d="M0,-50 C6,-6 6,-6 50,0 C6,6 6,6 0,50 C-6,6 -6,6 -50,0 C-6,-6 -6,-6 0,-50 Z"
      fill={COLOR}
    />
    <circle r={8} fill="white" />
  </svg>
);

// 画面全体に黄色い星が次々にまたたくエフェクト。
// 親の <Sequence>（from）の開始フレームを 0 として動く。
export const Sparkles: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* 出だしに画面全体がふわっと黄色く光る */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 60%, ${COLOR}55, transparent 70%)`,
          opacity: interpolate(frame, [0, 6, 30], [0, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      {new Array(SPARKLE_COUNT).fill(true).map((_, i) => {
        const x = random(`x-${i}`) * 100;
        const y = random(`y-${i}`) * 100;
        const size = 20 + random(`s-${i}`) * 50;
        const delay = random(`d-${i}`) * 40;
        const life = 18 + random(`l-${i}`) * 14;
        // 同じ場所で2回またたく
        const local = (frame - delay) % (life + 20);
        const t = frame < delay ? -1 : local;
        const scale = interpolate(t, [0, life / 2, life], [0, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const rotate = interpolate(t, [0, life], [0, 90]);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
              filter: `drop-shadow(0 0 8px ${COLOR}) drop-shadow(0 0 2px #E0A800)`,
            }}
          >
            <Star size={size} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
