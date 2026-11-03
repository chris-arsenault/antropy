//! Bounded paid cross-feeding on the shared World; no production organism policy is added.
use antropy_engine::{
    accounting::Ledger,
    binding::Key,
    chemistry::coordinate,
    config::Config,
    controller, diagnostics,
    genetics::Enzyme,
    observation,
    phenotype::{Observer, Pin, Selection},
    world::World,
};
use serde_json::json;
use std::{collections::BTreeSet, path::Path, time::Instant};

fn fixture(independent: bool, donor: bool, consumer: bool) -> super::Result<World> {
    let mut w = World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 2,
            source_count: 0,
            radial_founders: false,
            source_priming: 0.,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            learning_retention: 0.,
            binding_independent_strength: independent,
            ..Config::default()
        },
    )?;
    let packet = w.cells[0].bound_material.clone();
    for (i, g) in w.genomes.values_mut().enumerate() {
        let producer = i == 0;
        let (s, t) = if producer { (0, 136) } else { (136, 128) };
        let mut logits = vec![-3.; controller::TOTAL_OUTPUTS];
        logits[0] = 0.;
        logits[1] = 0.;
        logits[2] = 3.;
        logits[5] = 3.;
        logits[7] = 0.;
        logits[8] = 0.;
        logits[controller::ACTIVITY] = if (producer && donor) || (!producer && consumer) {
            3.
        } else {
            -3.
        };
        for ch in &mut g.chromosomes {
            ch.physical[7] = 3.;
            ch.physical[8] = 3.;
            ch.physical[11] = 3.;
            ch.chemistry.programs = std::array::from_fn(|j| j == 0);
            ch.chemistry.enzymes[0] = Enzyme::between(coordinate(s), coordinate(t));
            let mut key = Key::target(coordinate(s));
            if !producer {
                key.weights = key.weights.map(|v| v * 0.75);
            }
            let keys = ch.chemistry.keys.as_mut().unwrap();
            keys.receptors.fill(key);
            keys.transporters[0] = key;
            keys.transporters[1] = Key::target(coordinate(t));
            keys.enzymes[0] = key;
            keys.membrane = Key::target(coordinate(136));
            ch.behavior = controller::diagnostics::authored(logits.clone(), None)?;
        }
        g.compile(&w.config, &w.chemistry);
    }
    for (i, c) in w.cells.iter_mut().enumerate() {
        c.x = 12. + 2. * i as f64;
        c.y = 12.;
        c.heading = 0.;
        c.inventory.fill(0.);
        c.bound_material = packet.clone();
        c.energy = 0.5;
    }
    for n in 0..w.field.nx * w.field.ny {
        w.field.add(n, 0, 1.2, &w.chemistry);
    }
    diagnostics::initialize(&mut w);
    let mut observer = Observer::new(w.tick);
    observer.selection = Selection::Pin;
    observer.pin = Some(Pin {
        id: "secondary-consumer".into(),
        label: "Diagnostic consumer descendants".into(),
        started: 0,
        roots: BTreeSet::from([2]),
        live: BTreeSet::from([2]),
    });
    w.observer = Some(Box::new(observer));
    Ok(w)
}

pub fn run(root: &Path) -> super::Result<()> {
    std::fs::create_dir(root)?;
    super::save(
        &root.join("registration.json"),
        &json!({
        "question":"Does separating binding strength from chemical preference repair a sustaining secondary-resource route through an otherwise harmful preference intermediate?",
        "competingExplanations":["Recognition reshaping destroys total binding strength","Waste has no affordable conversion or ongoing physical access"],
        "initialConditions":"Two constructed paid genotypes; source0 pulse only; identical role-zero bound material, empty free inventory, energy0.5 each; recipient keys have weight magnitudes0.75 at unchanged bias-7. No mutation, learning or assimilation. Ordinary chemistry, transport and costs.",
        "prediction":"Normalized preference permits recipient funded growth and division using donor-exported136; coupled-strength, donor-off and consumer-enzyme-off arms lose that return.",
        "decision":"Retain or reject the normalization as a physical repair of an evolutionary intermediate, not proof of spontaneous consumer evolution.",
        "modelSecondsPerArm":200,"wallSecondsPerArm":60,"arms":4,
        "limits":"Constructed genotypes and finite pulse; not an evolved population or long-term coexistence."}),
    )?;
    for (name, independent, donor, consumer) in [
        ("coupled", false, true, true),
        ("independent", true, true, true),
        ("donor-off", true, false, true),
        ("consumer-off", true, true, false),
    ] {
        let mut w = fixture(independent, donor, consumer)?;
        let before = w.snapshot()?;
        let budget =
            antropy_engine::commands::execute(&mut w, &json!({"op":"bindingBudget","cell":2}))?;
        assert!(before == w.snapshot()?);
        super::save(&root.join(format!("{name}-budget.json")), &budget)?;
        let initial_mass = w.cells[1].mass();
        let mut ledger = Ledger::default();
        let (mut imported, mut consumed) = (0., 0.);
        let timer = Instant::now();
        let mut reason = "horizon";
        while w.tick as f64 * w.config.dt < 200. {
            if timer.elapsed().as_secs_f64() > 60. {
                reason = "wall cap";
                break;
            }
            let previous = w
                .observer
                .as_ref()
                .unwrap()
                .pin
                .as_ref()
                .unwrap()
                .live
                .clone();
            w.step();
            if w.stop_reason.is_some() {
                return Err(format!("Runtime failure {:?}", w.stop_reason).into());
            }
            let o = w.observer.as_mut().unwrap();
            let group = &o.current.groups[2];
            ledger.accumulate(&group.ledger.flows);
            ledger.division_heat += group.ledger.division_heat;
            ledger.overflow_heat += group.ledger.overflow_heat;
            let live = &o.pin.as_ref().unwrap().live;
            ledger.births += live.difference(&previous).count() as u64;
            for id in previous.difference(live) {
                match antropy_engine::ancestry::get(&w.ancestry, *id)
                    .unwrap()
                    .cause
                {
                    antropy_engine::ancestry::Cause::Division => ledger.divisions += 1,
                    _ => ledger.deaths += 1,
                }
            }
            imported += group.imports[136];
            consumed += (0..256).map(|t| group.routes[136 * 256 + t]).sum::<f64>();
            let extinct = o.pin.as_ref().unwrap().live.is_empty();
            o.reset(w.tick);
            if extinct {
                reason = "cohort extinction";
                break;
            }
        }
        w.validate()?;
        let live = &w.observer.as_ref().unwrap().pin.as_ref().unwrap().live;
        let cohort: Vec<_> = w.cells.iter().filter(|c| live.contains(&c.id)).collect();
        let mass: f64 = cohort.iter().map(|c| c.mass()).sum();
        let energy: f64 = cohort.iter().map(|c| c.energy).sum();
        let result = json!({"arm":name,"tick":w.tick,"reason":reason,"wallSeconds":timer.elapsed().as_secs_f64(),
            "consumerPopulation":cohort.len(),"consumerMass":mass,"netBiomass":mass-initial_mass,
            "netFundedWork":energy+ledger.flows.growth-0.5,"imported136":imported,"converted136":consumed,
            "consumerLedger":ledger,"summary":observation::summary(&w)});
        println!("{result}");
        super::save(&root.join(format!("{name}.json")), &result)?;
    }
    Ok(())
}
