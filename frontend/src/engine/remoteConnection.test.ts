import { afterEach, expect, it, vi } from "vitest";
import { gzipSync } from "node:zlib";
import { RemoteConnection } from "./remoteConnection";

class Socket {
  static readonly OPEN = 1;
  static readonly created: Socket[] = [];
  readyState = 1;
  sent: string[] = [];
  onopen = () => {};
  onclose = () => {};
  onmessage = (_e: { data: string | ArrayBuffer }) => {};
  constructor() {
    Socket.created.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.onclose();
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Socket.created.length = 0;
});
it("rejects uncertain commands on disconnect and reconnects without replay", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  const client = new RemoteConnection("ws://localhost/stream", vi.fn(), vi.fn(), vi.fn());
  client.connect();
  const first = Socket.created[0];
  first.onopen();
  const call = client.call("step");
  const rejected = expect(call).rejects.toThrow("not replayed");
  first.close();
  await rejected;
  await vi.advanceTimersByTimeAsync(1000);
  expect(Socket.created).toHaveLength(2);
  expect(Socket.created[1].sent).toEqual([]);
  client.dispose();
});

it("disconnects hidden viewers, cancels retries and opens a fresh socket when visible", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", Socket);
  const received = vi.fn();
  const client = new RemoteConnection("ws://localhost/stream", received, vi.fn(), vi.fn());
  client.connect();
  const first = Socket.created[0];
  first.onopen();
  const command = client.call("step");
  const rejected = expect(command).rejects.toThrow("not replayed");
  client.setActive(false);
  await rejected;
  expect(first.readyState).toBe(3);
  await vi.advanceTimersByTimeAsync(60000);
  expect(Socket.created).toHaveLength(1);
  first.onmessage({ data: JSON.stringify({ kind: "reply", id: 1, ok: true, value: null }) });
  expect(received).not.toHaveBeenCalled();
  client.setActive(true);
  expect(Socket.created).toHaveLength(2);
  expect(Socket.created[1].sent).toEqual([]);
  Socket.created[1].close(); // A scheduled retry must also stop when hidden.
  client.setActive(false);
  await vi.advanceTimersByTimeAsync(60000);
  expect(Socket.created).toHaveLength(2);
  client.dispose();
});

it("does not open a socket on initially hidden startup or after disposal", () => {
  vi.stubGlobal("WebSocket", Socket);
  const client = new RemoteConnection("ws://localhost/stream", vi.fn(), vi.fn(), vi.fn());
  client.setActive(false);
  client.connect();
  expect(Socket.created).toHaveLength(0);
  client.setActive(true);
  expect(Socket.created).toHaveLength(1);
  client.dispose();
  client.setActive(true);
  client.connect();
  expect(Socket.created).toHaveLength(1);
});

it("decompresses publications in socket order alongside command replies", async () => {
  vi.stubGlobal("WebSocket", Socket);
  const order: number[] = [];
  const client = new RemoteConnection(
    "ws://localhost/stream",
    (data) => order.push(new Uint8Array(data as ArrayBuffer)[0]),
    vi.fn(),
    vi.fn()
  );
  client.connect();
  const socket = Socket.created[0];
  socket.onopen();
  const reply = client.call("pick").then(() => order.push(2));
  const compressed = (value: number) => new Uint8Array(gzipSync(new Uint8Array([value]))).buffer;
  socket.onmessage({ data: compressed(1) });
  socket.onmessage({ data: JSON.stringify({ kind: "reply", id: 1, ok: true, value: null }) });
  socket.onmessage({ data: compressed(3) });
  await reply;
  await vi.waitFor(() => expect(order).toEqual([1, 2, 3]));
  client.dispose();
});
