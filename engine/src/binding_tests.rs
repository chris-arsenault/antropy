use crate::{config::Config, field::Field, source_medium, world::World};

#[test]
fn chemical_affinity_reverses_force_and_consuming_support_removes_it() {
    let mut w = World::new(
        27,
        Config {
            width: 128.,
            height: 128.,
            founders: 0,
            source_count: 1,
            source_priming: 0.,
            ..Config::default()
        },
    )
    .unwrap();
    // Isolate sign dependence from particular generated profile values.
    for (s, sign) in [(0, 1.), (80, -1.)] {
        w.chemistry.properties[s].interaction = [sign, 0.];
        w.chemistry.properties[s].impedance = 0.1;
    }
    let source = &mut w.sources[0];
    source.habitat.x = 48.3;
    source.habitat.y = 63.1;
    source.habitat.radius = 3.;
    source.rebuild(&w.config, &w.field);
    source.mixture.fill(0.);
    source.mixture[0] = 1.;
    source.amount = source.interface;
    let site = w.field.stencil(62.3, 63.1);
    for (s, sign) in [(0, 1.), (80, -1.)] {
        w.field = Field::new(w.config.width, w.config.height, w.config.mesh);
        for &(n, weight) in &site {
            w.field.add(n, s, 4. * weight, &w.chemistry);
        }
        source_medium::project(&mut w);
        let response = source_medium::response(&w.sources[0], 0, &w.config, &w.field, &w.chemistry);
        assert!(response.velocity[0] * sign > 1e-8);
        for &(n, _) in &site {
            let amount = w.field.amounts[n * 256 + s] as f64;
            w.field.add(n, s, -amount, &w.chemistry);
        }
        source_medium::project(&mut w);
        let released = source_medium::response(&w.sources[0], 0, &w.config, &w.field, &w.chemistry);
        assert!(released.velocity.iter().all(|v| v.abs() < 1e-12));
    }
}

#[test]
fn fractional_loss_is_independent_of_density_chemistry_and_body_support() {
    let mut chemistry = crate::chemistry::Chemistry::new(101).unwrap();
    for p in &mut chemistry.properties {
        p.diffusion = 0.;
    }
    let fraction = 1. - (-0.04_f64).exp();
    for (species, amount, support) in [(0, 1., 0.), (80, 100., 0.), (136, 100., 1000.)] {
        let mut field = Field::new(24., 24., 2.);
        field.drift = 0.;
        field.attraction_length = 6.;
        field.add(55, species, amount, &chemistry);
        field.body_signal[55] = [support, -support];
        field.body_load[55] = support;
        let before = field.totals(&chemistry);
        let balance = field.advance(&chemistry, 0.8, 0.05, 1.);
        let after = field.totals(&chemistry);
        assert!((balance.matter / before.0 - fraction).abs() < 1e-12);
        assert!((balance.energy / before.1 - fraction).abs() < 1e-12);
        assert!((before.0 - after.0 - balance.matter - balance.roundoff_matter).abs() < 1e-10);
        assert!((before.1 - after.1 - balance.energy - balance.roundoff_energy).abs() < 1e-10);
    }
}

fn cell_work(active: bool) -> World {
    let mut w = crate::initial_ecology::probe(2, true).unwrap();
    w.sources[0].habitat.x = 18.;
    w.sources[0].rebuild(&w.config, &w.field);
    if !active {
        let g = w.genomes.get_mut(&1).unwrap();
        for ch in &mut g.chromosomes {
            for e in &mut ch.chemistry.enzymes {
                e.center_x = 0.;
                e.center_y = 0.;
            }
        }
        g.compile(&w.config, &w.chemistry);
    }
    source_medium::project(&mut w);
    crate::diagnostics::initialize(&mut w);
    w
}

fn chemical_force(w: &World) -> [f64; 2] {
    let mut field = w.field.clone();
    field.body_signal.fill([0.; 2]);
    field.body_load.fill(0.);
    field.prepare_attraction();
    let mut config = w.config.clone();
    config.source_drift = 4.;
    source_medium::response(&w.sources[0], w.tick, &config, &field, &w.chemistry).velocity
}

#[test]
fn ordinary_paid_cell_work_changes_the_chemical_force_on_a_reservoir() {
    let mut active = cell_work(true);
    let mut control = cell_work(false);
    assert_eq!(chemical_force(&active), chemical_force(&control));
    for _ in 0..40 {
        active.step();
        control.step();
    }
    assert!(active.ledger.flows.imported > 0.);
    assert!(active.ledger.flows.reacted > 0.);
    assert!(active.ledger.flows.exported > 0.);
    assert!(active.ledger.flows.transport > 0.);
    let a = chemical_force(&active);
    let b = chemical_force(&control);
    assert!((a[0] - b[0]).hypot(a[1] - b[1]) > 1e-9, "{a:?} vs {b:?}");
    for w in [&active, &control] {
        w.validate().unwrap();
        let summary = crate::observation::summary(w);
        assert!(summary["materialResidual"].as_f64().unwrap().abs() < 1e-7);
        assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-7);
    }
}

#[test]
fn retired_attraction_gain_is_not_a_silent_configuration_control() {
    let mut config = serde_json::to_value(Config::default()).unwrap();
    config["attractionStrength"] = serde_json::json!(4.);
    assert!(serde_json::from_value::<Config>(config).is_err());
}
