type OperatorSymbol = "+" | "-" | "*" | "/";

type Token =
  | { type: "number"; value: string }
  | { type: "op"; value: OperatorSymbol }
  | { type: "paren"; value: "(" | ")" };

export type CalcState = {
  tokens: Token[];
  buffer: string;
  parenBalance: number;
  overwrite: boolean;
  error: boolean;
  activeOperator: OperatorSymbol | null;
  displayValue: string;
};

export const initialState: CalcState = {
  tokens: [],
  buffer: "0",
  parenBalance: 0,
  overwrite: false,
  error: false,
  activeOperator: null,
  displayValue: "0",
};

const precedence: Record<OperatorSymbol, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
};

const isOperator = (token?: Token): token is Token & { type: "op" } =>
  Boolean(token && token.type === "op");

const isNumber = (token?: Token): token is Token & { type: "number" } =>
  Boolean(token && token.type === "number");

const lastToken = (tokens: Token[]) => tokens[tokens.length - 1];

const computeDisplay = (state: CalcState) => {
  if (state.error) return "Error";
  if (state.buffer !== "" && state.buffer !== "-") return state.buffer;
  for (let i = state.tokens.length - 1; i >= 0; i -= 1) {
    if (state.tokens[i].type === "number") return state.tokens[i].value;
  }
  if (state.buffer === "-") return "-";
  return "0";
};

const withDisplay = (state: CalcState): CalcState => ({
  ...state,
  displayValue: computeDisplay(state),
});

export const resetState = (): CalcState => ({ ...initialState });

const pushBuffer = (state: CalcState) => {
  const next = { ...state };
  if (next.buffer !== "" && next.buffer !== "-") {
    next.tokens = [...next.tokens, { type: "number", value: next.buffer }];
    next.buffer = "";
  }
  return next;
};

export const appendDigit = (state: CalcState, value: string): CalcState => {
  if (state.error) return state;
  const next = { ...state };

  if (state.overwrite) {
    next.tokens = [];
    next.parenBalance = 0;
    next.activeOperator = null;
    next.overwrite = false;
    next.error = false;
    next.buffer = value === "." ? "0." : value;
    return withDisplay(next);
  }

  if (value === ".") {
    if (next.buffer.includes(".")) return state;
    next.buffer = next.buffer === "" ? "0." : `${next.buffer}.`;
    return withDisplay(next);
  }

  if (value === "00") {
    if (next.buffer === "0" || next.buffer === "-") {
      return withDisplay(next);
    }
    next.buffer = `${next.buffer}00`;
    return withDisplay(next);
  }

  if (next.buffer === "0") {
    next.buffer = value;
  } else if (next.buffer === "-") {
    next.buffer = `-${value}`;
  } else {
    next.buffer += value;
  }
  return withDisplay(next);
};

export const appendOperator = (
  state: CalcState,
  op: string,
): CalcState => {
  if (state.error) return state;
  if (op !== "+" && op !== "-" && op !== "*" && op !== "/") return state;
  let next = { ...state, overwrite: false, error: false };

  if (state.overwrite) {
    // Continue from previous result
    next.tokens = [];
    if (state.buffer && state.buffer !== "Error") {
      next.tokens.push({ type: "number", value: state.buffer });
    }
    next.buffer = "";
    next.parenBalance = 0;
  }

  if (next.buffer === "" && next.tokens.length === 0 && op === "-") {
    next.buffer = "-";
    return withDisplay(next);
  }

  next = pushBuffer(next);

  const last = lastToken(next.tokens);
  if (isOperator(last)) {
    next.tokens = [...next.tokens.slice(0, -1), { type: "op", value: op }];
  } else {
    next.tokens = [...next.tokens, { type: "op", value: op }];
  }
  next.activeOperator = op;
  return withDisplay(next);
};

const findLastNumberBeforeOp = (tokens: Token[]) => {
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (tokens[i].type === "number") return { value: tokens[i].value, index: i };
  }
  return null;
};

export const applyPercent = (state: CalcState): CalcState => {
  if (state.error) return state;
  const next = { ...state };

  const current = next.buffer !== "" ? next.buffer : findLastNumberBeforeOp(next.tokens)?.value ?? "0";
  const right = Number(current);
  if (Number.isNaN(right)) return state;

  const lastOpIdx = [...next.tokens].reverse().findIndex((t) => t.type === "op");
  const actualIdx = lastOpIdx === -1 ? -1 : next.tokens.length - 1 - lastOpIdx;
  const operatorToken = actualIdx >= 0 ? next.tokens[actualIdx] : null;
  const leftTokenInfo = operatorToken ? findLastNumberBeforeOp(next.tokens.slice(0, actualIdx)) : null;
  const left = leftTokenInfo ? Number(leftTokenInfo.value) : null;

  let computed: number;
  if (!operatorToken || left === null) {
    computed = right / 100;
  } else {
    switch (operatorToken.value) {
      case "+":
        computed = left + left * (right / 100);
        break;
      case "-":
        computed = left - left * (right / 100);
        break;
      case "*":
        computed = left * (right / 100);
        break;
      case "/":
        computed = right === 0 ? Number.NaN : left / (right / 100);
        break;
      default:
        computed = right / 100;
    }
  }

  if (!Number.isFinite(computed)) {
    next.error = true;
    return withDisplay(next);
  }

  next.buffer = String(computed);
  return withDisplay(next);
};

