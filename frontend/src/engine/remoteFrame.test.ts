import { expect, it } from "vitest";
import { RemoteScene, decodeTerrain, isTerrainPacket } from "./remoteFrame";
import { executionMode, remoteEndpoint } from "./executionMode";
import { scenePacket } from "./testing/remotePacket";

it("assembles renderer buffers locally and rejects missing, stale or malformed baselines", () => {
  const scene = new RemoteScene();
  const { frame } = scene.receive(scenePacket());
  expect(frame.field).toEqual(new Float32Array(8));
  expect(frame.terrain.revision).toBe(7);
  expect(
    scene.receive(scenePacket({ sequence: 3, base: 1, reset: false, definition: null })).frame
      .sequence
  ).toBe(3);
  expect(() => scene.receive(scenePacket({ sequence: 4, base: 2, reset: false }))).toThrow(
    "baseline"
  );
  expect(() => new RemoteScene().receive(scenePacket({ base: 1, reset: false }))).toThrow(
    "initialization"
  );
  expect(() => new RemoteScene().receive(scenePacket({ reset: false }))).toThrow("initialization");
  expect(() => new RemoteScene().receive(scenePacket({}, new Uint8Array(1)))).toThrow("Truncated");
  expect(() => new RemoteScene().receive(scenePacket({}, new Uint8Array(21)))).toThrow("Trailing");
  expect(() => new RemoteScene().receive(scenePacket({ nx: 0 }))).toThrow("geometry");
  expect(() => new RemoteScene().receive(new ArrayBuffer(4))).toThrow("bounds");
});

it("validates static terrain identity and dimensions", () => {
  const packet = new ArrayBuffer(48);
  const header = new Uint32Array(packet, 0, 8);
  header.set([0x42545452, 1, 3, 7, 1, 1, 4, 0]);
  expect(isTerrainPacket(packet)).toBe(true);
  expect(decodeTerrain(packet).values.buffer).toBe(packet);
  header[4] = 257;
  expect(() => decodeTerrain(packet)).toThrow("layout");
  expect(() => decodeTerrain(new ArrayBuffer(4))).toThrow("bounds");
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
