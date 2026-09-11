"""Analyze the registered food-epoch campaign and population assays.

python3 harness/epoch_report.py [artifact-root]
Only generated analysis and figures are written. Independent seeds are the unit
of replication; times and placement swaps are not independent replicates.
"""
import hashlib
import json
import random
import statistics
import sys
from pathlib import Path

from epoch_batch import SEEDS
from population_report import compare_initial, late_budget, mean, pct, traits


def read(path):
    return json.loads(path.read_text())


def interval(values):
    """Descriptive seed-bootstrap interval for the mean, not a tick-level test."""
    values = [v for v in values if v is not None]
    if not values:
        return None
    rng = random.Random(91731)
    draws = sorted(statistics.mean(rng.choices(values, k=len(values))) for _ in range(10000))
    return {"n_seeds": len(values), "mean": mean(values), "median": statistics.median(values),
            "range": [min(values), max(values)], "bootstrap_mean_95_percent": [draws[249], draws[9749]]}


def phase_summary(data, phase):
    start, end = phase * 50000, (phase + 1) * 50000
    series, observations = data["series"], data["observations"]
    if series[-1]["tick"] != data["final"]["tick"]:
        series = [*series, data["final"]]
    late = [s for s in series if end - 10000 < s["tick"] <= end]
    first = next((p for p in observations if p["tick"] == end - 10000), None)
    last = next((p for p in observations if p["tick"] == end), None)
    boundary = next((s for s in series if s["tick"] == end), None)
    prior = [s["population"] for s in series if start - 10000 < s["tick"] <= start]
    early = [s["population"] for s in series if start < s["tick"] <= start + 10000]
    return {
        "phase": phase + 1, "window": [end - 10000, end], "complete": last is not None,
        "late_population_mean": mean([s["population"] for s in late]),
        "late_biomass_mean": mean([s["biomass"] for s in late]),
        "early_min_population": min(early) if early else None,
        "early_min_change_from_prior_mean_percent":
            pct(min(early) - mean(prior), mean(prior)) if early and prior else None,
        "late_change_from_prior_mean_percent":
            pct(mean([s["population"] for s in late]) - mean(prior), mean(prior))
            if late and prior else None,
        "late_budget": late_budget(first["ledger"], last["ledger"]) if first and last else None,
        "generation": boundary["maxGeneration"] if boundary else None,
        "traits": traits(boundary) if boundary else None,
        "investments": last["traits"] if last else None,
        "born_in_last_10k_percent": pct(sum(c["born"] > end - 10000 for c in last["cells"]),
                                        len(last["cells"])) if last else None,
        "half_speed_world_percent": mean([s["matrixHalfSpeedWorldPercent"] for s in late]),
        "slowed_population_percent": pct(sum(s["matrixSlowedCells"] for s in late),
                                           sum(s["population"] for s in late)),
    }


def run_summary(root, seed, arm):
    directory = root / f"{arm}-{seed}"
    manifest = read(directory / "manifest.json")
    if manifest["status"] != "complete":
        raise ValueError(f"Incomplete population run: {directory}")
    data = read(directory / "result.json")
    return {
        "seed": seed, "arm": arm, "tick": data["final"]["tick"], "ledger": data["ledgerId"],
        "stop_reason": data["final"]["stopReason"],
        "stable_source": manifest["sourceDigest"] == manifest["sourceDigestAfter"],
        "source": manifest["sourceDigest"],
        "wall_seconds": data["wallMs"] / 1000,
        "phases": [phase_summary(data, i) for i in range(3)],
        "max_abs_energy_residual_percent": max(abs(s["energyResidualPercent"]) for s in data["series"]),
        "max_abs_material_residual_percent": max(abs(s["materialResidualPercent"]) for s in data["series"]),
    }


def pairs(root, runs):
    result = []
    for seed in SEEDS:
        live, frozen = [next(r for r in runs if r["seed"] == seed and r["arm"] == arm)
                        for arm in ("live", "frozen")]
        data = [read(root / f"{arm}-{seed}" / "result.json") for arm in ("live", "frozen")]
        matched = [(a, b) for a, b in zip(data[0]["observations"], data[1]["observations"])
                   if a["tick"] == b["tick"]]
        result.append({
            "seed": seed,
            "live_population_advantage_percent": [
                pct(a["late_population_mean"] - b["late_population_mean"], b["late_population_mean"])
                if a["complete"] and b["complete"] else None
                for a, b in zip(live["phases"], frozen["phases"])],
            "live_biomass_advantage_percent": [
                pct(a["late_biomass_mean"] - b["late_biomass_mean"], b["late_biomass_mean"])
                if a["complete"] and b["complete"] else None
                for a, b in zip(live["phases"], frozen["phases"])],
            "same_environment_rng_at_matched_samples": all(a["environmentRng"] == b["environmentRng"] for a, b in matched),
            "same_sources_at_matched_samples": all(a["sources"] == b["sources"] for a, b in matched),
            "max_external_input_difference": max(abs(a["ledger"]["supplied"] - b["ledger"]["supplied"])
                                                   for a, b in matched),
        })
    return result


