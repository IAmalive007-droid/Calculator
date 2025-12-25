import { memo, useMemo } from "react";
import CalcButton from "./CalcButton";

export type KeyConfig = {
  label: string;
  action: "digit" | "op" | "percent" | "paren" | "equals" | "clear";
  value?: string;
  variant: "number" | "action" | "operator";
};

type Props = {
  buttons: KeyConfig[];
  activeOperator?: string | null;
  onDigit: (value: string) => void;
  onOperator: (value: string) => void;
  onPercent: () => void;
  onParen: () => void;
  onEquals: () => void;
  onClear: () => void;
  onSound?: () => void;
  onPattern?: (btn: KeyConfig) => void;
};

function KeypadComponent({
  buttons,
  activeOperator,
  onDigit,
  onOperator,
  onPercent,
  onParen,
  onEquals,
  onClear,
  onSound,
  onPattern,
}: Props) {
  const items = useMemo(
    () =>
      buttons.map((btn) => ({
        ...btn,
        onPress: () => {
          if (onSound) onSound();
          if (onPattern) onPattern(btn);
          switch (btn.action) {
            case "digit":
              onDigit(btn.value ?? "");
              break;
            case "op":
              onOperator(btn.value ?? "");
              break;
            case "percent":
              onPercent();
              break;
            case "paren":
              onParen();
              break;
            case "equals":
              onEquals();
              break;
            case "clear":
              onClear();
              break;
            default:
              break;
          }
        },
      })),
    [buttons, onDigit, onOperator, onPercent, onParen, onEquals, onClear, onPattern, onSound],
  );

  return (
    <div className="key-grid" aria-label="Calculator keypad">
      {items.map((btn) => (
        <CalcButton
          key={btn.label}
          label={btn.label}
          variant={btn.variant}
          active={btn.action === "op" && btn.value === activeOperator}
          onPress={btn.onPress}
          ariaLabel={btn.label}
          onSound={onSound}
        />
      ))}
    </div>
  );
}

export default memo(KeypadComponent);

