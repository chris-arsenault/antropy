"""Bounded paired feature comparisons using the existing native operator API."""
import argparse
import copy
import json
import math
import subprocess
import time
from pathlib import Path

from native_run import Operator, config_matches, merge


ARMS = {
    "reference": {},
    "reference-repeat": {},
    "reinforcement-off": {"activityReinforcement": False},
    "emission-off": {"activity": {"emission": False}},
    "photoreception-off": {"activity": {"photoreception": False}},
    "cover-off": {"activity": {"cover": False}},
    "shade-off": {"geographicShade": False},
    "speech-off": {"speech": False},
    "content-off": {"hearingContent": False},
    "bearing-off": {"hearingBearing": False},
    "listening-off": {"listening": False},
    "vocalization-off": {"activity": {"vocalization": False}},
    "recovery-off": {"mortalityRecovery": False},
    "global-recovery": {"mortalityLocal": False},
    "context-off": {"strategicContext": False},
    "gain-off": {"strategicGain": False},
    "strategy-off": {"activity": {"strategy": False}},
    "strategic-learning-off": {"strategicLearning": False},
    "reflex-learning-off": {"reflexLearning": False},
    "retention-off": {"learningRetention": 0.0},
    "static-learning": {"learning": "static"},
    "context-clamp": {},
}

# Registered after the independent screen; use its existing matched three corners.
INTERACTIONS = {"reinforcement-gain-off": {
    "activityReinforcement": False, "strategicGain": False}}


def write(path, value):
    with path.open("x") as out:
        json.dump(value, out, separators=(",", ":"))
        out.write("\n")


def checked_status(client, generation):
    status = client.request("/api/status")
    if status["generation"] != generation:
        raise RuntimeError("World generation changed during comparison")
    return status


def restore(client, anchor):
    status = client.request("/api/status")
    result = client.request("/api/checkpoints/" + anchor + "/load", {
        "generation": status["generation"], "running": False})
    status = result["status"]
    if status["running"] or status["runControls"]["pending"]:
        raise RuntimeError("Anchor must restore paused without pending configuration")
    return status


def configure(client, status, patch):
    expected = copy.deepcopy(status["config"])
    merge(expected, patch)
    generation = status["generation"]
    result = client.control(generation, "configure", {
        "patch": patch, "revision": status["runControls"]["revision"]})
    status = result["status"]
    # Settle the old unfinished interval with ordinary existing single-step controls.
    for _ in range(32):
        if status["runControls"]["pending"] is None:
            break
        status = client.control(generation, "step", {})["status"]
    if status["runControls"]["pending"] or not config_matches(expected, status["config"]):
        raise RuntimeError("Patch did not become effective at its declared boundary")
    return status


def interval(before, after):
    a, b = before["ledger"], after["ledger"]
    flows = {key: value - a["flows"][key] for key, value in b["flows"].items()}
    expenses = sum(flows[key] for key in [
        "maintenance", "motors", "transport", "repair", "learning", "growth",
        "coverWork", "speechWork", "emission"])
    result = {
        "fromTick": before["tick"], "toTick": after["tick"],
        "modelSeconds": after["modelSeconds"] - before["modelSeconds"],
        "populationBefore": before["population"], "populationAfter": after["population"],
        "biomassChange": after["biomass"] - before["biomass"],
        "reserveChange": after["cellEnergy"] - before["cellEnergy"],
        "flows": flows, "operatingMargin": flows["captured"] - expenses,
        "divisions": b["divisions"] - a["divisions"],
        "deaths": b["deaths"] - a["deaths"],
        "supplied": b["supplied"] - a["supplied"],
        "released": b["sourceReleased"] - a["sourceReleased"],
        "opticalCaptured": b["opticalCaptured"] - a["opticalCaptured"],
        "recovered": after["mortality"]["recovered"] - before["mortality"]["recovered"],
    }
    result["marginAfterDivision"] = result["operatingMargin"] - (
        b["divisionHeat"] - a["divisionHeat"])
    result["overflowHeat"] = b["overflowHeat"] - a["overflowHeat"]
    result["deathHeat"] = b["deathHeat"] - a["deathHeat"]
    # captured is positive reaction work, not the signed reaction balance. During an
    # uninterrupted world interval, the remaining usable-energy debit is uphill work.
    result["uphillWorkDerived"] = result["marginAfterDivision"] - (
        result["reserveChange"] + result["overflowHeat"] + result["deathHeat"])
    result["netWorkAfterDivision"] = result["marginAfterDivision"] - result["uphillWorkDerived"]
    result["marginMeaning"] = (
        "marginAfterDivision excludes uphill reaction spending and overflow/death heat; "
        "netWorkAfterDivision includes uphill spending but excludes overflow/death losses; "
        "reserveChange measures retained usable work. Derivation assumes no usable-work intervention.")
    return result


