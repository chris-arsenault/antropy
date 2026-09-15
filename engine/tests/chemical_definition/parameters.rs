use antropy_engine::{genetics::Target, machinery_parameters::*};

pub fn fixture() -> MachineryParameters {
    let center = Target { x: 7.5, y: 7.5 };
    MachineryParameters {
        version: PARAMETER_VERSION,
        receptors: [center; 4],
        transporters: [TransportParameters { center }; 4],
        enzymes: [EnzymeParameters {
            center,
            offset: [0.25, -0.75],
        }; 4],
        membrane: center,
    }
}

#[test]
fn continuous_fixed_slots_roundtrip_and_have_separate_owners() {
    let mut target = fixture();
    target.validate().unwrap();
    let installed = InstalledParameters {
        revision: 7,
        parameters: target.clone(),
    };
    for offset in [-15., -1e-8, 0., 1e-8, 15.] {
        target.enzymes[0].offset[0] = offset;
        target.validate().unwrap();
        let json = serde_json::to_vec(&target).unwrap();
        assert_eq!(
            serde_json::from_slice::<MachineryParameters>(&json).unwrap(),
            target
        );
        let bytes = postcard::to_stdvec(&target).unwrap();
        assert_eq!(
            postcard::from_bytes::<MachineryParameters>(&bytes).unwrap(),
            target
        );
    }
    assert_eq!(installed.parameters, fixture());
    assert_eq!(installed.revision, 7);
    let bytes = postcard::to_stdvec(&installed).unwrap();
    assert_eq!(
        postcard::from_bytes::<InstalledParameters>(&bytes).unwrap(),
        installed
    );
    for edge in [0., 15.] {
        target.membrane = Target { x: edge, y: edge };
        target.enzymes[0].offset = [edge, -edge];
        target.validate().unwrap();
    }
}

#[test]
fn invalid_parameters_are_rejected_without_repair() {
    for value in [f64::NAN, f64::INFINITY, -0.001, 15.001] {
        let mut p = fixture();
        p.receptors[0].x = value;
        assert!(p.validate().is_err());
        p = fixture();
        p.membrane.y = value;
        assert!(p.validate().is_err());
    }
    for value in [f64::NAN, f64::NEG_INFINITY, -15.001, 15.001] {
        let mut p = fixture();
        p.enzymes[0].offset[1] = value;
        assert!(p.validate().is_err());
    }
    for value in [f64::NAN, f64::INFINITY, -0.001, 15.001] {
        let mut p = fixture();
        p.transporters[0].center.x = value;
        assert!(p.validate().is_err());
        p = fixture();
        p.enzymes[0].center.y = value;
        assert!(p.validate().is_err());
    }
    let mut p = fixture();
    p.version = 1;
    assert!(p.validate().is_err());
    for name in ["transporters", "enzymes"] {
        let mut json = serde_json::to_value(fixture()).unwrap();
        json[name][0]["coupling"] = serde_json::json!(0.5);
        assert!(serde_json::from_value::<MachineryParameters>(json).is_err());
    }
    for name in ["receptors", "transporters", "enzymes"] {
        let mut json = serde_json::to_value(fixture()).unwrap();
        json[name].as_array_mut().unwrap().pop();
        assert!(serde_json::from_value::<MachineryParameters>(json).is_err());
    }
}

#[test]
fn installed_response_survives_serialization_and_only_paid_changes_replace_it() {
    use antropy_engine::{
        chemical_operators::OperatorCompiler,
        composed::{
            Accounts, events,
            machinery::{ReactionWork, receptors},
        },
        config::Config,
        world::World,
    };
    let w = World::new(
        101,
        Config {
            founders: 1,
            ..Config::default()
        },
    )
    .unwrap();
    let compiler = OperatorCompiler::new(&w.chemistry).unwrap();
    let mut target = fixture();
    let mut installed = InstalledParameters {
        revision: 7,
        parameters: target.clone(),
    };
    let before = compiler.compile_installed(&installed).unwrap();
    let mut cell = w.cells[0].clone();
    cell.energy = 10.;
    cell.inventory.fill(0.1);
    let original_cell = postcard::to_stdvec(&cell).unwrap();
    target.receptors[0].x += 1.;
    let local = std::array::from_fn(|s| 0.1 + s as f64 / 255.);
    let unchanged = compiler.compile_installed(&installed).unwrap();
    assert_eq!(before, unchanged);
    assert_eq!(
        receptors(&cell, &before, &local),
        receptors(&cell, &unchanged, &local)
    );
    assert_ne!(
        receptors(&cell, &before, &local),
        receptors(&cell, &compiler.compile_target(&target).unwrap(), &local)
    );
    assert_eq!(postcard::to_stdvec(&cell).unwrap(), original_cell);
    let mut invalid = target.clone();
    invalid.version = 1;
    assert!(compiler.compile_target(&invalid).is_err());
    invalid = target.clone();
    invalid.enzymes[0].offset[0] = f64::NAN;
    assert!(compiler.compile_target(&invalid).is_err());
    assert_eq!(postcard::to_stdvec(&cell).unwrap(), original_cell);

    let mut actual = installed.parameters.receptors[0].point();
    let mut book = Accounts::default();
    assert!(
        events::remodel(
            &mut cell,
            &mut actual,
            target.receptors[0].point(),
            3,
            0.1,
            &mut book
        ) > 0.
    );
    assert!(book.heat > 0. && cell.energy < 10.);
    installed.parameters.receptors[0] = Target {
        x: actual[0],
        y: actual[1],
    };
    installed.revision += 1;
    let changed = compiler.compile_installed(&installed).unwrap();
    assert_ne!(before.key, changed.key);
    assert_ne!(
        receptors(&cell, &before, &local),
        receptors(&cell, &changed, &local)
    );

    let json = serde_json::to_vec(&installed).unwrap();
    let from_json: InstalledParameters = serde_json::from_slice(&json).unwrap();
    from_json.parameters.validate().unwrap();
    assert_eq!(from_json, installed);
    let bytes = postcard::to_stdvec(&installed).unwrap();
    let restored: InstalledParameters = postcard::from_bytes(&bytes).unwrap();
    restored.parameters.validate().unwrap();
    let rebuilt = compiler.compile_installed(&restored).unwrap();
    assert_eq!(changed, rebuilt);
    let mut next = cell.clone();
    let mut restored_next = cell.clone();
    let mut a = Accounts::default();
    let mut b = Accounts::default();
    let mut work = ReactionWork::default();
    assert_eq!(
        work.react(&mut next, &changed, &w.config, 0.2, &mut a),
        work.react(&mut restored_next, &rebuilt, &w.config, 0.2, &mut b)
    );
    assert_eq!(
        postcard::to_stdvec(&next).unwrap(),
        postcard::to_stdvec(&restored_next).unwrap()
    );
    assert_eq!(
        serde_json::to_value(a).unwrap(),
        serde_json::to_value(b).unwrap()
    );
}
