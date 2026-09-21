use crate::{chemistry::Chemistry, climate::Climate, config::Config, field::Field, world::World};

fn config() -> Config {
    Config {
        width: 24.,
        height: 24.,
        source_count: 0,
        founders: 1,
        ..Config::default()
    }
}

#[test]
fn weathering_commit_cannot_wake_subfloor_product_groups() {
    let c = config();
    let chemicals = Chemistry::new(101).unwrap();
    let floor = crate::field_activity::CONCENTRATION_FLOOR * c.mesh.powi(2) as f32;
    let mut climate = Climate::new(&c, &chemicals);
    climate.prepare(&c);
    let mut row = [0.; 256];
    row[0] = 100. * floor;
    let mask = climate.convert(&mut row, 1, ([1., 0.], 0.), 0.8);
    assert!(climate.converted > 0.);
    assert_eq!(row[16], 0.);
    assert_eq!(mask, 1);
    assert!(row.iter().all(|q| *q == 0. || *q >= floor));
    let mut field = Field::new(c.width, c.height, c.mesh);
    field.add(0, 0, (0.5 * floor) as f64, &chemicals);
    let before = field.totals(&chemicals);
    climate.prepare(&c);
    let balance = field.advance_weathered(&chemicals, 0.8, 0., 1., Some(&mut climate));
    let after = field.totals(&chemicals);
    assert!(balance.roundoff_matter > 0.);
    assert!((before.0 - after.0 - balance.roundoff_matter).abs() < floor as f64 * 1e-6);
    assert!(
        (before.1 + balance.weathering_work
            - after.1
            - balance.weathering_heat
            - balance.roundoff_energy)
            .abs()
            < floor as f64 * 1e-5
    );
    for n in 0..field.nx * field.ny {
        let row = &field.amounts[n * 256..(n + 1) * 256];
        assert_eq!(field.active_groups(n), crate::field_activity::mask(row));
        assert!(row.iter().all(|q| *q == 0. || *q >= floor));
    }
}

#[test]
fn extracellular_products_wake_sparse_groups_and_close_material_and_heat() {
    let c = Config {
        weathering_rate: 1.,
        habitat_feedback: false,
        ..config()
    };
    let chemicals = Chemistry::new(101).unwrap();
    let mut field = Field::new(c.width, c.height, c.mesh);
    let mut climate = Climate::new(&c, &chemicals);
    climate.prepare(&c);
    // Keep second-generation products above the dissolved concentration resolution.
    field.add(0, 0, 10., &chemicals);
    field.add(0, 240, 40., &chemicals); // A positive local profile favors 0 -> 16.
    let before = field.totals(&chemicals);
    let balance = field.advance_weathered(&chemicals, 0.8, c.washout, 1., Some(&mut climate));
    let after = field.totals(&chemicals);
    assert!(balance.weathered_material > 0. && balance.weathering_heat > 0.);
    assert!(field.amounts[16] > 0.);
    assert_eq!(field.amounts[48], 0.); // Two coordinate bits: no same-update cascade.
    assert_ne!(field.active_groups(0) & (1 << 4), 0);
    assert!(field.work_counts()[0] < field.nx * field.ny);
    assert!((before.0 - after.0 - balance.matter - balance.roundoff_matter).abs() < 1e-12);
    assert!(
        (before.1 + balance.weathering_work
            - after.1
            - balance.energy
            - balance.weathering_heat
            - balance.roundoff_energy)
            .abs()
            < 1e-12
    );
    field.validate_reductions(&chemicals).unwrap();
    climate.prepare(&c);
    field.advance_weathered(&chemicals, 0.8, c.washout, 1., Some(&mut climate));
    assert!(field.amounts[32] > 0.);
    field.validate_reductions(&chemicals).unwrap();
}

#[test]
fn shield_changes_conversion_without_granting_material_and_empty_field_stays_idle() {
    let mut c = config();
    let chemicals = Chemistry::new(101).unwrap();
    let mut climate = Climate::new(&c, &chemicals);
    let mut empty = Field::new(c.width, c.height, c.mesh);
    climate.prepare(&c);
    empty.advance_weathered(&chemicals, 0.8, 0., 1., Some(&mut climate));
    assert_eq!(empty.work_counts(), [0, 0, 0]);
    let mut row = [0.; 256];
    // A resolved product tests shielding independently of numerical tail removal.
    row[0] = 400.;
    let mut protected = row;
    let mask = climate.convert(&mut protected, 1, ([1., 0.], 0.5), 0.8);
    let protected_heat = climate.heat;
    assert!(climate.prevented > 0.);
    c.habitat_feedback = false;
    climate.prepare(&c);
    climate.convert(&mut row, 1, ([1., 0.], 0.5), 0.8);
    assert!(row[0] < protected[0]);
    assert!(climate.heat > protected_heat);
    assert_eq!(climate.prevented, 0.);
    assert_ne!(mask & (1 << 4), 0);
    let retained = protected.iter().map(|q| *q as f64).sum::<f64>();
    let bound = 256. * crate::field_activity::CONCENTRATION_FLOOR as f64 * c.mesh.powi(2);
    assert!((retained - 400.).abs() < bound);
}

#[test]
fn climate_restore_continues_at_each_physiology_phase_and_source_rng_is_independent() {
    let mut c = config();
    c.source_count = 2;
    let chemistry = Chemistry::new(c.chemistry_seed).unwrap();
    let op = crate::weathering::Operators::new(&chemistry);
    let species = (0..256)
        .find(|&s| {
            let signal = crate::weathering::signal(chemistry.properties[s].interaction);
            op.fractions(s, signal, 1.).iter().sum::<f64>() > 0.
        })
        .unwrap();
    c.source_species = vec![species];
    let mut w = World::new(27, c.clone()).unwrap();
    c.habitat_feedback = false;
    let mut control = World::new(27, c).unwrap();
    for _ in 0..12 {
        let mut restored = crate::boundary_tests::restored_state(&w);
        let resumed_tick = w.tick + 1;
        w.step();
        restored.step();
        control.step();
        crate::boundary_tests::usable_continuation(&w, resumed_tick);
        crate::boundary_tests::usable_continuation(&restored, resumed_tick);
        for (a, b) in w.sources.iter().zip(&control.sources) {
            assert_eq!((a.remaining, a.wait, a.rate), (b.remaining, b.wait, b.rate));
            assert!(
                (a.inventory.iter().sum::<f64>() - b.inventory.iter().sum::<f64>()).abs() < 1e-10
            );
        }
    }
    assert!(w.ledger.weathering_heat + w.ledger.weathering_work > 0.);
    assert!(w.ledger.sheltered_conversion > 0.);
    assert_ne!(w.field.amounts, control.field.amounts);
}
