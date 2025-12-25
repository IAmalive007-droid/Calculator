import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Display from "../components/Display";
import Keypad, { KeyConfig } from "../components/Keypad";
import BackgroundPatternLayer, {
  PatternShape,
} from "../components/BackgroundPatternLayer";
import {
  appendDigit,
  appendOperator,
  applyPercent,
  applyParenthesis,
  backspace,
  evaluateExpression,
  initialState,
  isErrorState,
  resetState,
} from "../utils/logic";

const buttons: KeyConfig[] = [
  { label: "C", action: "clear", variant: "action" },
  { label: "()", action: "paren", variant: "action" },
  { label: "%", action: "percent", variant: "action" },
  { label: "÷", action: "op", value: "/", variant: "operator" },
  { label: "7", action: "digit", value: "7", variant: "number" },
  { label: "8", action: "digit", value: "8", variant: "number" },
  { label: "9", action: "digit", value: "9", variant: "number" },
  { label: "x", action: "op", value: "*", variant: "operator" },
  { label: "4", action: "digit", value: "4", variant: "number" },
  { label: "5", action: "digit", value: "5", variant: "number" },
  { label: "6", action: "digit", value: "6", variant: "number" },
  { label: "-", action: "op", value: "-", variant: "operator" },
  { label: "1", action: "digit", value: "1", variant: "number" },
  { label: "2", action: "digit", value: "2", variant: "number" },
  { label: "3", action: "digit", value: "3", variant: "number" },
  { label: "+", action: "op", value: "+", variant: "operator" },
  { label: ".", action: "digit", value: ".", variant: "number" },
  { label: "0", action: "digit", value: "0", variant: "number" },
  { label: "00", action: "digit", value: "00", variant: "number" },
  { label: "=", action: "equals", variant: "operator" },
];

