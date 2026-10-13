//! Priced current-law opportunities, not evolved optical strategies.
use crate::{controller, diagnostics, organism::BUILDER_STOCK, world::World};
use serde_json::json;

#[test]
fn live_optics_refresh_derived_exposure_without_replacing_material() {
    let mut w = crate::ecology_direction_tests::allocation_world();
    w.cover.add(0, 128, 0.4, &w.chemistry);
    crate::cover::refresh(&mut w);
    let before = w.held();
    let map = w.shade.clone();
    crate::run_control::configure(
        &mut w,
        &json!({"patch":{
            "geographicShade":false,"opticalColumn":0.2,"opticalReach":3.,
            "opticalPowerDensity":0.02,"illuminationContrast":0.
        }}),
    )
    .unwrap();
    assert_eq!(w.held(), before);
    assert_eq!(w.shade.transmission, map.transmission);
    assert!((w.field.illumination.node(0) - (-0.5_f64).exp()).abs() < 1e-7);
    let raw = w.snapshot().unwrap();
    let budget = crate::optical_budget::cell(&w, &w.cells[0]);
    assert_eq!(budget["ticksAdvanced"], 0);
    assert_eq!(w.snapshot().unwrap(), raw);
    let restored = World::restore(&raw).unwrap();
    assert_eq!(
        restored.field.illumination.node(0),
        w.field.illumination.node(0)
    );
}

#[test]
fn paid_cover_can_preserve_a_usable_intermediate_under_the_shared_public_law() {
    // One local column, a finite offered food pulse, fixed ordinary chemical operators.
    // Decision: distinguish an absent preservation opportunity from insufficient cover return.
    let mut w = crate::ecology_direction_tests::allocation_world();
    w.config.illumination_contrast = 0.;
    w.config.geographic_shade = false;
    w.config.growth_rate = 1.;
    let g = w.genomes.get_mut(&2).unwrap();
    for ch in &mut g.chromosomes {
        ch.physical[BUILDER_STOCK] = 3.;
    }
    g.compile(&w.config, &w.chemistry);
    diagnostics::initialize(&mut w);
    w.cells[0].inventory.fill(0.);
    w.cells[0].inventory.set(128, 0.4);
    w.cells[0].energy = 1.;
    w.cells[0].action.cover = 1.;
    let sites = vec![crate::footprint::Row::from_slice(&[(0, 1.)])];
    w.field
        .illumination
        .prepare(w.seed, 0, &w.config, w.field.nx, w.field.ny);
    crate::cover::exchange(&mut w, &sites, 10.);
    let cost = w.cells[0].flows.cover_work;
    let op = crate::weathering::Operators::new(&w.chemistry);
    let branch = (0..crate::weathering::BRANCHES)
        .max_by(|&a, &b| op.heat[a][0].total_cmp(&op.heat[b][0]))
        .unwrap();
    let medium = crate::weathering::signal([
        1000. * op.coefficients[branch][0][0],
        1000. * op.coefficients[branch][1][0],
    ]);
    let mut captures = vec![];
    for light in [1., w.field.illumination.node(0)] {
        let mut food = [0.; 256];
        food[0] = 1.;
        let accounts = op
            .inventory_active(
                &mut food,
                crate::reaction_medium::Medium::illuminated(medium, light),
                10.,
                0.,
                u64::MAX,
            )
            .0;
        let mut cell = w.cells[0].clone();
        cell.inventory = food.into_iter().collect();
        cell.energy = 0.;
        cell.action.activity.fill(0.);
        cell.action.activity[1] = 1.;
        cell.flows = Default::default();
        crate::metabolism::react(&mut cell, &w.config, &w.chemistry, 1e6);
        let stored: f64 = cell
            .inventory
            .iter()
            .zip(&w.chemistry.properties)
            .map(|(q, p)| q * p.potential)
            .sum();
        let residual = w.chemistry.properties[0].potential + accounts[2]
            - accounts[1]
            - stored
            - cell.energy
            - cell.flows.reaction_heat;
        assert!(residual.abs() < 1e-8);
        captures.push((cell.energy, accounts[2], food[0]));
    }
    println!(
        "cover return: exposed={:?} covered={:?} depositionCost={cost}",
        captures[0], captures[1]
    );
    assert!(captures[1].2 > captures[0].2);
    assert!(captures[1].0 > captures[0].0);
    // Net payback is recorded independently; positivity is not a release requirement.
    println!(
        "cover net capture after deposition={}",
        captures[1].0 - captures[0].0 - cost
    );
}

#[test]
fn light_information_can_avoid_unnecessary_paid_deposition_in_darkness() {
    let mut w = crate::ecology_direction_tests::allocation_world();
    w.config.illumination_contrast = 0.;
    std::sync::Arc::make_mut(&mut w.shade).transmission.fill(0.);
    w.field.illumination.shade = w.shade.clone();
    w.field
        .illumination
        .prepare(w.seed, 0, &w.config, w.field.nx, w.field.ny);
    w.cells[0].inventory.fill(0.);
    w.cells[0].inventory.set(128, 0.4);
    w.cells[0].energy = 1.;
    let mut logits = vec![0.; controller::TOTAL_OUTPUTS];
    logits[controller::COVER] = -0.1;
    let informed = controller::diagnostics::authored(
        logits.clone(),
        Some((controller::LIGHT_INPUT, controller::COVER, 3.)),
    )
    .unwrap();
    // Same sensor/body/inference cost, wrong association asks for cover in darkness.
    logits[controller::COVER] = 0.8;
    let wrong = controller::diagnostics::authored(
        logits,
        Some((controller::LIGHT_INPUT, controller::COVER, -3.)),
    )
    .unwrap();
    let mut expenses = vec![];
    for brain in [&informed, &wrong] {
        let mut arm = World::restore(&w.snapshot().unwrap()).unwrap();
        diagnostics::initialize(&mut arm);
        let cell = &mut arm.cells[0];
        cell.action = controller::act(brain, &cell.inputs, &mut cell.brain, &arm.config, false);
        let rows = vec![crate::footprint::sites(cell, &arm.config, &arm.field)];
        crate::cover::exchange(&mut arm, &rows, 0.8);
        expenses.push(arm.cells[0].flows.cover_work);
    }
    let sensor_upkeep = w.config.maintenance * w.cells[0].body[crate::organism::PHOTO_STOCK] * 0.8;
    println!("dark information: deposition expenses={expenses:?} sensorUpkeep={sensor_upkeep}");
    assert!(expenses[1] - expenses[0] > sensor_upkeep);
}
