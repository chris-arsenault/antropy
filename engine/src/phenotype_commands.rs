use crate::{
    phenotype::{Observer, Pin, Selection},
    world::World,
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::collections::BTreeSet;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Configuration {
    enabled: bool,
    highlight: bool,
    selection: Selection,
    #[serde(default)]
    members: BTreeSet<u64>,
}

fn configure(w: &mut World, value: &Value) -> Result<Value, String> {
    let c: Configuration = serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
    if matches!(c.selection, Selection::Role { input, output } if input >= 256 || output >= 256)
        || c.members.len() > 100_000
        || c.members.iter().any(|id| *id == 0 || *id >= w.next_cell)
    {
        return Err("Invalid phenotype selection".into());
    }
    let o = w
        .observer
        .get_or_insert_with(|| Box::new(Observer::new(w.tick)));
    if c.selection != o.selection || (c.enabled && !o.active()) {
        o.reset(w.tick);
    }
    o.enabled = c.enabled;
    o.highlight = c.highlight;
    o.selection = c.selection;
    o.region = c.members;
    Ok(json!({}))
}

fn pin(w: &mut World, value: &Value) -> Result<Value, String> {
    let o = w.observer.as_ref().ok_or("Select a group before pinning")?;
    if o.pin.is_some() {
        return Err("Remove the current pin before replacing it".into());
    }
    let roots: BTreeSet<_> = w
        .cells
        .iter()
        .filter(|c| o.selected(c))
        .map(|c| c.id)
        .collect();
    let data = json!({"id":value.get("id"),"label":value.get("label"),
        "started":w.tick,"roots":roots});
    let p: Pin = serde_json::from_value(data).map_err(|e| e.to_string())?;
    let p = crate::phenotype::restore_pin(w, p)?;
    let o = w.observer.as_mut().unwrap();
    o.pin = Some(p);
    o.reset(w.tick);
    Ok(json!({}))
}

pub fn execute(w: &mut World, value: &Value) -> Result<Value, String> {
    match value.get("action").and_then(Value::as_str) {
        Some("configure") => configure(w, value),
        Some("report") => Ok(crate::phenotype_report::report(w)),
        Some("pin") => pin(w, value),
        Some("unpin") => {
            if let Some(o) = &mut w.observer {
                o.pin = None;
                if o.selection == Selection::Pin {
                    o.selection = Selection::All;
                }
                o.reset(w.tick);
            }
            Ok(json!({}))
        }
        Some("restorePin") => {
            let p = serde_json::from_value(value.get("pin").cloned().ok_or("Missing pin")?)
                .map_err(|e| e.to_string())?;
            let p = crate::phenotype::restore_pin(w, p)?;
            let o = w
                .observer
                .get_or_insert_with(|| Box::new(Observer::new(w.tick)));
            o.pin = Some(p);
            o.reset(w.tick);
            Ok(json!({}))
        }
        Some("pinRoots") => {
            let o = w
                .observer
                .as_ref()
                .and_then(|o| o.pin.as_ref())
                .ok_or("No pinned cohort")?;
            let offset = value
                .get("offset")
                .and_then(Value::as_u64)
                .ok_or("Invalid root page")?;
            if offset > 100_000 {
                return Err("Invalid root page".into());
            }
            let roots: Vec<_> = o.roots.iter().skip(offset as usize).take(256).collect();
            Ok(json!({"id":o.id,"label":o.label,"started":o.started,
                "total":o.roots.len(),"roots":roots}))
        }
        _ => Err("Unknown phenotype observation action".into()),
    }
}
