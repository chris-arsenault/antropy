use super::operators::cases;
use antropy_engine::{
    chemical_operators::{CompiledOperators, OPERATOR_VERSION, OperatorCompiler},
    chemical_profiles::ProfileCoverage,
    chemistry::Chemistry,
    chemistry_atlas::atlas,
};
use serde_json::json;

#[test]
fn stateless_atlas_exposes_canonical_definition_and_compiler_evidence() {
    // No World is constructed; the same entrypoint serves the no-handle harness command.
    let report = atlas(101).unwrap();
    assert_eq!(report["schemaVersion"], 6);
    let chemistry = Chemistry::new(101).unwrap();
    assert_eq!(
        report["definition"]["properties"],
        json!(chemistry.properties)
    );
    assert_eq!(report["profileRanges"], json!([[-1, 1], [-1, 1]]));
    assert_eq!(
        report["profileCoverage"],
        json!(ProfileCoverage::measure(&chemistry.properties))
    );
    assert_eq!(
        report["physicalCoverage"],
        json!(chemistry.physical_coverage())
    );
    assert_eq!(report["operators"]["version"], OPERATOR_VERSION);
    assert_eq!(
        report["operators"]["maximumOwnedBytes"],
        CompiledOperators::maximum_owned_bytes()
    );
    assert_eq!(
        report["curves"]["lawStatus"],
        "pre-integration runtime laws; M2/M3 replacement pending"
    );
    assert_eq!(
        report["analysis"]["impedancePath"]["lawStatus"],
        "pre-integration reference-energy reaction law"
    );
    let compiler = OperatorCompiler::new(&chemistry).unwrap();
    let examples = report["operators"]["examples"].as_array().unwrap();
    assert_eq!(examples.len(), 5);
    for (example, (name, parameters)) in examples.iter().zip(cases()) {
        let op = compiler.compile_target(&parameters).unwrap();
        assert_eq!(example["name"], name);
        assert_eq!(example["parameters"], json!(parameters));
        assert_eq!(example["ownedBytes"], op.owned_bytes());
        assert_eq!(
            example["representativeEngagement"],
            json!(
                op.engagement[0]
                    .iter()
                    .map(|a| json!({"species":a.species,"weight":a.value}))
                    .collect::<Vec<_>>()
            )
        );
        assert_eq!(
            example["enzymeConversionCounts"],
            json!(op.enzymes.each_ref().map(|e| e.len()))
        );
        let channels = example["representativeEnzyme"].as_array().unwrap();
        assert_eq!(channels.len(), op.enzymes[0].len());
        for (row, channel) in channels.iter().zip(&op.enzymes[0]) {
            assert_eq!(
                *row,
                json!({"substrate":channel.substrate,
                "products":channel.products.iter().map(|p|json!({"species":p.species,"weight":p.weight})).collect::<Vec<_>>(),
                "binding":channel.binding,"attenuation":channel.attenuation,"work":channel.work,"heat":channel.heat})
            );
        }
    }
}
