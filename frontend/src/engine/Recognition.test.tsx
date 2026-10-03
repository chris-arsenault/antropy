// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Engine } from "./client";
import { SelectedObservation } from "./selectedObservation";
import { type Definition, type Summary } from "./types";
import { ChemicalAtlas } from "./ChemicalAtlas";
import { RecognitionDetails } from "./RecognitionDetails";
import { atlasValues } from "./recognition";
import { checkObservationBudget } from "./observationBudget";

const bytes = new Uint8Array(readFileSync("public/antropy-engine.wasm"));
it("shows the physical compiled profile and retains it through selected-cell revisions", async () => {
  const world = (await Engine.load(bytes)).create(27, {
    width: 24,
    height: 24,
    founders: 4,
    sourceCount: 4,
  });
  try {
    const summary = () => world.command<Summary>("summary");
    const selected = new SelectedObservation();
    const before = world.snapshot();
    const inspection = selected.read(world, summary(), 1)!;
    const profile = inspection.recognition!;
    const definition = world.command<Definition>("definition");
    expect(profile.kind).toBe("complementarity");
    expect(profile.sites).toHaveLength(17);
    expect(profile.sites[0].preferred).toEqual([0, 0]);
    const values = atlasValues(definition, "recognition", profile, 0);
    expect(values[0]).toBe(profile.sites[0].peak);
    expect(values[255]).toBe(0);
    expect(atlasValues(definition, "susceptibility", profile, 16)).toEqual(profile.susceptibility);
    const html = renderToStaticMarkup(
      <>
        <ChemicalAtlas
          definition={definition}
          machinery={inspection.expressed!.chemistry}
          recognition={profile}
        />
        <RecognitionDetails profile={profile} />
      </>
    );
    expect(html).toContain("Chemical recognition atlas");
    expect(html).toContain("Key weights");
    expect(html).toContain(`Compiled support: ${profile.sites[0].affinities.length}`);
    expect(html).not.toContain("Birth coordinate");
    checkObservationBudget({
      status: {},
      history: null,
      recent: null,
      inspection: { reset: true, patch: inspection },
    });
    expect(world.snapshot()).toEqual(before);
    world.step(4);
    const next = selected.read(world, summary(), 1)!;
    expect(next.recognition).toBe(profile);
  } finally {
    world.dispose();
  }
});
