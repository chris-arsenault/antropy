//! Reduced observation patches, with retained chart samples referenced by tick.
use serde_json::{Value, json};
use std::collections::BTreeMap;

pub fn status(current: &Value, previous: Option<&Value>) -> Value {
    let mut patch = serde_json::Map::new();
    for (key, value) in current.as_object().unwrap() {
        if key == "history" || key == "recent" {
            if previous.is_none_or(|p| p[key] != *value) {
                patch.insert(key.clone(), history(value, previous.map(|p| &p[key])));
            }
        } else if previous.is_none_or(|p| p[key] != *value) {
            patch.insert(key.clone(), value.clone());
        }
    }
    Value::Object(patch)
}
fn history(current: &Value, previous: Option<&Value>) -> Value {
    let old: BTreeMap<_, _> = previous
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|p| (p["tick"].as_u64().unwrap(), p))
        .collect();
    let mut keep = Vec::new();
    let mut append = Vec::new();
    for p in current.as_array().unwrap() {
        let tick = p["tick"].as_u64().unwrap();
        if old.get(&tick).is_some_and(|old| **old == *p) {
            keep.push(tick);
        } else {
            append.push(p);
        }
    }
    json!({"keep":keep,"append":append})
}
