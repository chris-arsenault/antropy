import { type Config } from "../sim/config";

const options = {
  learning: ["plastic", "static"],
  ploidy: ["haploid", "diploid"],
  transmission: ["clonal", "selfing"],
  crossover: ["uniform", "one-point"],
  mutationKind: ["gaussian", "uniform"],
  reproduction: ["fission", "budding"],
} as const;
export function EvolutionSettings({
  config,
  onChange,
}: {
  config: Config;
  onChange: (c: Config) => void;
}) {
  const select = (key: keyof typeof options, value: string) => {
    const next = { ...config, [key]: value };
    if (key === "transmission" && value === "selfing") next.ploidy = "diploid";
    if (key === "ploidy" && value === "haploid") next.transmission = "clonal";
    onChange(next);
  };
  return (
    <fieldset>
      <legend>Inheritance and lifetime learning</legend>
      <label>
        Learned change retained by offspring
        <input
          type="number"
          min="0"
          max="1"
          step="0.1"
          value={config.learningRetention}
          onChange={(e) => onChange({ ...config, learningRetention: Number(e.target.value) })}
        />
      </label>
      {(Object.keys(options) as (keyof typeof options)[]).map((key) => (
        <label key={key}>
          {key}{" "}
          <select
            value={config[key]}
            disabled={key === "crossover" && config.transmission === "clonal"}
            onChange={(e) => select(key, e.target.value)}
          >
            {options[key].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      ))}
      <p>Changes take effect on restart. Selfing uses two gametes from one diploid parent.</p>
    </fieldset>
  );
}
