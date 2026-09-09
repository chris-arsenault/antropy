"""Paired offline fit: reuse a completed single-stage control's exact replay datasets."""
import argparse
import json
import time
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import torch

from registered_artifacts import capture_sources, file_digest as digest
from registered_demonstrations import Demonstrations
from registered_care_fit import freeze_except_physical_care, verify_frozen
from registered_conditional_fit import fit_conditional
from registered_network import RegisteredNetwork
from train_registered import record, save
from train_registered_teaching import fit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--control", type=Path, required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--care-replay-fraction", type=float, default=0.5)
    parser.add_argument("--care-only", action="store_true")
    parser.add_argument("--conditional-care", action="store_true")
    cli = parser.parse_args()
    if not 0 <= cli.care_replay_fraction <= 1:
        raise ValueError("care replay fraction must be between zero and one")
    if cli.conditional_care and (cli.care_only or cli.care_replay_fraction):
        raise ValueError("conditional care requires ordinary sampling and all parameters trainable")
    control = json.loads((cli.control / "training.json").read_text())
    if len(control["stages"]) != 1 or control["stages"][0]["assistance"] != 0:
        raise ValueError("paired replay requires one completed autonomous control stage")
    settings = control["settings"]
    if digest(settings["initial"]) != settings["initialHash"]:
        raise ValueError("control initializer changed")
    for path, expected in settings["replayHashes"].items():
        if digest(path) != expected:
            raise ValueError("retained control data changed")
    if digest(cli.control / "stage-0.f32") != control["stages"][0]["dataHash"]:
        raise ValueError("control collection changed")
    output = Path(cli.output)
    output.mkdir(parents=True, exist_ok=False)
    args = SimpleNamespace(**(settings | {
        "output": cli.output, "care_replay_fraction": cli.care_replay_fraction,
        "careOnly": cli.care_only,
        "conditionalCare": cli.conditional_care,
        "pairedControl": str(cli.control), "sourceHashes": capture_sources(output),
    }))
    torch.set_num_threads(2)
    torch.manual_seed(args.seed)
    model = RegisteredNetwork(gated=args.gated, temperature=args.temperature)
    model.load(args.initial)
    original = freeze_except_physical_care(model) if cli.care_only else None
    paths = [*args.replay, str(cli.control / "stage-0.f32")]
    args.dataHashes = {path: digest(path) for path in paths}
    datasets = [Demonstrations(path, model) for path in paths]
    optimizer = torch.optim.Adam(model.parameters(), lr=args.rate)
    started = time.monotonic()
    metrics = (fit_conditional if cli.conditional_care else fit)(model, datasets, optimizer, args)
    if original is not None:
        metrics.update(verify_frozen(model, original))
    rows = np.fromfile(paths[-1], dtype="<f4", count=16 * (model.inputs + model.hidden + 7))
    save(model, output / "stage-1.json", rows.reshape(-1, model.inputs + model.hidden + 7))
    report = {"settings": vars(args).copy(), "metrics": metrics, "newCollectedFrames": 0,
              "modelHash": digest(output / "stage-1.json")}
    (output / "replay-fit.json").write_text(json.dumps(report))
    args.iterations = 0  # Offline fitting simulates no new ticks.
    record(args, report, time.monotonic() - started, method="paired-offline-replay")
    print(json.dumps({"output": str(output), "metrics": metrics}), flush=True)


if __name__ == "__main__":
    main()
