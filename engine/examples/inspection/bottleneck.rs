//! Bounded frozen-state interventions using ordinary reaction and movement operators.
use antropy_engine::{footprint, illumination, metabolism, movement, organism, world::World};
use serde_json::{Value, json};

fn drives(w: &World, c: &organism::Cell, bodies: &[[f64; 2]]) -> [[f64; 2]; 5] {
    let sites = footprint::sites(c, &w.config, &w.field);
    let sample = |f: &dyn Fn(usize) -> [f64; 2]| {
        std::array::from_fn::<f64, 2, _>(|k| sites.iter().map(|&(n, a)| a * f(n)[k]).sum())
    };
    let material = sample(&|n| w.field.material_signal(n));
    let source = sample(&|n| w.field.source_signal()[n]);
    let body = sample(&|n| bodies[n]);
    let own = c.mass() / w.field.spacing.powi(2) * sites.iter().map(|&(_, a)| a * a).sum::<f64>();
    let profile = c.operators.as_ref().unwrap().profile;
    let total = std::array::from_fn(|k| material[k] + source[k] + body[k]);
    let alone = std::array::from_fn(|k| material[k] + source[k] + own * profile[k]);
    let no_body = std::array::from_fn(|k| material[k] + source[k]);
    let no_material = std::array::from_fn(|k| source[k] + body[k]);
    let solar = sites
        .iter()
        .map(|&(n, a)| a * w.field.illumination.solar(n))
        .sum();
    [total, alone, no_body, no_material, total]
        .into_iter()
        .enumerate()
        .map(|(i, s)| {
            let signal = metabolism::light_environment(c, &w.config, &w.chemistry, s);
            illumination::drive(signal, if i == 4 { 1. } else { solar })
        })
        .collect::<Vec<_>>()
        .try_into()
        .unwrap()
}

fn reactions(w: &World, bodies: &[[f64; 2]]) -> Vec<Value> {
    let mut executor = metabolism::Executor::default();
    w.cells
        .iter()
        .map(|c| {
            let outcomes: Vec<_> = drives(w, c, bodies)
                .into_iter()
                .map(|drive| {
                    let mut copy = c.clone();
                    copy.flows = Default::default();
                    executor.react(
                        &mut copy,
                        &w.config,
                        &w.chemistry,
                        w.config.dt,
                        false,
                        drive,
                    );
                    let potential = |cell: &organism::Cell| {
                        cell.inventory
                            .iter()
                            .zip(&w.chemistry.properties)
                            .map(|(q, p)| q * p.potential)
                            .sum::<f64>()
                    };
                    let residual = copy.energy + potential(&copy) + copy.flows.reaction_heat
                        - c.energy
                        - potential(c)
                        - copy.flows.external_work;
                    json!({"netWork":copy.energy-c.energy,"captured":copy.flows.captured,
                "external":copy.flows.external_work,"reacted":copy.flows.reacted,
                "energyResidual":residual,"materialResidual":copy.material()-c.material()})
                })
                .collect();
            json!({"id":c.id,"genome":c.genome,"lineage":c.lineage,
            "position":[c.x,c.y],"motorCore":c.body[1]/c.body[0],
            "maintenance":c.basal(&w.config,w.tick),
            "outcomes":outcomes})
        })
        .collect()
}

fn motion(w: &World, adhesion: f64) -> Vec<Value> {
    let mut cells = w.cells.clone();
    let mut config = w.config.clone();
    config.adhesion = adhesion;
    let sites: Vec<_> = cells
        .iter()
        .map(|c| footprint::sites(c, &config, &w.field))
        .collect();
    for c in &mut cells {
        c.flows = Default::default();
    }
    movement::advance(&mut cells, &config, &w.field, &sites);
    cells
        .iter()
        .map(|c| {
            json!({"id":c.id,"distance":c.flows.distance,
        "paid":c.flows.motors,"position":[c.x,c.y]})
        })
        .collect()
}

pub fn inspect(w: &mut World) -> Value {
    let bodies = super::connections::body_signals(w);
    let rows: Vec<_> = w
        .cells
        .iter()
        .map(|c| footprint::sites(c, &w.config, &w.field))
        .collect();
    // This derived cache is absent after restore; rebuild before the movement comparison.
    footprint::deposit_profiles(&w.cells, &w.config, &mut w.field, &rows);
    json!({"tick":w.tick,"dt":w.config.dt,"cells":reactions(w,&bodies),
        "workOrder":["solarBaseline","withoutNeighborBodies","withoutAnyBodies",
            "withoutDissolvedSignal","uniformSolarLight"],
        "motionNormal":motion(w,w.config.adhesion),"motionNoAdhesion":motion(w,0.),
        "meaning":"One frozen paid reaction interval with the current private light environment and paired movement steps on clones. Distance includes contact separation. Solar work only; no emitted-work allocation, world advancement, adaptation or survival claim."})
}
