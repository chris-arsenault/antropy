//! Operator reductions; no physical field or population frames leave the World owner.
use antropy_engine::{accounting::Ledger, ecology_observation::nearest_source, world::World};
use serde_json::{Value, json};
use std::collections::BTreeMap;

pub const MAX_NEIGHBORHOODS: usize = 256;

pub fn global(w: &World) -> Value {
    json!({"tick":w.tick,"modelSeconds":w.tick as f64*w.config.dt,
        "population":w.cells.len(),"biomass":w.cells.iter().map(|c| c.mass()).sum::<f64>(),
        "cellEnergy":w.cells.iter().map(|c| c.energy).sum::<f64>(),"ledger":w.ledger,
        "mortality":w.mortality,"recoveryEnabled":w.config.mortality_recovery,
        "recoveryResponse":w.mortality.response(&w.config),
        "sources":{"count":w.sources.len(),"nonempty":w.sources.iter().filter(|s| s.amount>0.).count(),
            "material":w.sources.iter().map(|s| s.amount).sum::<f64>()},"stopReason":w.stop_reason})
}
#[derive(Default)]
struct Residents {
    count: usize,
    mass: f64,
    energy: f64,
    accounts: Ledger,
    from_tick: Option<u64>,
    to_tick: u64,
}
pub fn point(w: &World) -> Value {
    let mut groups = BTreeMap::<usize, Residents>::new();
    for cell in &w.cells {
        let Some(index) = nearest_source(w, [cell.x, cell.y]) else {
            continue;
        };
        let group = groups.entry(index).or_default();
        group.count += 1;
        group.mass += cell.mass();
        group.energy += cell.energy;
        if let Some(active) = w.ecology.as_ref().and_then(|o| o.active.get(&cell.id)) {
            for window in active
                .previous
                .iter()
                .chain(std::iter::once(&active.current))
            {
                group.accounts.accumulate(&window.ledger.flows);
                group.from_tick = Some(
                    group
                        .from_tick
                        .map_or(window.from_tick, |t| t.min(window.from_tick)),
                );
                group.to_tick = group.to_tick.max(window.to_tick);
            }
        }
    }
    if let Some(observer) = &w.ecology {
        for &index in observer.local_endings.keys() {
            groups.entry(index).or_default();
        }
    }
    let total_groups = groups.len();
    let offset = if total_groups > MAX_NEIGHBORHOODS {
        ((w.tick / antropy_engine::ecology_observation::WINDOW) as usize % total_groups
            * MAX_NEIGHBORHOODS)
            % total_groups
    } else {
        0
    };
    let groups: Vec<_> = groups.into_iter().collect();
    let neighborhoods: Vec<_> = groups.iter().cycle().skip(offset).take(total_groups.min(MAX_NEIGHBORHOODS)).filter_map(|(index,g)| {
        let index = *index;
        let s = w.sources.get(index)?;
        let mut ranked: Vec<_> = s.mixture.iter().enumerate().map(|(i,q)| (i,*q)).collect();
        ranked.sort_by(|a,b| b.1.total_cmp(&a.1).then(a.0.cmp(&b.0)));
        ranked.truncate(8);
        let mut supply: Vec<_> = s.supply_condition.iter().enumerate().map(|(i,q)| (i,*q)).collect();
        supply.sort_by(|a,b| b.1.total_cmp(&a.1).then(a.0.cmp(&b.0)));
        supply.truncate(8);
        let endings = w.ecology.as_ref().and_then(|o| o.local_endings.get(&index)).copied().unwrap_or_default();
        Some(json!({"source":index,"position":[s.habitat.x,s.habitat.y],"radius":s.habitat.radius,
            "population":g.count,"biomass":g.mass,"cellEnergy":g.energy,
            "residentAccounts":{"fromTick":g.from_tick,"toTick":g.to_tick,"flows":g.accounts.flows},
            "endingsSincePreviousPoint":{"divisions":endings[0],"deaths":endings[1]},
            "stock":s.amount,"allowance":s.allowance,"wait":s.wait,"rate":s.rate,
            "accruedSupplyTime":s.pending,"emptyElapsed":s.empty_elapsed,
            "supplyMultiplier":w.shade.geography.season([s.habitat.x,s.habitat.y],w.tick as f64*w.config.dt),
            "totalReleased":s.total_released,"recentRecovery":s.recent_recovery,
            "recentOutput":s.recent_output,"topMixture":ranked,
            "topSupplyCondition":supply,
            "mixtureBreadth":1./s.mixture.iter().map(|q| q*q).sum::<f64>().max(1e-30)}))
    }).collect();
    json!({"at":super::ecology::now_ms(),"global":global(w),"neighborhoods":neighborhoods,
        "neighborhoodsTotal":total_groups,"neighborhoodsOmitted":total_groups.saturating_sub(MAX_NEIGHBORHOODS)})
}