def observe(client, generation, seconds, wall_seconds, path):
    start = client.request("/api/ecology")["current"]
    write(path / "before.json", start)
    write(path / "effective.json", checked_status(client, generation))
    target = start["tick"] + math.ceil(seconds / checked_status(client, generation)["config"]["dt"])
    started = time.monotonic()
    client.control(generation, "running", {"value": True})
    reason = "model-time window"
    samples = []
    while True:
        status = checked_status(client, generation)
        samples.append({key: status[key] for key in ["tick", "population", "running", "stopReason"]})
        if status["stopReason"] or not status["population"]:
            reason = "terminal outcome"
            break
        if status["tick"] >= target:
            break
        if time.monotonic() - started >= wall_seconds:
            reason = "wall cap"
            break
        elapsed = max(time.monotonic() - started, 1e-3)
        rate = max((status["tick"] - start["tick"]) / elapsed, 1.0)
        time.sleep(min(0.5, max(0.01, (target - status["tick"]) / rate / 4)))
    client.control(generation, "running", {"value": False})
    write(path / "samples.json", samples)
    subprocess.run([
        "pnpm", "--dir", "frontend", "harness", "server-review", "--checkpoint", "none",
        "--server", client.base, "--output",
        str((path / "capture").relative_to(Path("frontend").resolve()))], check=True)
    end = json.loads((path / "capture" / "ecology.json").read_text())["current"]
    result = interval(start, end)
    result.update({"reason": reason, "wallSeconds": time.monotonic() - started,
                   "requestedModelSeconds": seconds, "overshootTicks": max(0, end["tick"] - target)})
    write(path / "interval.json", result)
    return result


def run_arm(client, anchor, name, seconds, wall_seconds, root):
    path = root / name
    path.mkdir()
    status = restore(client, anchor)
    write(path / "restored.json", status)
    patch = (ARMS.get(name) if name in ARMS else INTERACTIONS[name]) or {
        "activityReinforcement": status["config"]["activityReinforcement"]}
    status = configure(client, status, patch)
    client.control(status["generation"], "strategyAblation", {"enabled": name == "context-clamp"})
    write(path / "patch.json", {"patch": patch, "contextClamp": name == "context-clamp"})
    result = observe(client, status["generation"], seconds, wall_seconds, path)
    print(json.dumps({"arm": name, **{key: result[key] for key in [
        "modelSeconds", "populationAfter", "biomassChange", "marginAfterDivision", "reason"]}}), flush=True)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--anchor", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--arms", nargs="+", choices=[*ARMS, *INTERACTIONS], default=list(ARMS))
    parser.add_argument("--seconds", type=float, default=120)
    parser.add_argument("--wall-seconds", type=float, default=180)
    parser.add_argument("--base", default="http://192.168.66.3:8095")
    args = parser.parse_args()
    if not 0 < args.seconds <= 300 or not 0 < args.wall_seconds <= 180:
        parser.error("Outside the registered screen's model-time/wall ceilings")
    root = args.output.resolve()
    allowed = Path("frontend/harness/artifacts").resolve()
    if allowed not in root.parents:
        parser.error("Output must be inside ignored frontend/harness/artifacts")
    root.mkdir(parents=True, exist_ok=False)
    client = Operator(args.base)
    status = client.request("/api/status")
    write(root / "registration.json", {
        "anchor": args.anchor, "arms": args.arms, "modelSeconds": args.seconds,
        "wallSecondsPerArm": args.wall_seconds, "initialStatus": status,
        "protocol": "docs/plans/CHECKPOINT-ANALYSIS-PLAN.md", "startedAt": time.time(),
        "sourceRevision": subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()})
    results = {}
    began = time.monotonic()
    for name in args.arms:
        if time.monotonic() - began > 75 * 60:
            raise RuntimeError("Registered total screen wall cap reached")
        results[name] = run_arm(client, args.anchor, name, args.seconds, args.wall_seconds, root)
        write(root / (name + ".json"), results[name])
    restored = restore(client, args.anchor)
    resumed = client.control(restored["generation"], "running", {"value": True})
    write(root / "completed.json", {"results": results, "finalStatus": resumed["status"]})


if __name__ == "__main__":
    main()
