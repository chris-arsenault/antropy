//! Fixed-size dissolved-chemistry census. No field or cell records leave this reduction.
use crate::{chemistry::SPECIES, world::World};
use serde_json::{Value, json};

pub fn overview(w: &World) -> Value {
    let mut amounts = [0_f64; SPECIES];
    let mut peaks = [0_f32; SPECIES];
    for node in w.field.amounts.chunks_exact(SPECIES) {
        for (id, q) in node.iter().enumerate() {
            amounts[id] += *q as f64;
            peaks[id] = peaks[id].max(*q);
        }
    }
    let total = amounts.iter().sum::<f64>();
    let mut ids: Vec<_> = (0..SPECIES).filter(|id| amounts[*id] > 0.).collect();
    ids.sort_by(|a, b| amounts[*b].total_cmp(&amounts[*a]).then(a.cmp(b)));
    let present = ids.len();
    ids.truncate(12);
    let listed = ids.iter().map(|id| amounts[*id]).sum::<f64>();
    let rows: Vec<_> = ids
        .iter()
        .map(|id| {
            json!({
                "id":id, "amount":amounts[*id],
                "peak":peaks[*id] as f64 / w.field.spacing.powi(2)
            })
        })
        .collect();
    json!({"tick":w.tick,"total":total,"present":present,
        "other":(total-listed).max(0.),"rows":rows})
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ranking_closes_material_and_is_bounded_read_only_and_stable() {
        let mut w = crate::diagnostics::nutrition(0.8, 2., true, false);
        w.field.amounts.fill(0.);
        for id in 0..SPECIES {
            w.field.amounts[id] = 2.;
        }
        w.field.amounts[SPECIES + 19] = 4.;
        let before = w.field.amounts.clone();
        let result = overview(&w);
        let rows = result["rows"].as_array().unwrap();
        assert_eq!(rows.len(), 12);
        assert_eq!(rows[0]["id"], 19);
        assert_eq!(rows[1]["id"], 0);
        assert_eq!(rows[0]["amount"], 6.);
        assert_eq!(rows[0]["peak"], 4. / w.field.spacing.powi(2));
        let listed: f64 = rows.iter().map(|r| r["amount"].as_f64().unwrap()).sum();
        assert_eq!(listed + result["other"].as_f64().unwrap(), 516.);
        assert_eq!(result["present"], 256);
        assert!(result.to_string().len() < 4096);
        assert_eq!(before, w.field.amounts);
        w.field.amounts.fill(0.);
        assert_eq!(overview(&w)["rows"], json!([]));
    }
}