export default function Calculator() {
  const [state, setState] = useState(initialState);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [shapes, setShapes] = useState<PatternShape[]>([]);

  const playClick = useCallback(async () => {
    try {
      if (typeof window === "undefined") return;
      let ctx = audioCtxRef.current;
      if (!ctx) {
        ctx = new AudioContext();
        audioCtxRef.current = ctx;
      }
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Slight pitch variance for a pleasant, less robotic feel.
      const baseFreq = 320;
      const jitter = (Math.random() - 0.5) * 24; // ±12 Hz
      osc.type = "triangle";
      osc.frequency.value = baseFreq + jitter;

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {
      // ignore audio errors to avoid breaking UX
    }
  }, []);

  const onClear = useCallback(() => setState(resetState()), []);

  const onDigit = useCallback((value: string) => {
    setState((s) => appendDigit(s, value));
  }, []);

  const onOperator = useCallback((value: string) => {
    setState((s) => appendOperator(s, value));
  }, []);

  const onPercent = useCallback(() => {
    setState((s) => applyPercent(s));
  }, []);

  const onParen = useCallback(() => {
    setState((s) => applyParenthesis(s));
  }, []);

  const onEquals = useCallback(() => {
    setState((s) => evaluateExpression(s));
  }, []);

  const onBackspace = useCallback(() => {
    setState((s) => backspace(s));
  }, []);

  const randomPos = () => {
    let x = 8 + Math.random() * 84;
    let y = 10 + Math.random() * 80;
    if (x > 38 && x < 62 && y > 28 && y < 78) {
      x = x < 50 ? x - 16 : x + 16;
      y = y < 50 ? y - 12 : y + 12;
    }
    return { x, y };
  };

  const scheduleCleanup = (ids: string[], delay = 950) => {
    window.setTimeout(() => {
      setShapes((prev) => prev.filter((s) => !ids.includes(s.id)));
    }, delay);
  };

  const addShapes = (newShapes: PatternShape[]) => {
    setShapes((prev) => [...prev, ...newShapes]);
    scheduleCleanup(newShapes.map((s) => s.id));
  };

  const handlePattern = useCallback(
    (btn: KeyConfig) => {
      if (btn.action === "clear") {
        setShapes([]);
        return;
      }

      const baseKind =
        btn.variant === "number"
          ? "number"
          : btn.variant === "operator"
            ? "operator"
            : "action";

      const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      if (btn.action === "equals") {
        const { x, y } = randomPos();
        addShapes([
          {
            id: makeId(),
            kind: baseKind,
            top: `${y}%`,
            left: `${x}%`,
            size: 160,
            rotate: 0,
            opacity: 0.12,
            pulse: true,
            ring: true,
          },
        ]);
        return;
      }

      if (btn.action === "percent") {
        const dots = Array.from({ length: 10 }, () => {
          const { x, y } = randomPos();
          return {
            id: makeId(),
            kind: baseKind,
            top: `${y}%`,
            left: `${x}%`,
            size: 10 + Math.random() * 10,
            rotate: 0,
            opacity: 0.12,
            variant: Math.random() > 0.4 ? "dot" : "blob",
          } satisfies PatternShape;
        });
        addShapes(dots);
        return;
      }

      if (btn.action === "paren") {
        const left = randomPos();
        const right = randomPos();
        addShapes([
          {
            id: makeId(),
            kind: baseKind,
            top: `${left.y}%`,
            left: `${left.x}%`,
            size: 30,
            rotate: -18,
            opacity: 0.12,
            variant: "line",
          },
          {
            id: makeId(),
            kind: baseKind,
            top: `${right.y}%`,
            left: `${right.x}%`,
            size: 30,
            rotate: 18,
            opacity: 0.12,
            variant: "line",
          },
        ]);
        return;
      }

      if (btn.action === "digit") {
        const n = Number(btn.value);
        const count = Number.isFinite(n) ? Math.min(Math.max(n, 1), 12) : 1;
        const dots = Array.from({ length: count }, () => {
          const { x, y } = randomPos();
          return {
            id: makeId(),
            kind: baseKind,
            top: `${y}%`,
            left: `${x}%`,
            size: 12 + Math.random() * 16,
            rotate: Math.random() * 360,
            opacity: 0.12,
            variant: Math.random() > 0.3 ? "dot" : "blob",
          } satisfies PatternShape;
        });
        addShapes(dots);
        return;
      }

      if (btn.action === "op") {
        const op = btn.value;
        if (op === "+") {
          const lines = Array.from({ length: 3 }, () => {
            const { x, y } = randomPos();
            return {
              id: makeId(),
              kind: baseKind,
              top: `${y}%`,
              left: `${x}%`,
              size: 36,
              rotate: 0,
              opacity: 0.12,
              variant: "xline",
            } satisfies PatternShape;
          });
          addShapes(lines);
          return;
        }
        if (op === "-") {
          const bars = Array.from({ length: 3 }, () => {
            const { x, y } = randomPos();
            return {
              id: makeId(),
              kind: baseKind,
              top: `${y}%`,
              left: `${x}%`,
              size: 12,
              rotate: Math.random() * 12 - 6,
              opacity: 0.12,
              variant: "bar",
            } satisfies PatternShape;
          });
          addShapes(bars);
          return;
        }
        if (op === "*") {
          const xs = Array.from({ length: 4 }, () => {
            const { x, y } = randomPos();
            return {
              id: makeId(),
              kind: baseKind,
              top: `${y}%`,
              left: `${x}%`,
              size: 28,
              rotate: 45,
              opacity: 0.12,
              variant: "xline",
            } satisfies PatternShape;
          });
          addShapes(xs);
          return;
        }
        if (op === "/") {
          const slash = Array.from({ length: 3 }, () => {
            const { x, y } = randomPos();
            return {
              id: makeId(),
              kind: baseKind,
              top: `${y}%`,
              left: `${x}%`,
              size: 40,
              rotate: 24,
              opacity: 0.12,
              variant: "line",
            } satisfies PatternShape;
          });
          addShapes(slash);
          return;
        }
      }

      if (btn.label === "00") {
        const count = 10;
        const dots = Array.from({ length: count }, () => {
          const { x, y } = randomPos();
          return {
            id: makeId(),
            kind: baseKind,
            top: `${y}%`,
            left: `${x}%`,
            size: 14 + Math.random() * 14,
            rotate: Math.random() * 360,
            opacity: 0.12,
            variant: Math.random() > 0.4 ? "dot" : "blob",
          } satisfies PatternShape;
        });
        addShapes(dots);
      }
    },
    [],
  );

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;
      if (key === " ") return;
      if (key === "Enter" || key === "=") {
        event.preventDefault();
        playClick();
        handlePattern({ label: "=", action: "equals", variant: "action" });
        onEquals();
        return;
      }
      if (key === "Escape") {
        event.preventDefault();
        playClick();
        handlePattern({ label: "C", action: "clear", variant: "action" });
        onClear();
        return;
      }
      if (key === "Backspace") {
        event.preventDefault();
        playClick();
        onBackspace();
        return;
      }
      if (key >= "0" && key <= "9") {
        playClick();
        handlePattern({ label: key, action: "digit", value: key, variant: "number" });
        onDigit(key);
        return;
      }
      if (key === ".") {
        playClick();
        handlePattern({ label: ".", action: "digit", value: ".", variant: "number" });
        onDigit(".");
        return;
      }
      if (key === "(" || key === ")") {
        playClick();
        handlePattern({ label: "()", action: "paren", variant: "action" });
        onParen();
        return;
      }
      if (key === "%") {
        playClick();
        handlePattern({ label: "%", action: "percent", variant: "action" });
        onPercent();
        return;
      }
      if (key === "+" || key === "-" || key === "*" || key === "/") {
        playClick();
        handlePattern({
          label: key,
          action: "op",
          value: key,
          variant: "operator",
        });
        onOperator(key);
      }
    },
    [handlePattern, onBackspace, onClear, onDigit, onEquals, onOperator, onParen, onPercent, playClick],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const activeOperator = useMemo(
    () => state.activeOperator,
    [state.activeOperator],
  );

  const displayValue = useMemo(() => {
    if (isErrorState(state)) return "Error";
    return state.displayValue;
  }, [state]);

  return (
    <>
      <BackgroundPatternLayer shapes={shapes} />
      <main className="card" aria-label="Calculator">
        <header className="text-xl font-bold leading-tight uppercase">
          MADE WITH LOVE
          <br />
          IN CURSOR 💛
        </header>

        <Display value={displayValue} />

        <Keypad
          buttons={buttons}
          activeOperator={activeOperator}
          onDigit={onDigit}
          onOperator={onOperator}
          onPercent={onPercent}
          onParen={onParen}
          onEquals={onEquals}
          onClear={onClear}
          onSound={playClick}
          onPattern={handlePattern}
        />

        <footer className="footer">
          <span>HSPACE 360</span>
          <span>Because 2 + 2 deserves good design</span>
        </footer>
      </main>
    </>
  );
}

