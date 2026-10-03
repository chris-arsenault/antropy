import { type RecognitionProfile } from "./bindingTypes";
import { machineryLabel } from "./bodyParts";
import { Table, numberText as n } from "./Table";
import { recognitionLabel } from "./recognition";

export function RecognitionDetails({ profile }: { profile: RecognitionProfile }) {
  return (
    <details>
      <summary>Inherited recognition · {profile.kind}</summary>
      <p>
        {profile.kind === "complementarity"
          ? `One shared steepness of ${n(profile.lambda)} applies to every key.`
          : "This diagnostic population uses radial recognition."}{" "}
        Profiles describe birth capabilities. Actual sensing, transport and conversion also require
        funded capacity and effort. Effective breadth is the squared sum of affinities divided by
        their sum of squares; it is not a count of fuels.
      </p>
      <Table
        columns={["Site", "Recognition", "Key weights", "Bias"]}
        rows={profile.sites.map((row) => [
          row.site === 16 ? "Membrane" : machineryLabel(row.site),
          recognitionLabel(profile, row.site),
          row.key?.weights.map(n).join(", ") ?? "Radial",
          row.key ? n(row.key.bias) : "—",
        ])}
      />
      <p>
        Strongest-identity summaries omit the wider profile. The chemical atlas shows its full
        compiled support. Membrane susceptibility has a positive floor; lower values reduce injury
        and passive permeability, without granting usable work.
      </p>
    </details>
  );
}
