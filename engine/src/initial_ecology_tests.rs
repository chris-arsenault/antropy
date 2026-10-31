use crate::{chemical_products::Transform, config::Config, world::World};

fn alternative() -> Config {
    Config {
        width: 48.,
        height: 48.,
        source_count: 4,
        founder_circuit: [17, 81, 85, 21],
        source_species: vec![17, 85],
        ..Config::ecology()
    }
}

#[test]
fn alternative_startup_has_no_old_material_and_retargets_complete_founders() {
    let w = World::new(27, alternative()).unwrap();
    for forbidden in [0, 128] {
        for source in &w.sources {
            assert_eq!(source.mixture[forbidden], 0.);
            assert_eq!(source.supply_condition[forbidden], 0.);
        }
        for (_, row) in w.field.amounts().rows() {
            assert_eq!(row[forbidden], 0.);
        }
        for cell in &w.cells {
            assert_eq!(cell.inventory.value(forbidden), 0.);
            assert_eq!(cell.bound_material.value(forbidden), 0.);
        }
    }
    for (role, &from) in w.config.founder_circuit.iter().enumerate() {
        let to = w.config.founder_circuit[(role + 1) % 4];
        let g = &w.genomes[&(role as u64 + 1)];
        let c = g.compiled.as_ref().unwrap();
        let genes = &c.chromosome.chemistry;
        assert!(genes.keys.is_some());
        assert_eq!(genes.membrane, crate::genetics::Target::species(from));
        for i in 0..4 {
            let target = crate::genetics::Target::species(if i < 2 { from } else { to });
            assert_eq!(genes.receptors[i], target);
            assert_eq!(genes.transporters[i].x, target.x);
            assert_eq!(genes.transporters[i].y, target.y);
        }
        for e in &genes.enzymes {
            let products = Transform::new(*e).products(from);
            assert_eq!(products.len(), 1);
            assert_eq!(products[0].species, to);
            assert_eq!(products[0].weight, 1.);
        }
        for cell in w.cells.iter().filter(|cell| cell.genome == g.id) {
            assert!(cell.inventory.value(from) > 0. && cell.inventory.value(to) > 0.);
            assert!(cell.bound_material.value(from) > 0. && cell.bound_material.value(to) > 0.);
        }
    }
    let restored = World::restore(&w.snapshot().unwrap()).unwrap();
    assert_eq!(restored.config.founder_circuit, [17, 81, 85, 21]);
    assert_eq!(restored.snapshot().unwrap(), w.snapshot().unwrap());
}

#[test]
fn default_circuit_retains_original_exact_action_alleles() {
    let c = Config::ecology();
    let chemistry = crate::chemistry::Chemistry::new(c.chemistry_seed).unwrap();
    for role in 0..4 {
        let g = crate::genetics::founder::circuit(&c, &chemistry, role);
        for e in &g.compiled.as_ref().unwrap().chromosome.chemistry.enzymes {
            assert_eq!(e.center_x, if role % 2 == 0 { 4. } else { 0. });
            assert_eq!(e.center_y, if role % 2 == 0 { 0. } else { 4. });
        }
    }
}

#[test]
fn startup_circuit_rejects_invalid_identities_and_lengths() {
    for value in [
        serde_json::json!({"founderCircuit":[17,81,256,21]}),
        serde_json::json!({"founderCircuit":[17,81]}),
        serde_json::json!({"founderCircuit":[17,81,-1,21]}),
    ] {
        assert!(crate::configuration::parse(&value).is_err());
    }
}
