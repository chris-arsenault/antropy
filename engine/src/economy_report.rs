use crate::{chemistry::SPECIES, config::Config, economy, genetics::Genotype, world::World};
use serde_json::{Value, json};

fn cases(w: &World) -> Vec<Value> {
    let g = w.genomes[&1].compiled.as_ref().unwrap();
    let mut rows = vec![];
    for scale in [1., 2.] {
        for concentration in [0.01, 0.03, 0.1, 0.3, 1.] {
            for share in [0., 0.5, 1.] {
                let mut local = [0.; SPECIES];
                local[w.config.source_species[0]] = concentration * share;
                local[w.config.source_species[1]] += concentration * (1. - share);
                rows.push(
                    json!({"bodyScale":scale,"concentration":concentration,"firstShare":share,
                    "budget":economy::budget(&w.config,&w.chemistry,g,scale,&local,0.4,0.5)}),
                );
            }
        }
    }
    rows
}
fn investments(w: &World) -> Vec<Value> {
    let mut rows = vec![];
    for source in &w.config.source_species {
        for concentration in [0.03, 0.1] {
            let mut local = [0.; SPECIES];
            local[*source] = concentration;
            for locus in [7, 8, 11, 12] {
                for change in [0., 0.12] {
                    let mut g: Genotype = w.genomes[&1].clone();
                    g.chromosomes[0].physical[locus] += change;
                    g.compile(&w.config, &w.chemistry);
                    let b = economy::budget(
                        &w.config,
                        &w.chemistry,
                        g.compiled.as_ref().unwrap(),
                        1.,
                        &local,
                        0.4,
                        0.5,
                    );
                    rows.push(json!({"species":source,"concentration":concentration,
                        "locus":locus,"change":change,"budget":b}));
                }
            }
        }
    }
    rows
}
fn source_budget(w: &World) -> Value {
    let c = &w.config;
    let mean_duration_factor = 0.5 + 4. / 3.;
    let mean_sqrt_duration = 0.5 * 4.5_f64.sqrt() + 0.125 * (8_f64.sqrt()).asinh();
    let lifetime = c.source_lifetime * mean_duration_factor;
    let mean_rate = |richness: f64| {
        c.source_rate * richness * c.source_lifetime * mean_sqrt_duration
            / (lifetime + c.source_gap)
    };
    let release: f64 = w
        .sources
        .iter()
        .map(|s| mean_rate(s.habitat.richness))
        .sum();
    let sites: Vec<_> = w
        .sources
        .iter()
        .map(|s| {
            json!({"habitat":s.habitat,
        "initialReleaseRate":s.rate,"meanReleaseRate":mean_rate(s.habitat.richness),
        "remainingBatchMaterial":s.inventory.iter().sum::<f64>()})
        })
        .collect();
    let mut mean_local = [0.; SPECIES];
    if c.washout > 0. {
        for source in &w.sources {
            let q = mean_rate(source.habitat.richness) / (c.washout * c.width * c.height);
            mean_local[c.source_species[0]] += q * source.habitat.share;
            mean_local[c.source_species[1]] += q * (1. - source.habitat.share);
        }
    }
    let uniform = economy::budget(
        c,
        &w.chemistry,
        w.genomes[&1].compiled.as_ref().unwrap(),
        2.,
        &mean_local,
        0.4,
        0.5,
    );
    json!({"meanBatchLifetime":lifetime,"meanGap":c.source_gap,
        "activeFraction":lifetime/(lifetime+c.source_gap),"meanReleaseRate":release,
        "noConsumerMeanFieldMaterial":(c.washout>0.).then(||release/c.washout),
        "noConsumerMeanConcentration":(c.washout>0.).then(||release/c.washout/c.width/c.height),
        "washoutHalfLife":(c.washout>0.).then(||2_f64.ln()/c.washout),"sites":sites,
        "uniformMeanConcentrations":c.source_species.iter().map(|s|mean_local[*s]).collect::<Vec<_>>(),
        "hypotheticalUniformMeanBudget":(c.washout>0.).then_some(uniform)})
}
pub fn report(seed: u64, config: Config) -> Result<Value, String> {
    let w = World::new(seed, config)?;
    if w.config.source_species.len() != 2 {
        return Err("Economy report currently requires two supplied species".into());
    }
    if w.config.source_epochs.is_some() || w.config.source_zones.is_some() {
        return Err(
            "Renewal model requires fixed per-site mixtures; zones/epochs are not modeled".into(),
        );
    }
    let g = w.genomes[&1].compiled.as_ref().unwrap();
    let limits: Vec<_> = w.config.source_species.iter().map(|s| {
        let p = &w.chemistry.properties[*s];
        let full = economy::budget(&w.config, &w.chemistry, g, 2., &[0.; SPECIES], 1., 0.);
        let cap = 4. * std::f64::consts::PI * full.radius * p.diffusion
            / (w.config.diffusion_impedance * p.impedance).max(1e-300);
        let yield_per_unit = crate::chemistry::reaction_energy(p.potential,
            w.chemistry.properties[w.chemistry.decomposition].potential, w.config.conversion_efficiency).0;
        json!({"species":s,"properties":p,"fullParentRadius":full.radius,
            "diffusiveImportCeiling":cap,"directEnergyCeiling":cap*yield_per_unit,
            "parentMaintenance":full.maintenance,
            "unimpededWashoutLength":(w.config.washout>0.).then(||(p.diffusion/w.config.washout).sqrt())})
    }).collect();
    let startup: Vec<_> = w
        .cells
        .iter()
        .map(|cell| {
            let sites = w.field.stencil(cell.x, cell.y);
            let local = std::array::from_fn(|s| w.field.sample(s, &sites));
            json!({"cell":cell.id,"position":[cell.x,cell.y],
            "concentrations":w.config.source_species.iter().map(|s|local[*s]).collect::<Vec<_>>(),
            "budget":economy::budget(&w.config,&w.chemistry,g,1.,&local,0.4,0.5)})
        })
        .collect();
    Ok(
        json!({"schemaVersion":1,"ticksAdvanced":0,"seed":seed,"config":w.config,
        "chemistry":w.chemistry,"sourceLimits":limits,"renewal":source_budget(&w),
        "cases":cases(&w),"investments":investments(&w),"startup":startup,
        "assumptions":["Undamaged funded stocks; import effort one; motor effort 0.5 in budget cases",
            "No shared depletion, export, repair, refitting or movement through gradients",
            "Perfect processing is an upper bound for the founder terminal reaction network",
            "Closure holds internal inventory fixed and removes a proportional mixture as construction",
            "Renewal average excludes initial priming transient and timestep overshoot",
            "Positive surplus is a physical opportunity, not a reproductive or evolutionary result"]}),
    )
}
