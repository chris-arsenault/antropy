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
    assert_eq!(a.version, 27);
    execute(
        &mut a,
        &json!({"op":"intervene", "deposit":{"x":13,"y":13,"species":138,"amount":2}}),
    )
    .unwrap();
    assert!(a.cells.iter().any(|c| c.inventory.material() > 0.));
    assert!(a.field.totals(&a.chemistry).0 > 0.);
    let before = a.snapshot().unwrap();
    assert!(before.starts_with(b"ANTROPY27\0"));
    let mut b = World::restore(&before).unwrap();
    assert_eq!(b.snapshot().unwrap(), before);
    assert_eq!(b.chemistry.version, 5);
    for _ in 0..17 {
        a.step();
        b.step();
    }
    assert_eq!(a.tick, 17);
    assert_eq!(a.snapshot().unwrap(), b.snapshot().unwrap());
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
    old[..10].copy_from_slice(b"ANTROPY23\0");
    assert!(
        World::restore(&old)
            .err()
            .expect("v23 must be rejected")
            .contains("v27 required")
    );
    w.chemistry.properties[0].interaction[0] += 0.01;
    assert!(
        World::restore(&w.snapshot().unwrap())
            .err()
            .expect("corrupt profile must be rejected")
            .contains("profile")
    );
}
