"""One recurrent network with tied directional encoders and action scorers."""
import json
from pathlib import Path

import numpy as np
import torch
from torch import nn

GLOBALS = [3, 7, 11, 15, 21, 22, 23, 81, 82, 20]
OBSERVATION_CONTRACT = "colony-f32-v1"
ODORS = [[4, 5, 6, 24, 25], [8, 9, 10, 26, 27],
         [12, 13, 14, 28, 29], [16, 17, 18, 30, 31]]


def samples(x):
    directions = []
    for offset in range(8):
        position = {0: 0, 1: 1, 7: 2, 2: 3, 6: 4}.get(offset)
        zeros = torch.zeros_like(x[..., :4])
        raw = x[..., [indices[position] for indices in ODORS]] if position is not None else zeros
        normalized = x[..., [91 + i * 5 + position for i in range(4)]] if position is not None else zeros
        mask = torch.full_like(x[..., :1], float(position is not None))
        directions.append(torch.cat((x[..., 33 + offset * 5:38 + offset * 5],
                                      x[..., [73 + offset, 83 + offset]], raw, normalized, mask), -1))
    return torch.stack(directions, -2)


class DirectionalNetwork(nn.Module):
    def __init__(self, history=0, hidden=64, embedding=16):
        super().__init__()
        self.history, self.hidden, self.embedding = history, hidden, embedding
        self.inputs = 111 + 8 * history
        self.encoder = nn.Linear(16, embedding)
        self.rnn = nn.RNN(8 * embedding + len(GLOBALS) + 8 * history, hidden, batch_first=True)
        self.scorer = nn.Linear(3 * embedding + 3 + hidden, embedding)
        self.direction = nn.Linear(embedding, 1)
        self.care = nn.Linear(hidden, 7)
        self.motor_bias = nn.Parameter(torch.zeros(3))
        nn.init.zeros_(self.rnn.weight_hh_l0)
        nn.init.zeros_(self.rnn.bias_hh_l0)

    def forward(self, x, state=None):
        encoded = torch.tanh(self.encoder(samples(x)))
        context = torch.cat((encoded.flatten(-2), x[..., GLOBALS], x[..., 111:]), -1)
        hidden, next_state = self.rnn(context, None if state is None else state.unsqueeze(0))
        selected = torch.cat((encoded[..., [7, 0, 6], :], encoded[..., [0, 1, 7], :],
                              encoded[..., [1, 2, 0], :]), -1)
        identity = torch.eye(3).expand(*selected.shape[:-2], 3, 3)
        shared = torch.cat((selected, identity, hidden.unsqueeze(-2).expand(*selected.shape[:-1], self.hidden)), -1)
        scores = self.direction(torch.tanh(self.scorer(shared))).squeeze(-1) + self.motor_bias
        care = self.care(hidden)
        logits = torch.cat((care[..., :1], scores[..., [1, 2, 0]], care[..., 1:]), -1)
        return logits, next_state[0]

    def export(self):
        def layer(weight, bias):
            return {"weight": weight.detach().flatten().tolist(), "bias": bias.detach().tolist()}
        data = {"version": 4, "inputs": self.inputs, "hidden": self.hidden,
                "observationContract": OBSERVATION_CONTRACT,
                "embedding": self.embedding, "history": self.history, "recurrent": True, "globalInputs": GLOBALS,
                "motorBias": self.motor_bias.detach().tolist(),
                "context": layer(self.rnn.weight_ih_l0, self.rnn.bias_ih_l0),
                "recurrence": layer(self.rnn.weight_hh_l0, self.rnn.bias_hh_l0)}
        for key in ["encoder", "scorer", "direction", "care"]:
            module = getattr(self, key)
            data[key] = layer(module.weight, module.bias)
        return data

    def load(self, path):
        data = json.loads(Path(path).read_text())
        if data.get("globalInputs") != GLOBALS or data.get("observationContract") != OBSERVATION_CONTRACT:
            raise ValueError("initial model sensor mapping differs")
        if (data["version"], data["history"], data["hidden"], data["embedding"]) != (4, self.history, self.hidden, self.embedding):
            raise ValueError("initial model topology differs")
        pairs = [(self.rnn.weight_ih_l0, data["context"]["weight"]),
                 (self.rnn.bias_ih_l0, data["context"]["bias"]),
                 (self.rnn.weight_hh_l0, data["recurrence"]["weight"]),
                 (self.rnn.bias_hh_l0, data["recurrence"]["bias"]), (self.motor_bias, data["motorBias"])]
        for key in ["encoder", "scorer", "direction", "care"]:
            module = getattr(self, key)
            pairs.extend([(module.weight, data[key]["weight"]), (module.bias, data[key]["bias"])])
        with torch.no_grad():
            for parameter, values in pairs:
                parameter.copy_(torch.tensor(values).reshape(parameter.shape))


def read_directional_data(paths, history):
    arrays, metadata = [], []
    for dataset, path in enumerate(paths):
        meta = json.loads(Path(path + ".json").read_text())
        if meta.get("observationContract") != OBSERVATION_CONTRACT:
            raise ValueError("dataset predates the matched float32 sensory contract; regenerate teacher labels")
        rows = np.fromfile(path + ".f32", dtype="<f4").reshape(-1, meta["columns"])
        if len(rows) != meta["rows"]:
            raise ValueError("dataset row count mismatch")
        source_inputs, target_inputs = meta["inputs"], 111 + 8 * history
        result = np.zeros((len(rows), target_inputs + 6), dtype=np.float32)
        result[:, :111] = rows[:, :111]
        result[:, target_inputs:] = rows[:, source_inputs:]
        if source_inputs == target_inputs:
            result[:, 111:target_inputs] = rows[:, 111:source_inputs]
        elif history:
            if meta["modelHash"]:
                raise ValueError("learner dataset lacks actual-command history")
            previous = {}
            for i, row in enumerate(rows):
                key = tuple(row[source_inputs + 3:source_inputs + 5])
                tick = row[source_inputs + 5]
                old_tick, motors = previous.get(key, (tick - 1, []))
                if tick != old_tick + 1:
                    motors = []
                for lag, motor in enumerate(motors):
                    result[i, 111 + lag * 8 + motor] = 1
                previous[key] = (tick, ([int(row[source_inputs])] + motors)[:history])
        # Prevent sequence stitching across different rollouts of the same worker id.
        result[:, target_inputs + 3] += dataset * 1_000_000
        arrays.append(result)
        metadata.append(meta)
    if len({meta["physics"] for meta in metadata}) != 1:
        raise ValueError("datasets use different physical worlds")
    return np.concatenate(arrays), metadata
