//! Shared new-world request parsing. Persisted Config values remain complete physical state.
use crate::config::Config;
use serde_json::Value;

pub fn parse(value: &Value) -> Result<Config, String> {
    let mut overrides = value
        .as_object()
        .cloned()
        .ok_or("World configuration must be an object")?;
    let base = match overrides.remove("preset") {
        None => Config::ecology(),
        Some(Value::String(name)) if name == "ecology" => Config::ecology(),
        Some(Value::String(name)) if name == "diagnostic" => Config::default(),
        _ => return Err("Configuration preset must be ecology or diagnostic".into()),
    };
    let mut effective = serde_json::to_value(base).map_err(|e| e.to_string())?;
    merge(&mut effective, Value::Object(overrides));
    let config: Config = serde_json::from_value(effective).map_err(|e| e.to_string())?;
    config.validate()?;
    Ok(config)
}

pub fn text(text: &str) -> Result<Config, String> {
    parse(&serde_json::from_str::<Value>(text).map_err(|e| e.to_string())?)
}

fn merge(base: &mut Value, changes: Value) {
    if let (Value::Object(target), Value::Object(source)) = (&mut *base, &changes) {
        for (key, value) in source {
            merge(target.entry(key).or_insert(Value::Null), value.clone());
        }
    } else {
        *base = changes;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn startup_and_commands_share_presets_and_nested_overrides() {
        for input in ["{}", "{ }", "\n{\n}\n", "{\"founders\":12}"] {
            let c = text(input).unwrap();
            assert_eq!(c.terrain, Config::ecology().terrain);
            assert!(!c.radial_founders);
            let request = json!({"config":serde_json::from_str::<Value>(input).unwrap()});
            let command = crate::commands::configuration(&request).unwrap();
            assert_eq!(
                command["config"]["terrain"],
                serde_json::to_value(c.terrain).unwrap()
            );
            assert_eq!(command["config"]["radialFounders"], false);
            assert!(!command["genotype"]["chromosomes"][0]["chemistry"]["keys"].is_null());
        }
        let c = parse(&json!({"terrain":{"seasons":false}})).unwrap();
        assert!(!c.terrain.seasons);
        assert!(c.terrain.movement && c.terrain.elevation);
        assert_eq!(
            parse(&json!({"preset":"diagnostic"})).unwrap().terrain,
            Config::default().terrain
        );
        let complete = serde_json::to_value(Config::default()).unwrap();
        assert_eq!(
            serde_json::to_value(parse(&complete).unwrap()).unwrap(),
            complete
        );
        for bad in [
            json!({"preset":"typo"}),
            json!({"terrain":{"typo":true}}),
            json!({"shadeScale":32}),
            json!({"landscapeRegions":35}),
            json!({"terrain":{"placementContrast":6}}),
            Value::Null,
        ] {
            assert!(parse(&bad).is_err());
        }
    }
}
