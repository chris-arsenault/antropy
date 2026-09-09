"""Training-only sampling of recurrent sequences containing mistaken care decisions."""
import torch


CARE_MOTORS = (4, 5, 6, 7)


def care_mistakes(logits, targets):
    actual = logits[..., :8].argmax(-1)
    expected = targets[..., 0].long()
    wrong = actual != expected
    return {motor: (wrong & ((actual == motor) | (expected == motor))).any(-1)
            for motor in CARE_MOTORS}


def priority_buckets(dataset, model):
    buckets = {motor: [] for motor in CARE_MOTORS}
    with torch.no_grad():
        for start in range(0, len(dataset.sequences), 64):
            indices = dataset.sequences[start:start + 64].numpy()
            x = torch.from_numpy(dataset.rows[indices, :dataset.inputs].copy())
            state = torch.from_numpy(dataset.rows[indices[:, 0], dataset.inputs:dataset.offset].copy())
            targets = torch.from_numpy(dataset.rows[indices, dataset.offset:dataset.offset + 4].copy())
            logits, _ = model(x, state)
            for motor, mask in care_mistakes(logits, targets).items():
                buckets[motor].append(torch.where(mask)[0] + start)
    return {motor: torch.cat(parts) for motor, parts in buckets.items() if parts}


def sample_sequences(sequences, buckets, fraction):
    if not 0 <= fraction <= 1:
        raise ValueError("care replay fraction must be between zero and one")
    chosen = torch.randint(len(sequences), (64,))
    available = [indices for indices in buckets.values() if len(indices)]
    if available:
        for index in range(int(64 * fraction)):
            bucket = available[int(torch.randint(len(available), ()))]
            chosen[index] = bucket[int(torch.randint(len(bucket), ()))]
    return sequences[chosen].numpy()
