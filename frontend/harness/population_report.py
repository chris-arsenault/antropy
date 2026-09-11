"""Summarize completed 50k current-default comparisons; never select live reproduction.

python harness/population_report.py harness/artifacts/population-50k-2026-09-11
Outputs analysis.json alongside the append-only run directories.
"""
import hashlib
import json
import statistics
import sys
from pathlib import Path


def pct(part, whole):
    return 100 * part / whole if whole else None


def mean(values):
    return statistics.mean(values) if values else None


def late_budget(first, last):
    delta = {key: last[key] - first[key] for key in first}
    absorbed = delta["absorbedA"] + delta["absorbedB"]
    energy = sum(delta[key] for key in (
        "metabolism", "learning", "motors", "secretion", "construction",
        "catabolismLoss", "division", "repair"))
    return {
        "divisions": delta["divisions"], "births": delta["births"], "deaths": delta["deaths"],
        "damage_death_percent": pct(delta["damageDeaths"], delta["deaths"]),
        "food_a_absorption_percent": pct(delta["absorbedA"], absorbed),
        "toxin_per_absorbed_percent": pct(delta["toxinEmitted"], absorbed),
        "matrix_per_absorbed_percent": pct(delta["matrixEmitted"], absorbed),
        "construction_per_absorbed_percent": pct(delta["constructedMaterial"], absorbed),
        "repair_energy_percent": pct(delta["repair"], energy),
        "motor_energy_percent": pct(delta["motors"], energy),
        "learning_energy_percent": pct(delta["learning"], energy),
    }


def traits(snapshot):
    return {row["part"]: {
        "mean_change_from_founder_percent": 100 * (row["relative"]["mean"] - 1),
        "p10_change_from_founder_percent": 100 * (row["relative"]["p10"] - 1),
        "p90_change_from_founder_percent": 100 * (row["relative"]["p90"] - 1),
    } for row in snapshot["inherited"]["traits"] if row["relative"]}


def report_run(directory):
    manifest = json.loads((directory / "manifest.json").read_text())
    if manifest["status"] != "complete":
        raise ValueError(f"Incomplete run: {directory}")
    data = json.loads((directory / "result.json").read_text())
    final, series = data["final"], data["series"]
    observations = data["observations"]
    late = [s for s in series if s["tick"] > 40000]
    boundary = next((p for p in observations if p["tick"] == 40000), None)
    last = observations[-1]
    leaders = [s["lineages"][0][0] for s in series if s["lineages"]]
    effort = {}
    for key in ("swim", "turn", "toxin", "matrix", "repair"):
        bins = [0] * 10
        for p in observations:
            if p["tick"] <= 40000:
                continue
            values = next(e["bins"] for e in p["efforts"] if e["key"] == key)
            bins = [a + b for a, b in zip(bins, values)]
        effort[key] = {"bins_percent": [pct(n, sum(bins)) for n in bins],
                       "effort_at_least_half_percent": pct(sum(bins[5:]), sum(bins))}
    return {
        "run": manifest["label"], "seed": manifest["seed"], "frozen": manifest["frozen"],
        "tick": final["tick"], "ledger_id": data["ledgerId"],
        "wall_seconds": data["wallMs"] / 1000,
        "stable_source": manifest["sourceDigest"] == manifest["sourceDigestAfter"],
        "source": manifest["sourceDigest"], "stop_reason": final["stopReason"],
        "population": final["population"], "generation": final["maxGeneration"],
        "founders": final["inherited"]["livingLineages"],
        "largest_founder_percent": 100 * final["inherited"]["largestShare"],
        "founder_lead_changes_at_500_tick_samples": sum(a != b for a, b in zip(leaders, leaders[1:])),
        "recent_families": len(last["families"]),
        "largest_recent_family_percent": pct(max((n for _, n in last["families"]), default=0), final["population"]),
        "living_sequences": final["livingGenomes"], "mutant_births": final["mutations"],
        "learned_births": final["learnedBirths"],
        "controller_distance": final["inherited"]["controllerDistance"],
        "final_traits": traits(final),
        "final_investments": [{"trait": t["key"], "unit": t["unit"], "stats": t["stats"]}
                              for t in last["traits"]],
        "milestones": [{"tick": s["tick"], "population": s["population"],
                        "largest_founder_percent": 100*s["inherited"]["largestShare"],
                        "traits": traits(s)} for s in series if s["tick"] % 10000 == 0],
        "late_population_mean": mean([s["population"] for s in late]),
        "late_population_range": [min((s["population"] for s in late), default=0),
                                  max((s["population"] for s in late), default=0)],
        "late_budget": late_budget(boundary["ledger"], last["ledger"]) if boundary else None,
        "final_population_born_after_40k_percent": pct(sum(c["born"] > 40000 for c in last["cells"]), len(last["cells"])),
        "late_mean_half_speed_world_percent": mean([s["matrixHalfSpeedWorldPercent"] for s in late]),
        "late_slowed_population_percent": pct(sum(s["matrixSlowedCells"] for s in late), sum(s["population"] for s in late)),
        "late_impaired_population_percent": pct(sum(s["impairedCells"] for s in late), sum(s["population"] for s in late)),
        "late_effort_samples": effort,
        "max_abs_energy_error_percent": max(abs(s["energyResidualPercent"]) for s in series),
        "max_abs_material_error_percent": max(abs(s["materialResidualPercent"]) for s in series),
    }


