import { decompressPublication } from "./remoteCompression";

type Reply = { kind: "reply"; id: number } & (
  { ok: true; value: unknown } | { ok: false; error: string }
);
type Pending = {
  resolve: (value: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

/** Socket state contains bounded requests and no physical state or reconnect command replay. */
export class RemoteConnection {
  private socket: WebSocket | null = null;
  private pending = new Map<number, Pending>();
  private next = 1;
  private delay = 1000;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private active = true;
  generation = 0;
  constructor(
    private readonly endpoint: string,
    private readonly receive: (data: string | ArrayBuffer) => void,
    private readonly state: (connected: boolean) => void,
    private readonly opened: () => void
  ) {}
  connect() {
    if (this.disposed || !this.active || this.socket) return;
    const socket = new WebSocket(this.endpoint);
    this.socket = socket;
    socket.binaryType = "arraybuffer";
    let incoming = Promise.resolve();
    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.delay = 1000;
      this.state(true);
      this.opened();
    };
    socket.onmessage = (e: MessageEvent<string | ArrayBuffer>) => {
      incoming = incoming
        .then(() => this.message(socket, e.data))
        .catch(() => {
          if (this.socket === socket) socket.close(1002, "Invalid server publication");
        });
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.failPending();
      this.state(false);
      if (!this.disposed && this.active) {
        this.retry = setTimeout(() => {
          this.retry = null;
          this.connect();
        }, this.delay);
        this.delay = Math.min(10000, this.delay * 2);
      }
    };
  }
  setActive(value: boolean) {
    if (this.disposed || this.active === value) return;
    this.active = value;
    if (value) {
      this.connect();
      return;
    }
    this.disconnect();
    this.state(false);
  }
  private disconnect() {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    const socket = this.socket;
    this.socket = null;
    socket?.close();
    this.failPending();
  }
  private async message(socket: WebSocket, data: string | ArrayBuffer) {
    if (this.socket !== socket) return;
    if (typeof data === "string") {
      if (!this.reply(data)) throw new Error("Unexpected server message");
      return;
    }
    const publication = await decompressPublication(data);
    if (this.socket === socket) this.receive(publication);
  }
  call<T = unknown>(op: string, payload: Record<string, unknown> = {}): Promise<T> {
    const socket = this.socket;
    if (socket?.readyState !== WebSocket.OPEN)
      return Promise.reject(new Error("Server disconnected"));
    if (this.pending.size >= 16) return Promise.reject(new Error("Remote query budget busy"));
    const id = this.next++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Server request timed out; command outcome is unknown"));
      }, 30000);
      this.pending.set(id, { resolve: (v) => resolve(v as T), reject, timer });
      socket.send(JSON.stringify({ id, op, payload, generation: this.generation }));
    });
  }
  private reply(text: string) {
    if (text.length > 4 * 1024 * 1024) throw new Error("Remote observation exceeds packet budget");
    const m = JSON.parse(text) as Reply;
    if (m.kind !== "reply") return false;
    const p = this.pending.get(m.id);
    if (!p) return true;
    clearTimeout(p.timer);
    this.pending.delete(m.id);
    if (m.ok) p.resolve(m.value);
    else p.reject(new Error(m.error ?? "Server request failed"));
    return true;
  }
  private failPending() {
    this.pending.forEach((p) => {
      clearTimeout(p.timer);
      p.reject(new Error("Server disconnected; pending commands were not replayed"));
    });
    this.pending.clear();
  }
  dispose() {
    this.disposed = true;
    this.disconnect();
  }
}
