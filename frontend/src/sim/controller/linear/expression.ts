import { type Instruction, finite } from "./genome";

export type Expression =
  | number
  | { input: number }
  | {
      op: "add" | "subtract" | "multiply" | "greater";
      left: Expression;
      right: Expression;
    };
export const input = (index: number): Expression => ({ input: index });
export const add = (left: Expression, right: Expression): Expression => ({
  op: "add",
  left,
  right,
});
export const mul = (left: Expression, right: Expression): Expression => ({
  op: "multiply",
  left,
  right,
});
export const gt = (left: Expression, right: Expression): Expression => ({
  op: "greater",
  left,
  right,
});
export const sub = (left: Expression, right: Expression): Expression => ({
  op: "subtract",
  left,
  right,
});
export const eq = (left: Expression, right: Expression): Expression =>
  sub(1, add(gt(left, right), gt(right, left)));
export const all = (...values: Expression[]): Expression => values.reduce(mul, 1);
export const sum = (...values: Expression[]): Expression => values.reduce(add, 0);

export function evaluate(expression: Expression, values: readonly number[]): number {
  if (typeof expression === "number") return finite(expression);
  if ("input" in expression) return finite(values[expression.input]);
  const a = evaluate(expression.left, values),
    b = evaluate(expression.right, values);
  switch (expression.op) {
    case "add":
      return finite(a + b);
    case "subtract":
      return finite(a - b);
    case "multiply":
      return finite(a * b);
    case "greater":
      return Number(a > b);
  }
}

export function compile(expression: Expression, out: number, scratch = 2): Instruction[] {
  const base = { out, a: 0, b: 0, value: 0 };
  if (typeof expression === "number") return [{ ...base, op: "constant", value: expression }];
  if ("input" in expression) return [{ ...base, op: "input", value: expression.input }];
  if (scratch >= 24) throw new Error("seed expression exceeds scratch registers");
  return [
    ...compile(expression.left, out, scratch),
    ...compile(expression.right, scratch, scratch + 1),
    { ...base, op: expression.op, a: out, b: scratch },
  ];
}

export function specialize(expression: Expression, index: number, value: number): Expression {
  if (typeof expression === "number") return expression;
  if ("input" in expression) return expression.input === index ? value : expression;
  const left = specialize(expression.left, index, value),
    right = specialize(expression.right, index, value);
  return simplify({ ...expression, left, right });
}

function simplify(expression: Exclude<Expression, number | { input: number }>): Expression {
  const { left, right } = expression;
  if (typeof left === "number" && typeof right === "number")
    return evaluate({ ...expression, left, right }, []);
  if (expression.op === "multiply") return simplifyProduct(expression);
  if (expression.op === "add" && left === 0) return right;
  if (expression.op === "add" && right === 0) return left;
  return { ...expression, left, right };
}

function simplifyProduct(expression: Exclude<Expression, number | { input: number }>): Expression {
  const { left, right } = expression;
  if (left === 0 || right === 0) return 0;
  if (left === 1) return right;
  if (right === 1) return left;
  return expression;
}
