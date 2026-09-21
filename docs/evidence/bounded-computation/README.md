# Bounded computation evidence

Registration, laws, interpretation and validation: [study record](../../bounded-computation.md).

- [Frozen reaction support](support.json): zero ticks at the mature checkpoint; counts
  above four concentration thresholds, proposed pre-allocation reaction material,
  retained free material and subnormal inventory entries. The implemented threshold
  is 1e-6. Other thresholds were inspected, not adopted or run as alternate ecologies.
- [Final mature workload](mature-final.json): ledger 4290–4291, ten warmup and 100
  measured ticks per closed/active-panel arm, including census, inspection and render
  preparation. Compare the [preceding contact pass](../contact-performance/mature-final.json).
- [Current v34 capacities](capacity.json): ledger 4292–4294, 48 fixed, 2,000 fixed
  and 2,000 growing cells. The prior capacity comparison is retained
  [here](../contact-performance/capacity-after.json).

The v33 mature world and current v34 capacity fixtures are different workloads. Do
not treat their timings as an illumination experiment or a population-scaling curve.
The unchanged mature checkpoint is under
`frontend/harness/artifacts/cellular-200k-v33/trajectory/checkpoint-180000.bin`.
The study record names the production files copied into the isolated v33 source export.
The full V8 CPU sample and intermediate reports remain local under
`frontend/harness/artifacts/bounded-computation/`; they were not uploaded externally.

| Artifact | SHA-256 |
| --- | --- |
| Mature checkpoint | `d6d082b2320629b563b575c293bee3cbfa2e0e9e7d185c4148818d161edc165b` |
| Final isolated mature WASM | `f7134d34ade9a2f7e6ea9b7c22f46645231c5720f357963d51286b13065fd497` |
| Final current-v34 WASM | `99487ff55725ea11ab20e5168a0e70db8747b238dfc11d3d84c38b00c9cfb8b3` |
