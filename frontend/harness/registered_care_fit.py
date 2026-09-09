"""Isolate corrective learning to physical care readout weights, without runtime rules."""
import torch


def physical_rows(gradient):
    result = gradient.clone()
    result[5:] = 0
    return result


def freeze_except_physical_care(model):
    original = {name: value.detach().clone() for name, value in model.named_parameters()}
    for parameter in model.parameters():
        parameter.requires_grad_(False)
    for parameter in (model.care.weight, model.care.bias):
        parameter.requires_grad_(True)
        parameter.register_hook(physical_rows)
    return original


def verify_frozen(model, original):
    for name, parameter in model.named_parameters():
        actual, expected = parameter.detach(), original[name]
        if name in ("care.weight", "care.bias"):
            actual, expected = actual[5:], expected[5:]
        if not torch.equal(actual, expected):
            raise ValueError(f"isolated care fit changed frozen weights: {name}")
    return {"frozenWeightsUnchanged": True,
            "effectiveTrainableParameters": 5 * (model.hidden + 1)}
