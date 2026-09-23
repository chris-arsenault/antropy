use antropy_engine::{commands::execute, config::Config, world::World};
use serde_json::json;

fn world() -> World {
    World::new(
        101,
        Config {
            width: 24.,
            height: 24.,
            founders: 2,
            source_count: 2,
            ..Config::default()
        },
    )
    .unwrap()
}

#[test]
fn current_definition_roundtrips_and_continues_for_seventeen_ticks() {
    let mut a = world();
    assert_eq!(a.version, 41);
    execute(
        &mut a,
        &json!({"op":"intervene", "deposit":{"x":13,"y":13,"species":138,"amount":2}}),
    )
    .unwrap();
    assert!(a.cells.iter().any(|c| c.inventory.material() > 0.));
    assert!(a.field.totals(&a.chemistry).0 > 0.);
    let before = a.snapshot().unwrap();
    assert!(before.starts_with(b"ANTROPY41\0"));
    let mut b = World::restore(&before).unwrap();
    assert_eq!(b.snapshot().unwrap(), before);
    assert_eq!(b.chemistry.version, 5);
    for _ in 0..17 {
        a.step();
        b.step();
    }
    // Rebuilt numerical caches may round differently; both continuations must remain usable.
    for state in [&mut a, &mut b] {
        assert_eq!(state.tick, 17);
        assert!(state.stop_reason.is_none());
        state.validate().unwrap();
        let summary = execute(state, &json!({"op":"summary"})).unwrap();
        let material = 1. + state.ledger.initial_material.abs() + state.ledger.supplied.abs();
        let energy = 1.
            + state.ledger.initial_energy.abs()
            + state.ledger.supplied_energy.abs()
            + state.ledger.weathering_work.abs()
            + state.ledger.source_work.abs()
            + state.ledger.flows.external_work.abs();
        for (name, scale) in [("materialResidual", material), ("energyResidual", energy)] {
            let residual = summary[name].as_f64().unwrap();
            assert!(residual.abs() <= 1e-7 * scale, "{name}: {residual}");
        }
    }
    let definition = execute(&mut b, &json!({"op":"definition"})).unwrap();
    assert!(serde_json::to_vec(&definition).unwrap().len() < 2 * 1024 * 1024);
    assert_eq!(
        definition["chemistry"]["profiles"]["coefficients"]
            .as_array()
            .unwrap()
            .len(),
        2
    );
}

#[test]
fn old_versions_and_tampered_profiles_are_rejected() {
    let mut w = world();
    let mut old = w.snapshot().unwrap();
    old[..10].copy_from_slice(b"ANTROPY30\0");
    assert!(
        World::restore(&old)
            .err()
            .expect("v30 must be rejected")
            .contains("v41 required")
    );
    w.chemistry.properties[0].interaction[0] += 0.01;
    assert!(
        World::restore(&w.snapshot().unwrap())
            .err()
            .expect("corrupt profile must be rejected")
            .contains("profile")
    );
}
