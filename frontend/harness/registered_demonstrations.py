"""Memory-mapped recurrent demonstration replay without discarding earlier trajectories."""
import numpy as np
import torch

from registered_replay_priority import priority_buckets, sample_sequences


class Demonstrations:
    def __init__(self, path, model):
        self.path = str(path)
        self.inputs, self.offset = model.inputs, model.inputs + model.hidden
        self.rows = np.memmap(path, dtype="<f4", mode="r").reshape(-1, self.offset + 7)
        groups = {}
        for index, row in enumerate(self.rows):
            groups.setdefault(tuple(row[self.offset + 4:self.offset + 6]), []).append(index)
        self.sequences = torch.tensor([part[start:start + 32] for part in groups.values()
                                      for start in range(0, len(part) - 31, 32)], dtype=torch.long)
        self.motor_counts = np.bincount(self.rows[:, self.offset].astype(int), minlength=8)
        self.task_counts = np.bincount(self.rows[:, self.offset + 1].astype(int), minlength=9)
        self.priorities = {}

    def prepare_priorities(self, model):
        self.priorities = priority_buckets(self, model)
        return {motor: len(indices) for motor, indices in self.priorities.items()}

    def batch(self, care_fraction=0):
        indices = sample_sequences(self.sequences, self.priorities, care_fraction)
        x = torch.from_numpy(self.rows[indices, :self.inputs].copy())
        state = torch.from_numpy(self.rows[indices[:, 0], self.inputs:self.offset].copy())
        targets = torch.from_numpy(self.rows[indices, self.offset:self.offset + 4].copy()).flatten(0, 1)
        return x, state, targets


def weights_for(datasets, attribute, cap):
    counts = torch.tensor(np.sum([getattr(data, attribute) for data in datasets], 0)).clamp_min(1)
    return (counts.max() / counts).sqrt().clamp_max(cap), counts


def stage_datasets(retained, collected, policy):
    """Explicit replay remains present even when the assistance curriculum uses its latest stage."""
    if policy not in ("all", "latest"):
        raise ValueError("unknown stage data policy")
    return retained + (collected[-1:] if policy == "latest" else collected)