def compare_initial(root, seed):
    live = json.loads((root / f"live-{seed}" / "initial.json").read_text())
    frozen = json.loads((root / f"frozen-{seed}" / "initial.json").read_text())
    differences = {key: [live["config"][key], frozen["config"][key]]
                   for key in live["config"] if live["config"][key] != frozen["config"][key]}
    live.pop("config")
    frozen.pop("config")
    return {"seed": seed, "identical_initial_world_except_config": live == frozen,
            "config_differences": differences}


def plot(root):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(2, 3, figsize=(13, 7), sharex=True)
    for column, seed in enumerate((101, 202, 303)):
        for arm, color in (("live", "#167d9a"), ("frozen", "#ba722e")):
            data = json.loads((root / f"{arm}-{seed}" / "result.json").read_text())
            points = data["series"]
            axes[0, column].plot([p["tick"] for p in points],
                                 [p["population"] for p in points], color=color, label=arm)
        axes[0, column].set_title(f"Seed {seed}")
        axes[0, column].set_ylim(bottom=0)
        points = json.loads((root / f"live-{seed}" / "result.json").read_text())["series"]
        for part, label in (("core", "Core"), ("motor", "Motors"), ("defense", "Defense"),
                            ("weapon", "Toxin machinery"), ("transportB", "Food B processing")):
            values = [traits(p).get(part, {}).get("mean_change_from_founder_percent") for p in points]
            axes[1, column].plot([p["tick"] for p in points], values, label=label)
        axes[1, column].axhline(0, color="#777777", linestyle=":", linewidth=1)
        axes[1, column].set_xlabel("Tick")
        for row in range(2):
            axes[row, column].axvspan(40000, 50000, color="#999999", alpha=0.10)
            axes[row, column].grid(alpha=0.2)
    axes[0, 0].set_ylabel("Living population")
    axes[1, 0].set_ylabel("Mean inherited target change\nfrom founder (%)")
    axes[0, 0].legend(fontsize=8)
    axes[1, 0].legend(fontsize=7)
    fig.suptitle("50k current-default runs: population dynamics and inherited targets\n"
                 "Lower row: live inheritance; frozen targets remain at 0% change")
    fig.tight_layout()
    fig.savefig(root / "population-trends.png", dpi=160)
    plt.close(fig)


def main(root):
    runs = [report_run(root / f"{arm}-{seed}") for seed in (101, 202, 303) for arm in ("live", "frozen")]
    result = {"analysis_source_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "sample_cadence_ticks": 500, "late_window": [40000, 50000],
              "initial_pair_checks": [compare_initial(root, seed) for seed in (101, 202, 303)],
              "runs": runs, "pairs": paired_dynamics(root)}
    (root / "analysis.json").write_text(json.dumps(result, indent=2))
    plot(root)
    print(json.dumps({"runs": len(runs), "ticks": sum(r["tick"] for r in runs),
                      "output": str(root / "analysis.json")}))


def paired_dynamics(root):
    pairs = []
    for seed in (101, 202, 303):
        arms = [json.loads((root / f"{arm}-{seed}" / "result.json").read_text())
                for arm in ("live", "frozen")]
        late = [[s for s in a["series"] if s["tick"] > 40000] for a in arms]
        populations = [[s["population"] for s in samples] for samples in late]
        pairs.append({"seed": seed,
                      "late_mean_population_change_percent": 100*(mean(populations[0])/mean(populations[1])-1),
                      "late_population_correlation": statistics.correlation(*populations),
                      "late_samples_with_larger_live_population_percent": pct(
                          sum(a>b for a,b in zip(*populations)), len(populations[0])),
                      "identical_external_input_at_each_sample": all(
                          a["supplied"] == b["supplied"] for a,b in zip(arms[0]["series"], arms[1]["series"]))})
    return pairs


if __name__ == "__main__":
    main(Path(sys.argv[1]))
