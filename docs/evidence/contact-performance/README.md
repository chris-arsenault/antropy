# Contact search performance evidence

Registration, method and interpretation: [mature contact performance](../../contact-performance.md).

- [Mature baseline](mature-before.json): ledger 4274–4275, archived v33 kernel and unchanged
  tick-180,000 checkpoint; 74/72 ticks before the 30-second caps.
- [Initial optimization](mature-first.json): ledger 4276–4277, 100 ticks per arm.
- [Final optimization](mature-final.json): ledger 4281–4282, 100 ticks per arm, including the
  exact half-world direction convention. The shared account validator passes.
- [Geometry check](geometry.json): zero simulation ticks; all 38,071 contacts agree with
  exhaustive all-pairs testing, using 303,934 instead of 5,201,125 candidates. Its native timing
  is not compared with the WASM operating times.
- [V34 capacity before](capacity-before.json): ledger 4278–4280.
- [V34 capacity after](capacity-after.json): ledger 4283–4285.

Both capacity arms use 48 fixed, 2,000 fixed and 2,000 growing cells, ten warmup plus 100 measured
ticks and a 60-second cap. They retain binary hashes and storage measurements. The archived
benchmark source export is commit `fad7fa9` with only production's optimized `movement.rs`,
`interfaces.rs` and new contact geometry/test files copied into it. These files were compared
byte-for-byte with current production. It preserves v33 illumination so that only contact
implementation differs. There is no production checkpoint adapter.

Full source export, WASM binaries and their generated source metadata remain local under
`frontend/harness/artifacts/contact-performance-v34/`. The mature input and its original binary
remain in `frontend/harness/artifacts/cellular-200k-v33/trajectory/`.

## Matched-input hashes

| Artifact | SHA-256 |
| --- | --- |
| Unchanged 180k checkpoint | `d6d082b2320629b563b575c293bee3cbfa2e0e9e7d185c4148818d161edc165b` |
| Archived baseline WASM | `88185501b3d03182925d3ec7e01cbdc0025b26203c98f4daa756e6111568027c` |
| Final isolated v33 WASM with contact optimization | `b55edaa60928bb173b6e6eaa79f48d7fdde567fbf2da8491d7e3f1497caef639` |
