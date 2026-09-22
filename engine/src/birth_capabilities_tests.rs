use crate::{config::Config, diagnostics, genetics::Transporter, organism::Cell, world::World};

#[test]
fn mutant_budding_uses_daughter_capabilities_and_conserves_inheritance() {
    let mut w = diagnostics::nutrition(0.8, 2., false, false);
    w.config.reproduction = "budding".into();
    w.config.physical_mutation_rate = 1.;
    w.config.physical_mutation_scale = 0.5;
    let body = w.cells[0].body.map(|q| q * 2.);
    w.cells[0].set_fixture_body(body);
    w.cells[0].energy = 1.;
    w.cells[0].interface.recognition = [[10.; 5]; 4];
    let parent = w.cells[0].clone();
    let before = w.held();
    crate::lifecycle::reproduce(&mut w);
    assert_eq!(w.cells.len(), 2);
    let daughter = &w.cells[1];
    assert_ne!(daughter.genome, parent.genome);
    assert_ne!(daughter.chemistry(), parent.chemistry());
    let g = w.genomes[&daughter.genome].compiled.as_ref().unwrap();
    assert_eq!(daughter.chemistry(), &g.chromosome.chemistry);
    assert_eq!(daughter.interface, crate::interfaces::Reading::default());
    assert_eq!(daughter.receptors, [0.; 4]);
    assert_eq!(w.cells[0].chemistry(), parent.chemistry());
    assert_eq!(w.cells[0].genome, parent.genome);
    assert!((daughter.mass() - parent.mass() * 0.5).abs() < 1e-12);
    assert_eq!(
        daughter.bound_material.iter().collect::<Vec<_>>(),
        parent.bound_material.half().iter().collect::<Vec<_>>()
    );
    assert_eq!(
        daughter.inventory.iter().collect::<Vec<_>>(),
        parent.inventory.half().iter().collect::<Vec<_>>()
    );
    for (actual, compiled) in daughter
        .operators
        .as_ref()
        .unwrap()
        .enzymes
        .iter()
        .zip(&g.operators.enzymes)
    {
        assert!(std::sync::Arc::ptr_eq(actual, compiled));
    }
    let after = w.held();
    assert!((before.0 - after.0).abs() < 1e-12);
    assert!((before.1 - after.1 - w.ledger.division_heat).abs() < 1e-12);
    w.validate().unwrap();
    let mut restored = World::restore(&w.snapshot().unwrap()).unwrap();
    let born: Vec<_> = restored
        .cells
        .iter()
        .map(|c| (c.id, c.chemistry().clone()))
        .collect();
    for _ in 0..20 {
        restored.step();
        for cell in &restored.cells {
            if let Some((_, configuration)) = born.iter().find(|(id, _)| *id == cell.id) {
                assert_eq!(cell.chemistry(), configuration);
            }
        }
    }
    assert!(
        born.iter()
            .all(|(id, _)| restored.cells.iter().any(|c| c.id == *id))
    );
}

fn uptake(cell: &Cell, w: &World, species: usize) -> f64 {
    let mut cell = cell.clone();
    cell.inventory.fill(0.);
    cell.action.transport.fill(1.);
    let mut field = crate::field::Field::new(w.config.width, w.config.height, w.config.mesh);
    field.deposit(cell.x, cell.y, species, 10., &w.chemistry);
    let sites = vec![crate::footprint::sites(&cell, &w.config, &field)];
    crate::transport::Exchange::default().advance(
        std::slice::from_mut(&mut cell),
        &w.config,
        &mut field,
        &w.chemistry,
        &sites,
        (&mut crate::accounting::Ledger::default(), None),
    );
    cell.flows.imported
}

#[test]
fn changed_birth_importers_gain_new_food_and_can_lose_parent_food() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let mut parent_genes = w.genomes[&1].clone();
    parent_genes.chromosomes[0].chemistry.transporters = [Transporter { x: 0., y: 0. }; 4];
    parent_genes.compile(&w.config, &w.chemistry);
    let mut parent = w.cells[0].clone();
    parent.operators = Some(parent_genes.compiled.as_ref().unwrap().operators.clone());
    let mut daughter_genes = parent_genes.clone();
    daughter_genes.chromosomes[0].chemistry.transporters = [Transporter { x: 15., y: 15. }; 4];
    daughter_genes.compile(&w.config, &w.chemistry);
    let mut daughter = parent.clone();
    daughter.operators = Some(daughter_genes.compiled.as_ref().unwrap().operators.clone());
    assert_eq!(daughter.body, parent.body);
    assert_eq!(daughter.energy, parent.energy);
    assert!(uptake(&parent, &w, 0) > 0.);
    assert_eq!(uptake(&daughter, &w, 0), 0.);
    assert_eq!(uptake(&parent, &w, 255), 0.);
    assert!(uptake(&daughter, &w, 255) > 0.);
    assert!(daughter.chemistry().programs.iter().filter(|&&v| v).count() > 1);
}

#[test]
fn living_gene_transfer_setting_is_rejected_and_inspection_has_one_configuration() {
    let mut config = serde_json::to_value(Config::default()).unwrap();
    config["transferRate"] = serde_json::json!(1.);
    assert!(serde_json::from_value::<Config>(config).is_err());
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let view = crate::observation::inspect(&w, 1).unwrap();
    assert_eq!(
        view["expressed"]["chemistry"],
        serde_json::to_value(w.cells[0].chemistry()).unwrap()
    );
    for key in ["installed", "machineryGenome", "machineryRevision"] {
        assert!(view["cell"].get(key).is_none());
    }
    let patch = crate::observation::selected(&w, 1, &serde_json::json!({"genome":1})).unwrap();
    assert!(patch.get("expressed").is_none());
    assert!(patch.get("installedChemistry").is_none());
}
