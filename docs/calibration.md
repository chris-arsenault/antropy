# Calibration

The economy is tuned by measurement, not by knob-turning (Appendix B §B.6).
The harness lives in `frontend/src/sim/calibration.ts`; `pnpm calibrate`
(the slow test `calibration.slow.test.ts`) runs the axis sweep and the
oracle-vs-seeded comparison and writes raw ledgers to
`frontend/test-results/calibration.txt`.

## Method

An economy point fixes the three sampled axes — food density
(`FOOD_GOVERNOR.targetCount`), meal size (`ENERGY.foodEnergy`), and energy
inflow (`FOOD_GOVERNOR.maxSpawnPerPass`) — which together drive ratios R1,
R2, R3, R5b, and R7. Each point runs one colony for 4000 ticks under the
certified rung-2 sensor-limited oracle (see [ADR-0009](adr/0009-oracles-outside-the-contract.md)),
producing a survival/delivery ledger. One-at-a-time excursions (×1/4, ×2)
around the defaults measure the viable-region margin on each axis
independently. Points that fail world-creation preconditions (R7 closure)
are recorded as inviable rather than run.

## Measured viable region (seed 9100, 4000 ticks, rung-2 oracle)

| Point | Outcome | Ants | Merit | Stockpile | R1 | R2 | R3 | R7 |
| ----- | ------- | ---- | ----- | --------- | -- | -- | -- | -- |
| defaults | survived | 32 | 542 | 6.9 | 45.8 | 0.20 | 1.3 | 157 |
| foodTarget ×1/4 | survived | 27 | 551 | 6.9 | 23.1 | 0.20 | 0.7 | 157 |
| foodTarget ×2 | survived | 33 | 549 | 7.1 | 67.9 | 0.20 | 2.0 | 157 |
| foodEnergy ×1/4 | survived | 24 | 523 | 6.4 | 11.7 | 0.05 | 1.4 | 39 |
| foodEnergy ×2 | survived | 31 | 554 | 7.2 | 92.7 | 0.40 | 1.4 | 314 |
| spawn ×1/4 | survived | 22 | 544 | 7.0 | 45.9 | 0.20 | 1.3 | 39 |
| spawn ×2 | survived | 29 | 546 | 7.0 | 46.3 | 0.20 | 1.3 | 314 |

Every excursion survives with continuous delivery: the defaults sit in the
viable region's interior with at least 4× margin on each axis. The Release 3
M0 recentering (meal size 0.2, food target 800, spawn 20) therefore stands
unchanged — the measurement is the justification.

## Oracle-vs-seeded gap (defaults, seed 9100, 4000 ticks)

| Driver | Outcome | Ants | Merit | Stockpile |
| ------ | ------- | ---- | ----- | --------- |
| rung-2 oracle | survived | 32 | 542 | 6.9 |
| seeded controller | survived | 16 | 428 | 1.0 |

Both survive. The gap is provisioning surplus, not viability: the seeded
colony holds half the oracle's population and pins its stockpile at the
`queenReserve` floor (1.0), while the oracle banks a 6.9 surplus. Closing
that gap is the derived-seed portfolio's target (ADR-0010); re-measure here
after each portfolio change. (Measured before the Release 3 liability set
landed; the tournament below is the current-economy reference.)

## Bootstrap tournament (§B.8, ADR-0011 — seed 4200, 28k ticks)

Strategies share one forager script and differ in asset placement; the
harness digs the architect's vault and the queen descends with it
(ADR-0009). Ledgers per §B.8.2:

| Strategy | Worker-days | Merit | Egg survival | Vault |
| -------- | ----------- | ----- | ------------ | ----- |
| O-surface (queen and hoard in the open) | 346 | 1743 | 50% | 0 |
| O-shelter (founding chamber) | 478 | 4496 | 98% | 0 |
| O-architect (vault target 10) | 301 | 1690 | 100% | 6 |
| O-dig1 (vault 1) | 519 | 4427 | 96% | 1 |
| O-dig4 (vault 4) | 418 | 2942 | 100% | 4 |

Surface living is survivable but strictly inferior on every ledger, and
the edge collapses when egg exposure is ablated (surface 427 worker-days
vs shelter 317 at 12k ticks with the hazard off) — the ordering rests on
the intended liability. The Rule 7 increment series puts the measured
optimal nest depth at roughly chamber+1: the first vault layer improves
the ledger, deeper layers cost more than this climate returns (their brood
protection is real — 96→100% — but small). Deeper architecture becoming
worthwhile awaits harsher brood economics (backlog, brood-as-capital).
