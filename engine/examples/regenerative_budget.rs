//! Zero-tick qualification of the white paper using the installed compiler.
use antropy_engine::{chemistry, config::Config, genetics::*, organism::Cell, world::World};
use serde_json::json;

fn main() {
    let c = Config {
        source_species: vec![0, 136],
        ..Config::default()
    };
    let w = World::new(27, c.clone()).unwrap();
    let p = &w.chemistry.properties;
    let reference = std::array::from_fn(|k| (p[0].interaction[k] + p[136].interaction[k]) / 2.);
    let mut rows = vec![];
    for (i, (s, t)) in [(0, 128), (128, 136), (136, 8), (8, 0)]
        .into_iter()
        .enumerate()
    {
        let mut g = Genotype::seed(&c, &w.chemistry);
        for a in &mut g.chromosomes {
            let from = Target::species(s);
            let to = Target::species(t);
            a.chemistry.membrane = from;
            a.chemistry.receptors = [from; 4];
            a.chemistry.transporters = std::array::from_fn(|j| {
                let q = if j < 2 { from } else { to };
                Transporter { x: q.x, y: q.y }
            });
            a.chemistry.enzymes = [Enzyme {
                x: from.x,
                y: from.y,
                center_x: if i % 2 == 0 { 4. } else { 0. },
                center_y: if i % 2 == 1 { 4. } else { 0. },
                angle: 0.,
            }; 4];
        }
        g.compile(&c, &w.chemistry);
        let compiled = g.compiled.as_ref().unwrap();
        let mut cell = Cell::new(1, 1, compiled, &c, &w.chemistry, [0., 0.], 0.);
        cell.inventory.fill(0.);
        cell.inventory.set(s, 0.4349583333333333);
        cell.inventory.set(t, 0.3650416666666667);
        cell.damage = 0.2;
        let reference_work = evaluate(&cell, &c, &w.chemistry, reference);
        let local: Vec<_> = w
            .cells
            .iter()
            .map(|at| {
                let sites = w.field.stencil(at.x, at.y);
                let medium = std::array::from_fn(|k| {
                    sites
                        .iter()
                        .map(|&(n, a)| a * w.field.medium_signal(n)[k])
                        .sum()
                });
                json!({"id":at.id,"medium":medium,"work":evaluate(&cell,&c,&w.chemistry,medium),
                "food":w.field.sample(s,&sites),"product":w.field.sample(t,&sites)})
            })
            .collect();
        rows.push(json!({"from":s,"to":t,"compiledRows":compiled.operators.enzymes[0].conversions.len(),
            "membraneProfile":compiled.operators.profile,"referenceWorkPerSecond":reference_work,
            "maintenance":antropy_engine::organism::maintenance_rate(&cell.body,cell.damage,&c),
            "division":antropy_engine::accounting::division_requirements(&cell,&c),"startup":local}));
    }
    let report = json!({"ticksAdvanced":0,"physicalVersion":w.version,"seed":27,
        "epsilon":119.31341917861687,"referenceMedium":reference,"rows":rows,
        "limits":"Initial source geometry only; cell body projection and donor competition are not included in startup samples. No controller or viability claim."});
    let text = serde_json::to_string_pretty(&report).unwrap();
    if let Some(path) = std::env::args().nth(1) {
        std::fs::write(path, text).unwrap();
    } else {
        println!("{text}");
    }
}

fn evaluate(cell: &Cell, c: &Config, chemistry: &chemistry::Chemistry, medium: [f64; 2]) -> f64 {
    let signal = antropy_engine::weathering::signal(medium);
    cell.operators
        .as_ref()
        .unwrap()
        .enzymes
        .iter()
        .enumerate()
        .map(|(slot, e)| {
            let occupancy: f64 = e
                .engagement
                .iter()
                .map(|a| a.value * cell.inventory[a.species])
                .sum();
            let factor = cell.body[11 + slot] * c.enzyme_turnover * (1. - cell.damage)
                / (c.receptor_k * cell.volume(c) + occupancy);
            e.conversions
                .iter()
                .map(|r| {
                    let from = &chemistry.properties[r.substrate];
                    let potential: f64 = r
                        .products
                        .iter()
                        .map(|p| p.weight * chemistry.properties[p.species].potential)
                        .sum();
                    let profile: [f64; 2] = std::array::from_fn(|k| {
                        r.products
                            .iter()
                            .map(|p| {
                                p.weight
                                    * (chemistry.properties[p.species].interaction[k]
                                        - from.interaction[k])
                            })
                            .sum()
                    });
                    let work = 119.31341917861687
                        * ((profile[0] * signal[0] - profile[1] * signal[1]) / 4.).max(0.);
                    let yield_ = chemistry::reaction_energy(
                        from.potential + work,
                        potential,
                        c.conversion_efficiency,
                    )
                    .0 - 0.05 * r.changed;
                    factor * r.catalytic * cell.inventory[r.substrate] * yield_
                })
                .sum::<f64>()
        })
        .sum()
}
