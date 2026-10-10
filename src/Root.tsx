import { Composition } from "remotion";
import { HelloKing } from "./HelloKing";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HelloKing"
      component={HelloKing}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: "Hello, King!",
        subtitle: "Remotion で作った動画です",
        color: "#4f46e5",
      }}
    />
  );
};

