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
  generation = 0;
  constructor(
    private readonly endpoint: string,
    private readonly receive: (data: string | ArrayBuffer) => void,
    private readonly state: (connected: boolean) => void,
    private readonly opened: () => void
  ) {}
  connect() {
    const socket = new WebSocket(this.endpoint);
    this.socket = socket;
    socket.binaryType = "arraybuffer";
    socket.onopen = () => {
      this.delay = 1000;
      this.state(true);
      this.opened();
    };
    socket.onmessage = (e: MessageEvent<string | ArrayBuffer>) => {
      try {
        if (typeof e.data === "string" && this.reply(e.data)) return;
        this.receive(e.data);
      } catch {
        socket.close(1002, "Invalid server publication");
      }
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.failPending();
      this.state(false);
      if (!this.disposed) {
        this.retry = setTimeout(() => this.connect(), this.delay);
        this.delay = Math.min(10000, this.delay * 2);
      }
    };
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
    if (this.retry) clearTimeout(this.retry);
    this.socket?.close();
    this.failPending();
  }
}