def assays(root):
    rows = []
    for seed in SEEDS:
        for share in (0.8, 0.2):
            placements = []
            for swap in ("false", "true"):
                directory = root / f"assay-{seed}-{share}-{swap}"
                if not (directory / "manifest.json").exists():
                    continue
                manifest = read(directory / "manifest.json")
                if manifest["status"] != "complete":
                    continue
                data = read(directory / "result.json")
                late = [p for p in data["cohorts"] if p["tick"] > 10000]
                placements.append({"swap": swap, "tick": data["final"]["tick"],
                                   "stop_reason": data["final"]["stopReason"],
                                   "stable_source": manifest["sourceDigest"] == manifest["sourceDigestAfter"],
                                   "ledger": data["ledgerId"],
                                   "final_post_share_percent": data["cohorts"][-1]["postShare"],
                                   "late_post_share_percent": mean([p["postShare"] for p in late if p["postShare"] is not None])
                                   if data["final"]["tick"] == 15000 else None})
            rows.append({"seed": seed, "food_a_share": share, "placements": placements,
                         "post_share_percent": mean([p["late_post_share_percent"] for p in placements])
                         if len(placements) == 2 and all(p["late_post_share_percent"] is not None for p in placements) else None})
    contrasts = []
    for seed in SEEDS:
        a, b = [next(r["post_share_percent"] for r in rows if r["seed"] == seed and r["food_a_share"] == share)
                for share in (0.8, 0.2)]
        contrasts.append({"seed": seed, "a_post_share_percent": a, "b_post_share_percent": b,
                          "b_minus_a_percentage_points": b - a if a is not None and b is not None else None})
    return {"runs": rows, "contrasts": contrasts,
            "a_post_share": interval([c["a_post_share_percent"] for c in contrasts]),
            "b_post_share": interval([c["b_post_share_percent"] for c in contrasts]),
            "b_minus_a_percentage_points": interval([c["b_minus_a_percentage_points"] for c in contrasts])}


def plot(root):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(4, 3, figsize=(13, 11), sharex=True, sharey=True)
    peak = 0
    for axis, seed in zip(axes.flat, SEEDS):
        for arm, color in (("live", "#167d9a"), ("frozen", "#ba722e")):
            data = read(root / f"{arm}-{seed}" / "result.json")
            peak = max(peak, max(s["population"] for s in data["series"]))
            axis.plot([s["tick"] / 1000 for s in data["series"]],
                      [s["population"] for s in data["series"]], color=color, label=arm, linewidth=1)
        axis.axvspan(50, 100, color="#816caf", alpha=0.13)
        axis.set_title(f"Seed {seed}", fontsize=10)
        axis.grid(alpha=0.2)
    for axis in axes.flat:
        axis.set_ylim(0, peak * 1.05)
    axes[0, 0].legend(fontsize=8)
    for axis in axes[-1, :]:
        axis.set_xlabel("Tick (thousands)")
    for axis in axes[:, 0]:
        axis.set_ylabel("Living population")
    fig.suptitle("Food epochs: A-rich → B-rich (shaded) → A-rich\nMatched environment schedules; live versus fixed inherited genomes")
    fig.tight_layout()
    fig.savefig(root / "epoch-populations.png", dpi=150)
    plt.close(fig)


def plot_assays(root, result):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    for row in result["contrasts"]:
        a, b = row["a_post_share_percent"], row["b_post_share_percent"]
        if a is None or b is None:
            continue
        axes[0].plot([0, 1], [a, b], marker="o", linewidth=1, alpha=0.7, label=str(row["seed"]))
        axes[1].scatter(row["seed"], b - a, color="#167d9a")
    axes[0].axhline(50, color="#777777", linestyle=":")
    axes[0].set_xticks([0, 1], ["A-rich", "B-rich"])
    axes[0].set_ylim(0, 100)
    axes[0].set_ylabel("Post-B cohort share of living cells (%)")
    axes[1].axhline(0, color="#777777", linestyle=":")
    axes[1].set_xlabel("Source population seed")
    axes[1].set_ylabel("B-rich minus A-rich advantage\n(percentage points)")
    for axis in axes:
        axis.grid(alpha=0.2)
    fig.suptitle("Inherited pre/post-B populations in fresh worlds\nMean share over ticks 10,500–15,000; two placement assignments averaged")
    fig.tight_layout()
    fig.savefig(root / "epoch-assays.png", dpi=160)
    plt.close(fig)


def main(root):
    runs = [run_summary(root, seed, arm) for seed in SEEDS for arm in ("live", "frozen")]
    comparisons = pairs(root, runs)
    result = {
        "analysis_sources_sha256": {name: hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                                    for name in ("epoch_report.py", "population_report.py", "epoch_batch.py")},
        "population_ticks": sum(r["tick"] for r in runs), "runs": runs,
        "initial_pair_checks": [compare_initial(root, seed) for seed in SEEDS],
        "pairs": comparisons,
        "paired_population_advantage_percent": [interval([p["live_population_advantage_percent"][i] for p in comparisons]) for i in range(3)],
        "paired_biomass_advantage_percent": [interval([p["live_biomass_advantage_percent"][i] for p in comparisons]) for i in range(3)],
        "assays": assays(root),
    }
    (root / "analysis.json").write_text(json.dumps(result, indent=2))
    plot(root)
    plot_assays(root, result["assays"])
    print(json.dumps({"ticks": result["population_ticks"],
                      "population_advantage": result["paired_population_advantage_percent"],
                      "assay_contrast": result["assays"]["b_minus_a_percentage_points"]}))


if __name__ == "__main__":
    main(Path(sys.argv[1] if len(sys.argv) > 1 else "harness/artifacts/epochs-2026-09-11"))
