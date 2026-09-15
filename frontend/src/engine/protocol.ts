import { type Definition } from "./types";
import { type ObservationDelta } from "./observationDelta";

export type Operation =
  | "initialize"
  | "observed"
  | "view"
  | "frame"
  | "running"
  | "speed"
  | "restart"
  | "step"
  | "pick"
  | "inspect"
  | "task"
  | "save"
  | "export"
  | "import"
  | "recover"
  | "recoveries";
export interface Request {
  id: number;
  op: Operation;
  payload: Record<string, unknown>;
}
export type Message =
  | { kind: "reply"; id: number; ok: true; value: unknown }
  | { kind: "reply"; id: number; ok: false; error: string }
  | { kind: "definition"; value: Definition }
  | { kind: "observation"; sequence: number; value: ObservationDelta }
  | { kind: "fault"; value: string };