export const applyParenthesis = (state: CalcState): CalcState => {
  if (state.error) return state;
  const next = { ...state };

  if (state.overwrite) {
    next.tokens = [];
    next.buffer = "";
    next.parenBalance = 0;
    next.overwrite = false;
    next.error = false;
    next.activeOperator = null;
  }

  const last = lastToken(next.tokens);
  const hasBuffer = next.buffer !== "" && next.buffer !== "-";
  const currentIsNegativeOnly = next.buffer === "-";

  const canOpen =
    (!hasBuffer && !currentIsNegativeOnly && (!last || (last.type === "op" || (last.type === "paren" && last.value === "(")))) ||
    next.tokens.length === 0;
  const canClose =
    next.parenBalance > 0 &&
    (hasBuffer || currentIsNegativeOnly || (last && last.type === "paren" && last.value === ")") || (last && last.type === "number"));

  if (canOpen) {
    next.tokens = [...next.tokens, { type: "paren", value: "(" }];
    next.parenBalance += 1;
  } else if (canClose) {
    next.tokens = pushBuffer(next).tokens;
    next.tokens = [...next.tokens, { type: "paren", value: ")" }];
    next.parenBalance = Math.max(0, next.parenBalance - 1);
    next.buffer = "";
  }

  return withDisplay(next);
};

export const backspace = (state: CalcState): CalcState => {
  if (state.error) return state;
  const next = { ...state };
  if (next.overwrite) return resetState();

  if (next.buffer !== "") {
    next.buffer = next.buffer.slice(0, -1);
    if (next.buffer === "" || next.buffer === "-") {
      next.buffer = "";
    }
    return withDisplay(next);
  }

  const last = lastToken(next.tokens);
  if (isNumber(last)) {
    const trimmed = last.value.slice(0, -1);
    const updatedTokens = [...next.tokens];
    updatedTokens.pop();
    if (trimmed) {
      updatedTokens.push({ type: "number", value: trimmed });
      next.tokens = updatedTokens;
    } else {
      next.tokens = updatedTokens;
    }
  } else if (last?.type === "paren") {
    next.tokens = [...next.tokens.slice(0, -1)];
    if (last.value === "(") {
      next.parenBalance = Math.max(0, next.parenBalance - 1);
    } else {
      next.parenBalance += 1;
    }
  } else if (isOperator(last)) {
    next.tokens = [...next.tokens.slice(0, -1)];
  }

  return withDisplay(next);
};

const toRpn = (tokens: Token[]): Token[] => {
  const output: Token[] = [];
  const ops: Token[] = [];

  tokens.forEach((token) => {
    if (token.type === "number") {
      output.push(token);
    } else if (token.type === "op") {
      while (
        ops.length &&
        ops[ops.length - 1].type === "op" &&
        precedence[(ops[ops.length - 1] as Token & { type: "op" }).value] >= precedence[token.value]
      ) {
        output.push(ops.pop() as Token);
      }
      ops.push(token);
    } else if (token.type === "paren" && token.value === "(") {
      ops.push(token);
    } else if (token.type === "paren" && token.value === ")") {
      while (ops.length && !(ops[ops.length - 1].type === "paren" && ops[ops.length - 1].value === "(")) {
        output.push(ops.pop() as Token);
      }
      ops.pop();
    }
  });

  while (ops.length) {
    output.push(ops.pop() as Token);
  }
  return output;
};

const evalRpn = (tokens: Token[]) => {
  const stack: number[] = [];
  for (const token of tokens) {
    if (token.type === "number") {
      stack.push(Number(token.value));
    } else if (token.type === "op") {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return Number.NaN;
      let res = 0;
      switch (token.value) {
        case "+":
          res = a + b;
          break;
        case "-":
          res = a - b;
          break;
        case "*":
          res = a * b;
          break;
        case "/":
          if (b === 0) return Number.POSITIVE_INFINITY;
          res = a / b;
          break;
        default:
          return Number.NaN;
      }
      stack.push(res);
    }
  }
  return stack.length === 1 ? stack[0] : Number.NaN;
};

export const evaluateExpression = (state: CalcState): CalcState => {
  if (state.error) return state;
  let working: Token[] = [...state.tokens];
  if (state.buffer !== "" && state.buffer !== "-") {
    working = [...working, { type: "number", value: state.buffer }];
  }
  for (let i = 0; i < state.parenBalance; i += 1) {
    working.push({ type: "paren", value: ")" });
  }

  const rpn = toRpn(working);
  const result = evalRpn(rpn);

  if (!Number.isFinite(result)) {
    return withDisplay({
      ...state,
      tokens: [],
      buffer: "Error",
      overwrite: true,
      error: true,
      activeOperator: null,
      parenBalance: 0,
    });
  }

  const next: CalcState = {
    tokens: [],
    buffer: String(result),
    parenBalance: 0,
    overwrite: true,
    error: false,
    activeOperator: null,
    displayValue: "",
  };

  return withDisplay(next);
};

export const isErrorState = (state: CalcState) => state.error || state.displayValue === "Error";

