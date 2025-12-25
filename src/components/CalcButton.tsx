import { memo } from "react";

type Variant = "number" | "action" | "operator";

type Props = {
  label: string;
  variant: Variant;
  onPress: () => void;
  active?: boolean;
  ariaLabel?: string;
  onSound?: () => void;
};

function CalcButtonComponent({
  label,
  variant,
  onPress,
  active = false,
  ariaLabel,
  onSound,
}: Props) {
  const handleClick = () => {
    if (onSound) onSound();
    onPress();
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`calc-btn ${variant} ${active ? "active" : ""}`}
      onClick={handleClick}
    >
      {label}
    </button>
  );
}

export default memo(CalcButtonComponent);

