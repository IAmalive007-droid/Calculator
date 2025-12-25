# Calculator 2025 (React + TS + Tailwind)

Calculator UI matching the provided Figma design, built with Vite, React, TypeScript, and Tailwind. Includes keyboard support, parentheses, percent logic, and token-based evaluation (no `eval`).

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## Structure
- `index.html` – Vite entry
- `src/main.tsx` – App bootstrap
- `src/modules/Calculator.tsx` – Container and state wiring
- `src/components/*` – Display, Keypad, CalcButton
- `src/utils/logic.ts` – Token handling and evaluator (shunting-yard to RPN)
- `tailwind.config.cjs`, `postcss.config.cjs` – styling config

## Notes
- Keyboard: digits, `.`, `Enter/=`, `Backspace`, `Escape`, `%`, `(`, `)`, `+`, `-`, `*`, `/`
- 00 button obeys leading-zero rules; percent follows “percent of left operand” semantics; divide-by-zero shows `Error` until cleared.

