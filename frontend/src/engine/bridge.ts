import { type Definition, type Inspection, type LiveStatus } from "./types";
import { type Message, type Operation } from "./protocol";
import { type ViewOptions } from "./renderer";
import { applyObservation } from "./observationDelta";

export interface ViewState {
  definition: Definition | null;
  status: LiveStatus | null;
  inspection: Inspection | null;
  error: string | null;
}
type Pending = { resolve(value: unknown): void; reject(error: Error): void };
export class Bridge {
  private worker: Worker | null = null;
  private next = 1;
  private pending = new Map<number, Pending>();
  private listeners = new Set<() => void>();
  private nextView: ViewOptions | null = null;
  private sendingView = false;
  private animation = 0;
  private framePending = false;
  private state: ViewState = { definition: null, status: null, inspection: null, error: null };
  readonly getSnapshot = () => this.state;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private update(patch: Partial<ViewState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  start(canvas: OffscreenCanvas, wasmUrl: string) {
    this.update({ definition: null, status: null, inspection: null, error: null });
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.worker = worker;
    worker.onmessage = (event) => {
      if (this.worker === worker) this.receive(event.data as Message);
    };
    worker.onerror = (event) => {
      if (this.worker !== worker) return;
      const error = new Error(`Simulation worker failed: ${event.message}`);
      this.update({
        error: error.message,
        status: this.state.status ? { ...this.state.status, running: false } : null,
      });
      this.pending.forEach((p) => p.reject(error));
      this.pending.clear();
      // An uncaught worker error must not leave an unobserved simulation advancing.
      this.stop();
    };
    this.call("initialize", { canvas, wasmUrl }, [canvas]).catch((error) => {
      if (this.worker === worker) this.update({ error: String(error) });
    });
    this.animation = requestAnimationFrame(() => this.present(worker));
  }
  /** Presentation requests carry no physical data and never accumulate behind the worker. */
  private present(worker: Worker) {
    if (this.worker !== worker) return;
    if (this.state.status?.running && !this.framePending) {
      this.framePending = true;
      this.call("frame")
        .catch((error) => {
          if (this.worker === worker) this.update({ error: String(error) });
        })
        .finally(() => {
          if (this.worker === worker) this.framePending = false;
        });
    }
    this.animation = requestAnimationFrame(() => this.present(worker));
  }
  stop() {
    cancelAnimationFrame(this.animation);
    this.framePending = false;
    this.worker?.terminate();
    this.worker = null;
    this.nextView = null;
    this.sendingView = false;
    this.pending.forEach((p) => p.reject(new Error("Simulation worker closed")));
    this.pending.clear();
  }
  /** Retain the newest camera while one update is in flight. */
  view(options: ViewOptions) {
    this.nextView = options;
    if (!this.sendingView) this.sendView();
  }
  private sendView() {
    const options = this.nextView;
    if (!options || !this.worker || !this.state.definition) return;
    this.nextView = null;
    this.sendingView = true;
    const worker = this.worker;
    this.call("view", options as unknown as Record<string, unknown>)
      .catch((error) => {
        if (this.worker === worker) this.update({ error: String(error) });
      })
      .finally(() => {
        if (this.worker !== worker) return;
        this.sendingView = false;
        this.sendView();
      });
  }
  call<T = void>(
    op: Operation,
    payload: Record<string, unknown> = {},
    transfer: Transferable[] = []
  ): Promise<T> {
    if (!this.worker) return Promise.reject(new Error("Simulation worker is not running"));
    const id = this.next++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: (value) => resolve(value as T), reject });
      try {
        this.worker!.postMessage({ id, op, payload }, transfer);
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }
  private receive(message: Message) {
    if (message.kind === "reply") {
      this.reply(message);
    } else if (message.kind === "definition") {
      this.update({ definition: message.value, status: null, inspection: null, error: null });
      if (!this.sendingView) this.sendView();
    } else if (message.kind === "observation") {
      const next = applyObservation(this.state, message.value);
      this.update({ ...next, error: next.status!.error });
      this.call("observed", { sequence: message.sequence }).catch((error) =>
        this.update({ error: String(error) })
      );
    } else
      this.update({
        error: message.value,
        status: this.state.status ? { ...this.state.status, running: false } : null,
      });
  }
  private reply(message: Extract<Message, { kind: "reply" }>) {
    const pending = this.pending.get(message.id);
    this.pending.delete(message.id);
    if (message.ok) pending?.resolve(message.value);
    else pending?.reject(new Error(message.error));
  }
}
