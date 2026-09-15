import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEngine, captureEngine } from "../numerical/engine";
import { type Definition } from "../../src/engine/types";
const PROPERTY_NAMES = ["potential", "diffusion", "impedance", "stress"] as const;
type AtlasDefinition = Definition["chemistry"] & {
  ranges: Record<(typeof PROPERTY_NAMES)[number], [number, number]>;
};

/** Analytical property atlas; no organisms, simulation ticks or seed selection. */
export async function writeChemistryAtlas(directory: string, seed = 101): Promise<void> {
  if (existsSync(directory)) throw new Error("Atlas output already exists");
  const engine = await loadEngine();
  const data = engine.command<{ definition: AtlasDefinition; curves: unknown }>("chemistryAtlas", {
    seed,
  });
  const definition = data.definition;
  mkdirSync(directory, { recursive: true });
  captureEngine(directory, engine);
  writeFileSync(
    resolve(directory, "definition.json"),
    JSON.stringify({ ...data, sourceDigest: engine.sourceDigest }, null, 2)
  );
  const panels = PROPERTY_NAMES.map((name, panel) => {
    const values = definition.properties.map((p) =>
      name === "diffusion" ? Math.log(p[name]) : p[name]
    );
    const low = Math.min(...values),
      high = Math.max(...values);
    const pixels = values
      .map((v, s) => {
        const f = (v - low) / (high - low);
        return `<rect x="${(s >> 4) * 16}" y="${(15 - (s & 15)) * 16}" width="16" height="16" fill="hsl(${240 - 240 * f},65%,50%)"/>`;
      })
      .join("");
    const raw = definition.properties.map((p) => p[name]);
    return `<g transform="translate(${20 + panel * 285},45)"><text y="-15">${name}${name === "diffusion" ? " (log scale)" : ""}</text>${pixels}<text y="280">X: 0–15; Y: 0 bottom–15 top</text><text y="300">${Math.min(...raw).toPrecision(3)}–${Math.max(...raw).toPrecision(3)}</text></g>`;
  }).join("");
  writeFileSync(
    resolve(directory, "properties.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="365" viewBox="0 0 1160 365"><rect width="1160" height="365" fill="white"/><g font-family="sans-serif" font-size="15">${panels}</g></svg>`
  );
  writeJointAtlas(directory, definition);
  writeFileSync(resolve(directory, "law-samples.json"), JSON.stringify(data.curves, null, 2));
}

function writeJointAtlas(directory: string, definition: AtlasDefinition): void {
  const pairs = [
    ["potential", "stress"],
    ["impedance", "diffusion"],
    ["potential", "impedance"],
  ] as const;
  const panels = pairs
    .map(([x, y], panel) => {
      const points = definition.properties
        .map((p, s) => {
          const xs =
            (p[x] - definition.ranges[x][0]) / (definition.ranges[x][1] - definition.ranges[x][0]);
          const ys =
            y === "diffusion"
              ? Math.log(p[y] / 0.005) / Math.log(100)
              : p[y] / definition.ranges[y][1];
          return `<circle cx="${xs * 250}" cy="${250 - ys * 250}" r="2" fill="#346e9c"><title>ID ${s}: ${p[x]}, ${p[y]}</title></circle>`;
        })
        .join("");
      return `<g transform="translate(${30 + panel * 300},40)"><text y="-15">${x} / ${y}${y === "diffusion" ? " (log)" : ""}</text><path d="M0 0V250H250" fill="none" stroke="#555"/>${points}<text y="275">256 chemical IDs; normalized axes</text></g>`;
    })
    .join("");
  writeFileSync(
    resolve(directory, "joint-properties.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="940" height="340"><rect width="940" height="340" fill="white"/><g font-family="sans-serif" font-size="13">${panels}</g></svg>`
  );
}

if (process.argv[1]?.endsWith("chemistryAtlas.ts")) {
  const output = process.argv[2];
  if (!output) throw new Error("Provide a new local output directory");
  await writeChemistryAtlas(output);
}
