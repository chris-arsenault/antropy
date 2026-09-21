use crate::{
    config::Config,
    controller::{self, LIGHT_INPUT},
    organism::PHOTO_STOCK,
    sensing,
    world::World,
};

fn world() -> World {
    World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 1,
            source_count: 0,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            ..Config::default()
        },
    )
    .unwrap()
}

fn observe(w: &mut World) -> [f32; 4] {
    let c = &mut w.cells[0];
    let g = w.genomes[&c.genome].compiled.as_ref().unwrap();
    sensing::observe(c, g, g, &w.config, &w.field);
    c.inputs[LIGHT_INPUT..LIGHT_INPUT + 4].try_into().unwrap()
}

#[test]
fn photoreceptor_reads_the_same_scalar_as_local_reaction_work() {
    let mut w = world();
    for tick in [0, 7500, 30000, 90000] {
        w.field
            .illumination
            .prepare(w.seed, tick, &w.config, w.field.nx, w.field.ny);
        let cell = &w.cells[0];
        let sites = crate::footprint::sites(cell, &w.config, &w.field);
        let light = w.field.illumination.sample(&sites);
        let medium = crate::reaction_medium::Medium::illuminated([1., -0.5], light);
        let gain = cell.body[PHOTO_STOCK]
            / (cell.body[PHOTO_STOCK] + w.config.receptor_ratio * cell.body[0]);
        assert!((observe(&mut w)[0] as f64 - gain * medium.drive[0] / (1. + light)).abs() < 1e-7);
    }
}

#[test]
fn local_optics_share_the_body_frame_and_periodic_geometry() {
    let mut w = world();
    assert_eq!(w.cells[0].inputs[LIGHT_INPUT + 1], 0.);
    w.cells[0].x = 7.4;
    w.cells[0].y = 9.2;
    w.cells[0].heading = 0.;
    let a = observe(&mut w);
    assert!(a[2].abs() + a[3].abs() > 1e-4);
    w.cells[0].heading = std::f64::consts::FRAC_PI_2;
    let b = observe(&mut w);
    assert!((a[0] - b[0]).abs() < 1e-7);
    assert!((a[3] - b[2]).abs() < 1e-7);
    assert!((a[2] + b[3]).abs() < 1e-7);
    w.cells[0].heading = std::f64::consts::PI;
    let c = observe(&mut w);
    assert!((a[2] + c[2]).abs() < 1e-7);
    assert!((a[3] + c[3]).abs() < 1e-7);
    // Both sample sets cross the seam and denote the same physical position.
    w.cells[0].x = 0.01;
    let seam = observe(&mut w);
    w.cells[0].x += w.config.width;
    assert_eq!(seam, observe(&mut w));
}

#[test]
fn funding_and_local_intensity_bound_sensitivity_and_adaptation() {
    let mut w = world();
    w.config.illumination_contrast = 0.;
    w.field
        .illumination
        .prepare(w.seed, 0, &w.config, w.field.nx, w.field.ny);
    let initial = observe(&mut w);
    assert!((initial[0] - 0.25).abs() < 1e-7);
    assert_eq!(&initial[2..], &[0., 0.]);
    for _ in 0..100 {
        sensing::adapt(&mut w.cells[0], &w.config, w.config.receptor_tau);
        observe(&mut w);
    }
    assert!(w.cells[0].inputs[LIGHT_INPUT + 1].abs() < 1e-7);
    w.cells[0].body[PHOTO_STOCK] *= 3.;
    assert!((observe(&mut w)[0] - 0.375).abs() < 1e-7);
    w.cells[0].body[PHOTO_STOCK] = 0.;
    let g = w.genomes[&w.cells[0].genome].compiled.as_ref().unwrap();
    sensing::initialize(&mut w.cells[0], g, &w.config, &w.field);
    assert_eq!(observe(&mut w), [0.; 4]);
    assert_eq!(w.cells[0].inputs[LIGHT_INPUT + 4], 0.);
}

#[test]
fn identical_local_cue_can_drive_opposite_neural_responses() {
    let mut w = world();
    let cue = observe(&mut w)[3];
    assert!(cue.abs() > 1e-5);
    for gain in [-16., 16.] {
        let g = controller::diagnostic([0.; 9], Some((LIGHT_INPUT + 3, 1, gain)));
        let action = controller::act(
            &g,
            &w.cells[0].inputs,
            &mut Default::default(),
            &w.config,
            false,
        );
        assert!(action.turn * cue as f64 * gain as f64 > 0.);
    }
}

#[test]
fn photo_targets_require_construction_and_actual_stock_splits_at_birth() {
    let mut w = world();
    let id = w.cells[0].genome;
    let g = w.genomes.get_mut(&id).unwrap();
    g.chromosomes[0].physical[PHOTO_STOCK] = 1.;
    g.compile(&w.config, &w.chemistry);
    let target = g.compiled.as_ref().unwrap();
    assert!((target.body[PHOTO_STOCK] - 2. * w.cells[0].body[PHOTO_STOCK]).abs() < 1e-12);
    let before = w.cells[0].clone();
    w.cells[0].energy = 0.;
    crate::metabolism::grow(&mut w.cells[0], target, &w.config, &w.chemistry, 1.);
    assert_eq!(before.body, w.cells[0].body);
    w.cells[0].energy = 10.;
    crate::metabolism::grow(&mut w.cells[0], target, &w.config, &w.chemistry, 1.);
    let c = &w.cells[0];
    assert!(c.body[PHOTO_STOCK] > before.body[PHOTO_STOCK]);
    assert!((c.mass() - before.mass() - c.flows.constructed).abs() < 1e-12);
    assert!((10. - c.energy - c.flows.constructed * w.config.construction_energy).abs() < 1e-12);
    assert!((c.bound_material.material() - c.mass()).abs() < 1e-12);
    assert!(c.basal(&w.config) > before.basal(&w.config));
    // Fixture grants an explicitly accounted mature body solely to exercise division.
    w.cells[0].set_fixture_body(target.body.map(|q| 2. * q));
    w.cells[0].inventory.set(0, 10.);
    w.cells[0].energy = 10.;
    let stock = w.cells[0].body[PHOTO_STOCK];
    crate::lifecycle::reproduce(&mut w);
    assert_eq!(w.cells.len(), 2);
    for c in &w.cells {
        assert_eq!(c.body[PHOTO_STOCK], stock * 0.5);
        assert_eq!(c.inputs[LIGHT_INPUT + 1], 0.);
        assert_eq!(
            w.genomes[&c.genome].chromosomes[0].physical[PHOTO_STOCK],
            1.
        );
    }
}

#[test]
fn photoreception_survives_checkpoint_and_rejects_nonfinite_memory() {
    let mut a = world();
    for _ in 0..12 {
        a.step();
    }
    let mut b = crate::boundary_tests::restored_state(&a);
    assert_eq!(a.cells[0].photoreceptor, b.cells[0].photoreceptor);
    assert_eq!(a.cells[0].brain.hidden, b.cells[0].brain.hidden);
    assert_eq!(a.cells[0].brain.traces, b.cells[0].brain.traces);
    let resumed_tick = a.tick + 8;
    for _ in 0..8 {
        a.step();
        b.step();
    }
    crate::boundary_tests::usable_continuation(&a, resumed_tick);
    crate::boundary_tests::usable_continuation(&b, resumed_tick);
    assert!(b.cells[0].photoreceptor.is_finite());
    b.cells[0].photoreceptor = f64::NAN;
    assert!(b.validate().is_err());
}
