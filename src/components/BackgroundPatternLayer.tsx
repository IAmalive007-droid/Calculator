import { memo } from "react";

export type PatternKind = "number" | "operator" | "action";

export type PatternShape = {
  id: string;
  kind: PatternKind;
  top: string;
  left: string;
  size: number;
  rotate: number;
  opacity: number;
  variant?: string;
  animated?: boolean;
  pulse?: boolean;
  ring?: boolean;
};

type Props = {
  shapes: PatternShape[];
};

function BackgroundPatternLayer({ shapes }: Props) {
  return (
    <div className="pattern-layer pointer-events-none fixed inset-0 overflow-hidden">
      {shapes.map((shape) => {
        const baseStyle: React.CSSProperties = {
          top: shape.top,
          left: shape.left,
          width: shape.size,
          height: shape.size,
          opacity: shape.opacity,
          transform: `translate(-50%, -50%) rotate(${shape.rotate}deg)`,
        };

        const color =
          shape.kind === "number"
            ? "rgba(153, 132, 255, 0.14)" // lavender
            : shape.kind === "operator"
              ? "rgba(255, 184, 156, 0.14)" // peach
              : "rgba(140, 240, 234, 0.14)"; // aqua

        const classes = [
          "pattern-shape",
          shape.pulse ? "pattern-pulse" : "pattern-pop",
          shape.variant === "line" ? "pattern-line" : "",
          shape.variant === "dot" ? "pattern-dot" : "",
          shape.variant === "bar" ? "pattern-bar" : "",
          shape.variant === "xline" ? "pattern-xline" : "",
          shape.variant === "blob" ? "pattern-blob" : "",
          shape.ring ? "pattern-ring" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <span
            key={shape.id}
            className={classes}
            style={{
              ...baseStyle,
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
}

export default memo(BackgroundPatternLayer);

