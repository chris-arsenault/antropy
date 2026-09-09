"""Shared recurrent actor with a private categorical register and optional sensory modulation."""
import json
from pathlib import Path

import torch
from torch import nn

from directional_network import DirectionalNetwork, GLOBALS, samples


class RegisteredNetwork(DirectionalNetwork):
    def __init__(self, history=4, hidden=64, embedding=16, tasks=8, gated=False, temperature=1.0):
        super().__init__(history, hidden, embedding)
        self.tasks, self.gated, self.temperature = tasks, gated, temperature
        self.recurrent = True
        self.inputs += tasks
        self.task_context = nn.Linear(tasks, hidden)
        self.task_gate = nn.Linear(tasks, 26)
        self.task_head = nn.Linear(hidden, tasks + 1)
        nn.init.normal_(self.task_context.weight, std=0.01)
        nn.init.zeros_(self.task_context.bias)
        nn.init.zeros_(self.task_gate.weight)
        nn.init.zeros_(self.task_gate.bias)
        nn.init.normal_(self.task_head.weight, std=0.01)
        nn.init.zeros_(self.task_head.bias)
        with torch.no_grad():
            self.task_head.bias[0] = 3.0

    def forward(self, x, state=None):
        task = x[..., 111 + 8 * self.history:]
        gate = 2 * torch.sigmoid(self.task_gate(task)) if self.gated else torch.ones((*task.shape[:-1], 26))
        encoded = torch.tanh(self.encoder(samples(x) * gate[..., None, :16]))
        context = torch.cat((encoded.flatten(-2), x[..., GLOBALS] * gate[..., 16:],
                             x[..., 111:111 + 8 * self.history]), -1)
        drive = nn.functional.linear(context, self.rnn.weight_ih_l0, self.rnn.bias_ih_l0)
        drive = drive + self.task_context(task)
        if state is None:
            state = torch.zeros(x.shape[0], self.hidden)
        states = []
        for index in range(x.shape[1]):
            previous = nn.functional.linear(state, self.rnn.weight_hh_l0, self.rnn.bias_hh_l0)
            state = torch.tanh(drive[:, index] + (previous if self.recurrent else 0))
            states.append(state)
        hidden = torch.stack(states, 1)
        selected = torch.cat((encoded[..., [7, 0, 6], :], encoded[..., [0, 1, 7], :],
                              encoded[..., [1, 2, 0], :]), -1)
        identity = torch.eye(3).expand(*selected.shape[:-2], 3, 3)
        shared = torch.cat((selected, identity, hidden.unsqueeze(-2).expand(*selected.shape[:-1], self.hidden)), -1)
        scores = self.direction(torch.tanh(self.scorer(shared))).squeeze(-1) + self.motor_bias
        care = self.care(hidden)
        return torch.cat((care[..., :1], scores[..., [1, 2, 0]], care[..., 1:], self.task_head(hidden)), -1), state

    def export(self):
        data = super().export() | {"version": 5, "taskContract": "private-task-byte-v1", "recurrent": self.recurrent,
                                   "tasks": self.tasks, "gated": self.gated, "temperature": self.temperature}
        for key, name in [("taskContext", "task_context"), ("taskGate", "task_gate"), ("taskHead", "task_head")]:
            layer = getattr(self, name)
            data[key] = {"weight": layer.weight.detach().flatten().tolist(), "bias": layer.bias.detach().tolist()}
        return data

    def load(self, path):
        data = json.loads(Path(path).read_text())
        self.recurrent = data["recurrent"]
        if data["version"] == 4:
            super().load(path)
            return
        if (data["version"], data["history"], data["hidden"], data["embedding"], data["tasks"]) != (
                5, self.history, self.hidden, self.embedding, self.tasks):
            raise ValueError("registered initializer topology mismatch")
        if data.get("globalInputs") != GLOBALS or data.get("taskContract") != "private-task-byte-v1":
            raise ValueError("registered initializer contract mismatch")
        pairs = [(self.rnn.weight_ih_l0, data["context"]["weight"]),
                 (self.rnn.bias_ih_l0, data["context"]["bias"]),
                 (self.rnn.weight_hh_l0, data["recurrence"]["weight"]),
                 (self.rnn.bias_hh_l0, data["recurrence"]["bias"]), (self.motor_bias, data["motorBias"])]
        for key, name in [("encoder", "encoder"), ("scorer", "scorer"), ("direction", "direction"),
                          ("care", "care"), ("taskContext", "task_context"),
                          ("taskGate", "task_gate"), ("taskHead", "task_head")]:
            layer = getattr(self, name)
            pairs.extend([(layer.weight, data[key]["weight"]), (layer.bias, data[key]["bias"])])
        with torch.no_grad():
            for parameter, values in pairs:
                parameter.copy_(torch.tensor(values).reshape(parameter.shape))


def policy_statistics(logits, motor, task, temperature):
    physical = torch.distributions.Categorical(logits=logits[..., :8] / temperature)
    register = torch.distributions.Categorical(logits=logits[..., 10:] / temperature)
    return physical.log_prob(motor) + register.log_prob(task), physical.entropy() + register.entropy()


def parity(model, rows):
    examples = []
    with torch.no_grad():
        for row in rows[:16]:
            x = torch.from_numpy(row[:model.inputs].copy()).reshape(1, 1, -1)
            previous = torch.from_numpy(row[model.inputs:model.inputs + model.hidden].copy()).reshape(1, -1)
            logits, state = model(x, previous)
            tail = x[0, 0, 111:111 + model.history * 8].tolist() + [1, 0]
            examples.append({"inputs": x[0, 0].tolist(), "previous": previous[0].tolist() + tail,
                             "logits": logits[0, 0].tolist(), "state": state[0].tolist() + tail})
    return examples
