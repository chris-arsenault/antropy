use crate::{
    binding::{Key, Keys},
    config::Config,
    diagnostics, sensing,
    world::World,
};

fn fixture() -> World {
    let mut w = diagnostics::nutrition(0.8, 2., false, false);
    let g = w.genomes.get_mut(&1).unwrap();
    g.chromosomes[0].chemistry.keys = Some(Keys::founders(&g.chromosomes[0].chemistry));
    g.compile(&w.config, &w.chemistry);
    w.cells[0].inventory.fill(0.);
    diagnostics::initialize(&mut w);
    w
}

fn membrane(w: &mut World, key: Key) {
    let g = w.genomes.get_mut(&1).unwrap();
    g.chromosomes[0].chemistry.keys.as_mut().unwrap().membrane = key;
    g.compile(&w.config, &w.chemistry);
    diagnostics::initialize(w);
}

#[test]
fn changing_one_importer_bit_changes_actual_paid_access_to_the_same_supply() {
    let mut original = fixture();
    for i in 0..original.field.nx * original.field.ny {
        original.field.add(i, 0, 0.4, &original.chemistry);
    }
    let g = original.genomes.get_mut(&1).unwrap();
    g.chromosomes[0]
        .chemistry
        .keys
        .as_mut()
        .unwrap()
        .transporters[0] = Key::target([0., 0.]);
    g.compile(&original.config, &original.chemistry);
    original.cells[0].action.transport = [1., 0.5, 0.5, 0.5];
    diagnostics::initialize(&mut original);
    let mut changed = original.clone();
    let g = changed.genomes.get_mut(&1).unwrap();
    g.chromosomes[0]
        .chemistry
        .keys
        .as_mut()
        .unwrap()
        .transporters[0]
        .weights[0] = 1.;
    g.compile(&changed.config, &changed.chemistry);
    diagnostics::initialize(&mut changed);
    let before = original.held();
    for w in [&mut original, &mut changed] {
        let sites = vec![crate::footprint::sites(&w.cells[0], &w.config, &w.field)];
        crate::transport::Exchange::default().advance(
            &mut w.cells,
            &w.config,
            &mut w.field,
            &w.chemistry,
            &sites,
            (&mut w.ledger, None),
        );
        let after = w.held();
        assert!((before.0 - after.0 - w.ledger.numerical_material).abs() < 1e-9);
        assert!(
            (before.1 - after.1 - w.cells[0].flows.transport - w.ledger.numerical_energy).abs()
                < 1e-9
        );
        assert!(w.cells[0].flows.transport >= 0.);
    }
    assert!(original.cells[0].flows.imported > 1e-4);
    assert_eq!(changed.cells[0].flows.imported, 0.);
    assert!(original.cells[0].flows.transport > 0.);
    assert_eq!(changed.cells[0].flows.transport, 0.);
}

#[test]
fn selective_membranes_protect_against_different_chemicals_in_the_same_mixture() {
    let mut a = fixture();
    // These identities are adjacent on the manifold but differ in every low coordinate bit.
    a.cells[0].inventory.set(7, 0.2);
    a.cells[0].inventory.set(8, 0.2);
    a.chemistry.properties[7].stress = 0.2;
    a.chemistry.properties[8].stress = 1.;
    membrane(&mut a, Key::target([0., 8.]));
    let mut b = a.clone();
    membrane(&mut b, Key::target([0., 7.]));
    let mut broad = a.clone();
    membrane(
        &mut broad,
        Key {
            weights: [0.; 8],
            bias: 9.,
        },
    );
    let load = |w: &World| {
        sensing::stress_load(
            &w.cells[0],
            &w.genomes[&1].compiled.as_ref().unwrap(),
            &w.config,
            &w.field,
            &w.chemistry,
        )
    };
    assert!(load(&a) < load(&b));
    assert!(load(&b) < load(&broad));
    let op = &a.genomes[&1].compiled.as_ref().unwrap().operators;
    assert!(
        op.membrane
            .iter()
            .any(|entry| entry.species == 8 && entry.value > 0.99)
    );
    assert!(!op.membrane.iter().any(|entry| entry.species == 7));
    assert_eq!(a.held(), b.held());
    assert_eq!(a.held(), broad.held());
}

#[test]
fn uniform_recognition_cannot_protect_a_diverse_inventory_through_positive_bias() {
    let mut w = fixture();
    for s in 0..256 {
        w.cells[0].inventory.set(s, 0.001);
    }
    membrane(
        &mut w,
        Key {
            weights: [0.; 8],
            bias: 9.,
        },
    );
    let cell = &w.cells[0];
    let unprotected = cell.inventory.projection(&w.chemistry).stress / cell.volume(&w.config);
    let load = sensing::stress_load(
        cell,
        w.genomes[&1].compiled.as_ref().unwrap(),
        &w.config,
        &w.field,
        &w.chemistry,
    );
    let expected = 1. - (1. - Config::default().susceptibility_floor) / 256.;
    assert!((load / unprotected - expected).abs() < 1e-12);
    assert!(load / unprotected > 0.996);
}
