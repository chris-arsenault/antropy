//! Selected-cell recognition, funded expression and accepted histories remain distinct.
use crate::{chemistry::Affinity, world::World};
use serde_json::{Value, json};

fn site(kind: &str, slot: usize, affinity: &[Affinity], stock: f64) -> Value {
    let sum: f64 = affinity.iter().map(|a| a.value).sum();
    let squared: f64 = affinity.iter().map(|a| a.value * a.value).sum();
    json!({"kind":kind,"slot":slot,"fundedStock":stock,
        "support":affinity.len(),"totalAffinity":sum,
        "effectiveIdentities":if squared>0. {sum*sum/squared} else {0.}})
}

fn flow(values: impl Iterator<Item = f64>) -> Value {
    let entries: Vec<_> = values
        .enumerate()
        .filter(|(_, amount)| *amount > 0.)
        .collect();
    let mut ranked = entries.clone();
    ranked.sort_by(|a, b| b.1.total_cmp(&a.1).then(a.0.cmp(&b.0)));
    json!({"material":entries.iter().map(|(_,q)|q).sum::<f64>(),
        "identities":entries.len(),"largest":ranked.into_iter().take(16).collect::<Vec<_>>()})
}

pub fn observe(w: &World, id: u64) -> Result<Value, String> {
    let cell = w
        .cells
        .iter()
        .find(|c| c.id == id)
        .ok_or("Cell is not alive")?;
    let op = cell
        .operators
        .as_ref()
        .ok_or("Chemical operators unavailable")?;
    let mut sites = Vec::new();
    for slot in 0..4 {
        sites.push(site(
            "receptor",
            slot,
            &op.receptors[slot],
            cell.body[3 + slot],
        ));
        sites.push(site(
            "transporter",
            slot,
            &op.transporters[slot],
            cell.body[7 + slot],
        ));
    }
    let mut union = [false; 256];
    let mut expressed = [false; 256];
    for (slot, enzyme) in op.enzymes.iter().enumerate() {
        let stock = if cell.chemistry().programs[slot] {
            cell.body[crate::organism::enzyme_stock(slot)]
        } else {
            0.
        };
        let affinity: Vec<_> = enzyme
            .conversions
            .iter()
            .map(|edge| Affinity {
                species: edge.substrate,
                value: edge.binding,
            })
            .collect();
        sites.push(site("enzyme", slot, &affinity, stock));
        if stock > 0. {
            for edge in enzyme.conversions.iter() {
                union[edge.substrate] = true;
                if cell.action.activity[slot] > 0. {
                    expressed[edge.substrate] = true;
                }
            }
        }
    }
    sites.push(site("membrane", 0, &op.membrane, cell.mass()));
    let f = &cell.chemical_flows;
    Ok(
        json!({"tick":w.tick,"cell":id,"genome":cell.genome,"sites":sites,
        "fundedEnzymeUnion":union.iter().filter(|v|**v).count(),
        "requestedEnzymeUnion":expressed.iter().filter(|v|**v).count(),
        "lifetimeGross":{"imported":flow(f.imported.iter()),"exported":flow(f.exported.iter()),
            "consumed":flow(f.consumed.iter()),"produced":flow(f.produced.iter())},
        "lastStep":cell.flows,"energy":cell.energy,"activity":cell.action.activity,
        "limits":"Gross histories include repeated private cycles and re-imports; different exposure or lifetime can change them. Support and requested capacity are not accepted flows or marginal returns. These summaries do not establish transfer between cells."}),
    )
}
