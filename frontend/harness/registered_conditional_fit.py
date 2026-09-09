"""Training-only local care correction with frozen-policy preservation elsewhere."""
import copy

import torch
from torch import nn

from registered_demonstrations import weights_for


def correction_targets(x, targets, baseline):
    """Teacher roles locate care frames; they never route the deployed network."""
    writes = targets[:, 1].long()
    current = x[..., -8:].flatten(0, 1).argmax(-1)
    role = torch.where(writes == 0, current, writes - 1)
    motor = targets[:, 0].long()
    care = (role == 2) | (role == 7) | (motor >= 4)
    # Preserve relative navigation preferences while removing premature care actions.
    physical = torch.zeros_like(baseline[:, :8])
    physical[:, :4] = baseline[:, :4].softmax(-1)
    physical[care] = nn.functional.one_hot(motor[care], 8).float()
    return physical, care


def correction_loss(logits, baseline, x, targets, weights):
    physical, care = correction_targets(x, targets, baseline)
    row_weights = torch.where(care, weights[targets[:, 0].long()], 1.0)
    motor_loss = -(physical * logits[:, :8].log_softmax(-1)).sum(-1)
    motor_loss = (motor_loss * row_weights).sum() / row_weights.sum()
    task_loss = -(baseline[:, 10:].softmax(-1) * logits[:, 10:].log_softmax(-1)).sum(-1).mean()
    secretion_loss = nn.functional.binary_cross_entropy_with_logits(
        logits[:, 8:10], baseline[:, 8:10].sigmoid())
    return motor_loss + 0.3 * task_loss + 0.2 * secretion_loss


def fit_conditional(model, datasets, optimizer, args):
    if model.tasks != 8:
        raise ValueError("conditional correction requires the eight-value teaching convention")
    baseline = copy.deepcopy(model).eval().requires_grad_(False)
    weights, counts = weights_for(datasets, "motor_counts", 20)
    losses = []
    for epoch in range(args.epochs):
        total = 0.0
        for _ in range(args.batches):
            dataset = datasets[int(torch.randint(len(datasets), ()))]
            x, state, targets = dataset.batch()
            with torch.no_grad():
                reference, _ = baseline(x, state)
            logits, _ = model(x, state)
            loss = correction_loss(logits.flatten(0, 1), reference.flatten(0, 1), x, targets, weights)
            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5)
            optimizer.step()
            total += float(loss.detach())
        losses.append(total / args.batches)
        print(f"conditional epoch {epoch + 1}: {losses[-1]:.6f}", flush=True)
    return {"losses": losses, "motorCounts": counts.tolist(),
            "objective": "local-care-and-frozen-navigation-task-distillation-v1"}
