"""Bounded checks for temporal credit boundaries and frozen likelihoods."""
import unittest

import numpy as np
import torch

from registered_network import RegisteredNetwork, policy_statistics
from registered_ppo import Critic, advantages


class CreditTests(unittest.TestCase):
    def test_death_stops_bootstrap_and_workers_do_not_share_returns(self):
        model = RegisteredNetwork(history=0, hidden=2, embedding=2, tasks=2)
        critic = Critic(model.inputs, model.hidden)
        for parameter in critic.parameters():
            parameter.data.zero_()
        offset = model.inputs + model.hidden
        rows = np.zeros((4, offset + 8), dtype=np.float32)
        rows[:, offset + 3] = [0, 100, 2, 0]
        rows[:, offset + 4] = [0, 1, 1, 0]
        rows[:, offset + 5] = 1
        rows[:, offset + 6] = [1, 2, 1, 3]
        rows[:, offset + 7] = [1, 1, 2, 1]
        _, _, result, _, _ = advantages(rows, model, critic, {"bootstrap": []}, 0.5, 1)
        self.assertEqual(result.tolist(), [1, 100, 2, 0])

    def test_both_motor_and_register_heads_receive_gradient(self):
        model = RegisteredNetwork(history=0, hidden=2, embedding=2, tasks=2)
        inputs = torch.zeros(1, 2, model.inputs)
        inputs[..., 111] = 1
        logits, _ = model(inputs)
        logp, _ = policy_statistics(logits, torch.zeros(1, 2, dtype=torch.long),
                                   torch.ones(1, 2, dtype=torch.long), 1)
        (-logp.mean()).backward()
        self.assertGreater(float(model.task_head.weight.grad.abs().sum()), 0)
        self.assertGreater(float(model.care.weight.grad.abs().sum()), 0)

    def test_bootstrap_uses_world_identity_not_repeated_food_seed(self):
        model = RegisteredNetwork(history=0, hidden=2, embedding=2, tasks=2)
        critic = Critic(model.inputs, model.hidden)
        for parameter in critic.parameters():
            parameter.data.zero_()
        critic.network[-1].bias.data.fill_(10)
        offset = model.inputs + model.hidden
        rows = np.zeros((2, offset + 8), dtype=np.float32)
        rows[:, offset + 5] = [1, 2]
        rows[:, offset + 6] = 1
        metadata = {"bootstrap": [{"caseId": 2, "id": 1, "inputs": [0.] * model.inputs,
                                    "state": [0.] * model.hidden}]}
        _, _, result, _, _ = advantages(rows, model, critic, metadata, 0.5, 1)
        self.assertEqual(result.tolist(), [-10, -5])


if __name__ == "__main__":
    unittest.main()
