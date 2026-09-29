use crate::{
    accounting, diagnostics, lifecycle, movement, organism::maintenance_rate, world::World,
};

fn close(a: f64, b: f64) {
    assert!((a - b).abs() < 1e-10 * (1. + a.abs()), "{a} != {b}");
}

fn parent() -> World {
    let mut w = diagnostics::nutrition(0.8, 2., false, false);
    w.tick = 30000;
    let c = &mut w.cells[0];
    c.set_fixture_body(c.body.map(|q| q * 2.));
    c.inventory.fill(0.);
    c.inventory.set(0, 3.);
    c.energy = 10.;
    c.damage = 0.2;
    c.heading = 0.25;
    c.brain.hidden.fill(0.5);
    c.brain.task = 17;
    c.action.swim = 0.8;
    c.action.turn = 0.3;
    w
}

#[test]
fn birth_orientation_and_axis_do_not_follow_parent_or_change_genetic_draws() {
    let mut a = parent();
    a.config.physical_mutation_rate = 1.;
    let mut rotated = a.clone();
    rotated.cells[0].heading += 1.7;
    let mut random = a.clone();
    random.rng = crate::random::Random::new(593);
    let (matter, energy) = a.held();
    for w in [&mut a, &mut rotated, &mut random] {
        lifecycle::reproduce(w);
        close(w.held().0, matter);
        close(w.held().1 + w.ledger.division_heat, energy);
        assert_eq!(w.cells.len(), 2);
        for c in &w.cells {
            close(c.damage, 0.2);
            close(c.age(&w.config, w.tick), 0.);
            assert_eq!(c.brain.hidden, vec![0.; 24]);
            assert_eq!(c.brain.task, 0);
            assert_eq!(c.action.swim, 0.);
            assert_eq!(c.action.turn, 0.);
            assert_eq!(c.contacts, [0.; 4]);
            close(
                movement::distance([c.x, c.y], [12., 12.], &w.config),
                c.radius(&w.config),
            );
        }
        assert_ne!(w.cells[0].heading, w.cells[1].heading);
    }
    for ((a, b), c) in a.cells.iter().zip(&rotated.cells).zip(&random.cells) {
        assert_eq!((a.x, a.y, a.heading), (b.x, b.y, b.heading));
        assert_ne!(a.heading, c.heading);
    }
    for (id, g) in a.genomes.iter() {
        assert_eq!(g.chromosomes, random.genomes[id].chromosomes);
    }
    assert_eq!(a.genetic_rng.0, random.genetic_rng.0);
    assert_eq!(a.environment_rng.0, random.environment_rng.0);
}

#[test]
fn integrated_age_upkeep_is_timestep_independent_and_funded() {
    let w = parent();
    for dt in [0.2, 0.5, 1.] {
        let mut config = w.config.clone();
        config.dt = dt;
        let mut c = w.cells[0].clone();
        let start = 6000.;
        let duration = 20.;
        let tick = (start / dt) as u64;
        let initial = c.energy;
        let mut paid = 0.;
        for offset in 0..(duration / dt) as u64 {
            paid += c.pay(c.basal(&config, tick + offset));
        }
        let expected =
            duration * maintenance_rate(&c.body, c.damage, start + duration / 2., &config);
        close(paid, expected);
        close(c.energy + paid, initial);
    }
}

#[test]
fn core_protection_trades_inherited_motor_capacity_for_slower_aging() {
    let w = parent();
    let mut cells = Vec::new();
    for motor_gene in [-0.5, 3.] {
        let mut g = w.genomes[&1].clone();
        for ch in &mut g.chromosomes {
            ch.physical[1] = motor_gene;
        }
        g.compile(&w.config, &w.chemistry);
        let mut c = w.cells[0].clone();
        crate::physiology::express(&mut c, g.compiled.as_ref().unwrap());
        cells.push(c);
    }
    let [protected, mobile] = [&cells[0], &cells[1]];
    close(protected.mass(), mobile.mass());
    close(
        maintenance_rate(&protected.body, 0., 0., &w.config),
        maintenance_rate(&mobile.body, 0., 0., &w.config),
    );
    assert!(protected.body[0] > mobile.body[0]);
    assert!(
        movement::motor_limits(protected, &w.config, 1.).0
            < movement::motor_limits(mobile, &w.config, 1.).0
    );
    assert!(
        maintenance_rate(&protected.body, 0., 6000., &w.config)
            < maintenance_rate(&mobile.body, 0., 6000., &w.config)
    );
    let doubled = protected.body.map(|q| 2. * q);
    let extra = |body: &crate::organism::Body| {
        maintenance_rate(body, 0., 6000., &w.config) - maintenance_rate(body, 0., 0., &w.config)
    };
    close(extra(&doubled), 2. * extra(&protected.body));
}

#[test]
fn newborns_rejuvenate_but_budding_parent_keeps_age_and_affordable_reserve() {
    for mode in ["fission", "budding"] {
        let mut w = parent();
        w.config.reproduction = mode.into();
        w.config.daughter_energy_fraction = 0.;
        w.cells[0].action = Default::default();
        let (_, required, _) = accounting::division_requirements(&w.cells[0], &w.config, w.tick);
        w.cells[0].energy = required;
        lifecycle::reproduce(&mut w);
        assert_eq!(w.cells.len(), 2);
        for c in &w.cells {
            let age = c.age(&w.config, w.tick);
            if c.id == 1 {
                assert_eq!(mode, "budding");
                close(age, 6000.);
                close(c.heading, 0.25);
                assert_eq!(c.brain.task, 17);
            } else {
                close(age, 0.);
            }
            assert!(
                c.energy + 1e-12 >= accounting::interval_reserve(c, &c.body, &w.config, w.tick)
            );
        }
        let restored = World::restore(&w.snapshot().unwrap()).unwrap();
        for (a, b) in w.cells.iter().zip(&restored.cells) {
            close(
                a.age(&w.config, w.tick),
                b.age(&restored.config, restored.tick),
            );
            close(
                a.basal(&w.config, w.tick),
                b.basal(&restored.config, restored.tick),
            );
            close(a.heading, b.heading);
        }
    }
}

#[test]
fn aging_time_must_be_positive_and_finite() {
    for value in [0., -1., f64::INFINITY, f64::NAN] {
        let config = crate::config::Config {
            aging_time: value,
            ..Default::default()
        };
        assert!(config.validate().is_err());
    }
}
