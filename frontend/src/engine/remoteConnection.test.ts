import { afterEach, expect, it, vi } from "vitest";
import { RemoteConnection } from "./remoteConnection";

class Socket {
  static readonly OPEN = 1;
  static readonly created: Socket[] = [];
  readyState = 1;
  sent: string[] = [];
  onopen = () => {};
  onclose = () => {};
  onmessage = (_e: { data: string }) => {};
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
