use antropy_engine::{
    chemical_operators::Operators, chemistry::Chemistry, chemistry_atlas::atlas, config::Config,
    genetics::Machinery,
};
use serde_json::json;
#[test]
fn atlas_uses_live_compiler_and_validated_definition() {
    let report = atlas(101).unwrap();
    let chemistry = Chemistry::new(101).unwrap();
    assert_eq!(
        report["definition"]["properties"],
        json!(chemistry.properties)
    );
    for example in report["operators"]["examples"].as_array().unwrap() {
        let m: Machinery = serde_json::from_value(example["parameters"].clone()).unwrap();
        let op = Operators::compile(&m, &Config::default(), &chemistry);
        assert_eq!(example["membraneProfile"], json!(op.profile));
        let rows = example["representativeEnzyme"].as_array().unwrap();
        assert_eq!(rows.len(), op.enzymes[0].conversions.len());
        for (row, e) in rows.iter().zip(&op.enzymes[0].conversions) {
            assert_eq!(row["work"], e.work);
            assert_eq!(row["heat"], e.heat);
            assert_eq!(row["catalytic"], e.catalytic);
        }
    }
}
