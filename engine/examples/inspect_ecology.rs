//! Read-only checkpoint reductions for registered integrated studies; no World stepping.
use antropy_engine::{controller, footprint, organism::Cell, sensing, world::World};
use serde_json::{Value, json};
use std::{collections::BTreeMap, fs, io::Write, path::Path};
#[path = "inspection/cellular.rs"]
mod cellular;
#[path = "inspection/connections.rs"]
mod connections;

fn actions(a: controller::Action) -> [f64; 7] {
    [
        a.swim,
        a.turn,
        a.repair,
        a.transport[0],
        a.transport[1],
        a.transport[2],
        a.transport[3],
    ]
}

fn infer(w: &World, c: &Cell, inputs: &[f32]) -> [f64; 7] {
    let genome = &w.genomes[&c.genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .behavior;
    actions(controller::act(
        genome,
        inputs,
        &mut c.brain.clone(),
        &w.config,
        false,
    ))
}

fn optical_response(w: &World, c: &Cell) -> Value {
    let mut probe = c.clone();
    let g = w.genomes[&c.genome].compiled.as_ref().unwrap();
    sensing::observe(&mut probe, g, &w.config, &w.field);
    let normal = infer(w, c, &probe.inputs);
    let mut absent = probe.inputs.clone();
    absent[39..43].fill(0.);
    let mut reverse = probe.inputs.clone();
    reverse[41] *= -1.;
    reverse[42] *= -1.;
    let gain = c.body[15] / (c.body[15] + w.config.receptor_ratio * c.body[0]).max(1e-30);
    let mut brighter = probe.inputs.clone();
    brighter[39] = (brighter[39] as f64 + 0.05 * gain).min(gain) as f32;
    json!({"normal":normal,"absent":infer(w,c,&absent),
        "reverse":infer(w,c,&reverse),"brighter":infer(w,c,&brighter),
        "inputs":&probe.inputs[39..44]})
}

fn diet(c: &Cell) -> Value {
    let imports = &c.chemical_flows.imported;
    let total: f64 = imports.iter().sum();
    let mut ranking: Vec<_> = imports
        .iter()
        .enumerate()
        .filter(|(_, q)| *q > 0.)
        .collect();
    ranking.sort_by(|a, b| b.1.total_cmp(&a.1));
    ranking.truncate(3);
    json!({"imports":total,"source0":imports.value(0),"source136":imports.value(136),"top":ranking,
        "exports":c.chemical_flows.exported.iter().sum::<f64>(),
        "processed":c.chemical_flows.consumed.iter().sum::<f64>()})
}

#[derive(Default)]
struct Group {
    count: usize,
    ages: f64,
    imports: Vec<f64>,
    exports: Vec<f64>,
    consumed: Vec<f64>,
    produced: Vec<f64>,
    mass: f64,
}
impl Group {
    fn add(&mut self, w: &World, c: &Cell) {
        self.count += 1;
        self.ages += (w.tick - c.born) as f64 * w.config.dt;
        self.mass += c.mass();
        for (total, source) in [
            (&mut self.imports, &c.chemical_flows.imported),
            (&mut self.exports, &c.chemical_flows.exported),
            (&mut self.consumed, &c.chemical_flows.consumed),
            (&mut self.produced, &c.chemical_flows.produced),
        ] {
            total.resize(256, 0.);
            for (a, b) in total.iter_mut().zip(source.iter()) {
                *a += b;
            }
        }
    }
    fn report(self) -> Value {
        json!({"count":self.count,"survivorAgeSeconds":self.ages,"mass":self.mass,
            "imports":self.imports,"exports":self.exports,
            "consumed":self.consumed,"produced":self.produced})
    }
}

fn cells(w: &World) -> (Vec<Value>, Value) {
    let mut groups = BTreeMap::<u64, Group>::new();
    let graph = antropy_engine::interfaces::Graph::new(&w.cells, &w.config);
    let bodies = connections::body_signals(w);
    let rows = w
        .cells
        .iter()
        .enumerate()
        .map(|(index, c)| {
            let mut observed = c.clone();
            observed.interface = graph.reading(index, &w.cells, &w.config, &w.chemistry);
            groups.entry(c.lineage).or_default().add(w, c);
            let g = w.genomes[&c.genome].compiled.as_ref().unwrap();
            let sites = footprint::sites(c, &w.config, &w.field);
            let route = antropy_engine::chemical_roles::primary(c).map(|r| [r.input, r.output]);
            json!({"id":c.id,"parent":c.parent,"lineage":c.lineage,"genome":c.genome,
            "generation":c.generation,"born":c.born,"position":[c.x,c.y],"heading":c.heading,
            "body":c.body,"target":g.body,"energyFraction":c.energy/c.energy_capacity(&w.config),
            "damage":c.damage,"inventory":c.inventory.material(),"primary":route,
            "installed":c.chemistry(),"light":w.field.illumination.sample(&sites),
            "action":actions(c.action),"optical":optical_response(w,&observed),"diet":diet(c),
            "organization":cellular::inspect(w,&observed,&graph,index,&bodies),
            "lastStepFlows":c.flows,"chemicalFlows":c.chemical_flows})
        })
        .collect();
    let groups: BTreeMap<_, _> = groups.into_iter().map(|(id, g)| (id, g.report())).collect();
    (rows, json!(groups))
}

fn geography(w: &World) -> Value {
    let mut species = [0.; 256];
    let mut material = Vec::new();
    let mut light = Vec::new();
    let mut active_groups = 0;
    for (i, row) in w.field.amounts().rows() {
        material.push(row.iter().map(|v| *v as f64).sum::<f64>());
        light.push(w.field.illumination.node(i));
        for (a, b) in species.iter_mut().zip(row) {
            *a += *b as f64;
        }
        active_groups += row
            .chunks_exact(4)
            .filter(|g| g.iter().any(|v| *v > 0.))
            .count();
    }
    let sources: Vec<_> = w
        .sources
        .iter()
        .map(|s| {
            json!({
                "position":[s.habitat.x,s.habitat.y],"radius":s.habitat.radius,
                "inventory":s.inventory().collect::<Vec<_>>(),"composition":s.mixture,
                "amount":s.amount,"wait":s.wait,"rate":s.rate
            })
        })
        .collect();
    json!({"nx":w.field.nx,"ny":w.field.ny,"spacing":w.field.spacing,
        "material":material,"light":light,"species":species.as_slice(),
        "activeGroups":active_groups,"sources":sources})
}

fn storage(w: &World, bytes: usize) -> Result<Value, postcard::Error> {
    fn size<T: serde::Serialize>(value: &T) -> Result<usize, postcard::Error> {
        Ok(postcard::to_stdvec(value)?.len())
    }
    let sections = [
        ("cells", size(&w.cells)?),
        ("genomes", size(&w.genomes)?),
        ("field", size(&w.field)?),
        ("ancestry", size(&w.ancestry)?),
        ("sources", size(&w.sources)?),
        ("chemistry", size(&w.chemistry)?),
        ("events", size(&w.events)?),
    ];
    let accounted: usize = sections.iter().map(|(_, n)| n).sum();
    let live: std::collections::BTreeSet<_> = w.cells.iter().map(|c| c.genome).collect();
    let catalog: std::collections::BTreeSet<_> = w
        .events
        .iter()
        .filter(|e| e.kind == "catalog")
        .flat_map(|e| e.values.iter().copied())
        .collect();
    let mut genotypes = BTreeMap::<&str, [usize; 2]>::new();
    for (id, g) in &w.genomes {
        let kind = if live.contains(id) {
            "liveReferences"
        } else if g.parent.is_none() || catalog.contains(id) {
            "foundersOrCatalog"
        } else {
            "awaitingPruning"
        };
        let row = genotypes.entry(kind).or_default();
        row[0] += 1;
        row[1] += size(&(id, g))?;
    }
    Ok(
        json!({"tick":w.tick,"population":w.cells.len(),"checkpointBytes":bytes,
        "sections":sections.into_iter().collect::<BTreeMap<_,_>>(),
        "otherBytes":bytes-accounted,"genotypeCountAndEntryBytes":genotypes}),
    )
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 2
        && !(args.len() == 3
            && matches!(
                args[2].as_str(),
                "--ancestry" | "--storage" | "--connections"
            ))
    {
        return Err(
            "Expected checkpoint, new output JSON path and optional --ancestry, --storage or --connections".into(),
        );
    }
    let raw = fs::read(&args[0])?;
    let w = World::restore(&raw)?;
    let before = w.snapshot()?;
    let result = if args.get(2).is_some_and(|arg| arg == "--storage") {
        storage(&w, raw.len())?
    } else if args.get(2).is_some_and(|arg| arg == "--connections") {
        connections::inspect(&w)
    } else if args.len() == 3 {
        json!({"tick":w.tick,"ancestry":w.ancestry})
    } else {
        let (cells, groups) = cells(&w);
        json!({"tick":w.tick,"seed":w.seed,"config":w.config,"chemistry":w.chemistry,
            "summary":antropy_engine::observation::summary(&w),"cells":cells,
            "survivorLifetimeGroups":groups,"geography":geography(&w)})
    };
    assert_eq!(
        before,
        w.snapshot()?,
        "Read-only inspection changed physical state"
    );
    let mut out = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(Path::new(&args[1]))?;
    out.write_all(&serde_json::to_vec(&result)?)?;
    println!("tick={} cells={} output={}", w.tick, w.cells.len(), args[1]);
    Ok(())
}
