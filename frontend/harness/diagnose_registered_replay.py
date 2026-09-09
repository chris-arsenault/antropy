"""Read-only decision audit on recorded local frames and their exact behavior-policy states.

Teacher agreement diagnoses errors; it does not certify colony survival. Supply the model
that collected the dataset, not the model fitted afterward.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import torch

from registered_network import RegisteredNetwork


def digest(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def audit(model, rows):
    offset = model.inputs + model.hidden
    worlds = {}
    for start in range(0, len(rows), 2048):
        batch = rows[start:start + 2048]
        x = torch.from_numpy(batch[:, :model.inputs].copy()).unsqueeze(1)
        state = torch.from_numpy(batch[:, model.inputs:offset].copy())
        with torch.no_grad():
            logits, _ = model(x, state)
        actual = logits[:, 0, :8].argmax(-1).numpy()
        target = batch[:, offset].astype(int)
        # Contact channels are open, food, edible, hungry, queen, at eight bearings.
        loaded = batch[:, 82] > 0
        hungry = batch[:, [36 + 5 * i for i in range(8)]].any(axis=1)
        front_hungry = batch[:, 36] > 0
        for identity in np.unique(batch[:, offset + 4]).astype(int):
            mask = batch[:, offset + 4] == identity
            counters = worlds.setdefault(int(identity), {
                "rows": 0, "confusion": np.zeros((8, 8), dtype=np.int64),
                "loadedRecipientContacts": 0, "loadedFrontRecipientContacts": 0,
                "feedsFacingRecipient": 0, "emptyFeeds": 0,
            })
            counters["rows"] += int(mask.sum())
            np.add.at(counters["confusion"], (target[mask], actual[mask]), 1)
            counters["loadedRecipientContacts"] += int((mask & loaded & hungry).sum())
            counters["loadedFrontRecipientContacts"] += int((mask & loaded & front_hungry).sum())
            counters["feedsFacingRecipient"] += int((mask & loaded & front_hungry & (actual == 6)).sum())
            counters["emptyFeeds"] += int((mask & ~loaded & (actual == 6)).sum())
    return {key: value | {"confusion": value["confusion"].tolist()} for key, value in worlds.items()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True)
    parser.add_argument("--data", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    output = Path(args.output)
    if output.exists():
        raise ValueError("diagnostic output already exists")
    settings = json.loads(Path(args.model).read_text())
    if settings["temperature"] != 0:
        raise ValueError("exact executed argmax audit requires a deterministic collector")
    torch.set_num_threads(2)
    model = RegisteredNetwork(gated=settings["gated"], temperature=0)
    model.load(args.model)
    rows = np.memmap(args.data, dtype="<f4", mode="r").reshape(-1, model.inputs + model.hidden + 7)
    report = {
        "model": args.model, "modelHash": digest(args.model), "data": args.data,
        "dataHash": digest(args.data), "diagnosticSourceHash": digest(__file__),
        "motors": ["idle", "left", "right", "move", "pickup", "eat", "feed", "release"],
        "confusionAxes": ["teacher", "learner"], "worlds": audit(model, rows),
    }
    output.write_text(json.dumps(report, indent=2))
    print(json.dumps(report), flush=True)


if __name__ == "__main__":
    main()
