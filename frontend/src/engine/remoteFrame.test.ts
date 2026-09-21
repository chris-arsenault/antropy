import { expect, it } from "vitest";
import { decodeDisplay } from "./remoteFrame";
import { executionMode, remoteEndpoint } from "./executionMode";

it("borrows display slices from one packet and rejects malformed geometry", () => {
  const packet = new ArrayBuffer(64 + (12 + 8 + 12) * 4);
  const header = new Uint32Array(packet, 0, 12);
  header.set([0x42545250, 1, 3, 4, 500, 0, 1, 1, 12, 8, 12, 0]);
  new Float32Array(packet, 48, 4).set([0, 0, 2, 2]);
  const frame = decodeDisplay(packet);
  expect(frame.tick).toBe(500);
  expect(frame.count).toBe(1);
  expect(frame.field.buffer).toBe(packet);
  expect(frame.cells.buffer).toBe(packet);
  expect(frame.markers.buffer).toBe(packet);
  header[9] = 10;
  expect(() => decodeDisplay(packet)).toThrow("layout");
  expect(() => decodeDisplay(new ArrayBuffer(4))).toThrow("bounds");
});

it("keeps local selection explicit and rejects URL credentials", () => {
  expect(executionMode(new URL("https://biotropy.ahara.io/?execution=browser4")).mode).toBe(
    "browser4"
  );
  expect(executionMode(new URL("https://biotropy.ahara.io/?execution=browser1")).mode).toBe(
    "browser1"
  );
  expect(() => remoteEndpoint("https://user:password@example.test/stream")).toThrow("credentials");
});
