"""Recurrent PPO updates using exact actor state and colony-wide physical rewards."""
import numpy as np
import torch
from torch import nn

from registered_network import policy_statistics


class Critic(nn.Module):
    def __init__(self, inputs, hidden):
        super().__init__()
        self.network = nn.Sequential(nn.Linear(inputs + hidden, 64), nn.Tanh(), nn.Linear(64, 1))

    def forward(self, x, state):
        return self.network(torch.cat((x, state), -1)).squeeze(-1)


def groups_for(rows, offset):
    groups = {}
    for index, row in enumerate(rows):
        groups.setdefault((int(row[offset + 5]), int(row[offset + 6])), []).append(index)
    return groups


def advantages(rows, model, critic, metadata, gamma, trace):
    offset = model.inputs + model.hidden
    x = torch.from_numpy(rows[:, :model.inputs].copy())
    states = torch.from_numpy(rows[:, model.inputs:offset].copy())
    groups = groups_for(rows, offset)
    with torch.no_grad():
        values = critic(x, states).numpy()
        bootstrap = {(item["caseId"], item["id"]): float(critic(torch.tensor(item["inputs"]),
                     torch.tensor(item["state"]))) for item in metadata["bootstrap"]}
    advantage = np.zeros(len(rows), dtype=np.float32)
    for key, indices in groups.items():
        next_value, carry = bootstrap.get(key, 0.0), 0.0
        for index in reversed(indices):
            alive = 1 - rows[index, offset + 4]
            delta = rows[index, offset + 3] + gamma * next_value * alive - values[index]
            carry = delta + gamma * trace * alive * carry
            advantage[index] = carry
            next_value = values[index]
    return x, states, torch.from_numpy(advantage), torch.from_numpy(advantage + values), groups


def update(model, critic, optimizer, rows, metadata, args):
    offset = model.inputs + model.hidden
    x, states, advantage, returns, groups = advantages(rows, model, critic, metadata, args.gamma, args.trace)
    raw_std = float(advantage.std())
    advantage = (advantage - advantage.mean()) / advantage.std().clamp_min(1e-6)
    target = torch.from_numpy(rows[:, offset:offset + 3].copy())
    # Keep consecutive worker decisions; recorded hidden state starts each BPTT segment.
    sequences = [indices[start:start + args.sequence] for indices in groups.values()
                 for start in range(0, len(indices) - args.sequence + 1, args.sequence)]
    sequences = torch.tensor(sequences, dtype=torch.long)
    if len(sequences) == 0:
        raise ValueError("rollout contains no full recurrent sequences")
    with torch.no_grad():
        logits, _ = model(x[:128, None], states[:128])
        logp, _ = policy_statistics(logits[:, 0], target[:128, 0].long(), target[:128, 1].long(), model.temperature)
        parity_error = float((logp - target[:128, 2]).abs().max())
    if parity_error > 1e-4:
        raise ValueError(f"rollout likelihood disagrees with PyTorch: {parity_error}")
    metrics = []
    for epoch in range(args.epochs):
        order = torch.randperm(len(sequences))
        for start in range(0, len(order), args.batch):
            indices = sequences[order[start:start + args.batch]]
            logits, _ = model(x[indices], states[indices[:, 0]])
            logp, entropy = policy_statistics(logits, target[indices, 0].long(), target[indices, 1].long(), model.temperature)
            ratio = (logp - target[indices, 2]).exp()
            actor_loss = -torch.minimum(ratio * advantage[indices], ratio.clamp(0.8, 1.2) * advantage[indices]).mean()
            value_loss = nn.functional.smooth_l1_loss(critic(x[indices], states[indices]), returns[indices])
            loss = actor_loss + 0.5 * value_loss - args.entropy * entropy.mean()
            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(list(model.parameters()) + list(critic.parameters()), 0.5)
            optimizer.step()
            with torch.no_grad():
                kl = float(((ratio - 1) - (logp - target[indices, 2])).mean())
            metrics.append([float(actor_loss.detach()), float(value_loss.detach()), float(entropy.mean().detach()), kl])
        if metrics[-1][3] > 0.03:
            break
    return {"actorLoss": np.mean(metrics, 0)[0], "criticLoss": np.mean(metrics, 0)[1],
            "entropy": np.mean(metrics, 0)[2], "kl": np.mean(metrics, 0)[3],
            "advantageStd": raw_std, "likelihoodParity": parity_error, "batches": len(metrics)}
