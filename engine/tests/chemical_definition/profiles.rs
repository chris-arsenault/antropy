use antropy_engine::{
    chemical_profiles::ProfileBasis,
    chemistry::{Chemistry, coordinate},
};
pub const SEEDS: [u64; 8] = [1, 2, 3, 7, 42, 101, 202, 65535];

#[test]
fn original_property_arrays_are_preserved() {
    let expected = [
        0xdb27e452c21430af,
        0xcfbc03ea047c13f0,
        0x6cdcff58c8a5d3cf,
        0x41e7fa69a366f46b,
        0x6ba87b71c071322e,
        0x35cd10983d17dc34,
        0x426b0c0fa9443bcb,
        0x212945dafe883e02,
    ];
    for (seed, expected) in SEEDS.into_iter().zip(expected) {
        let chemistry = Chemistry::new(seed).unwrap();
        let mut hash = 0xcbf29ce484222325_u64;
        for p in chemistry.properties {
            for value in [p.potential, p.diffusion, p.impedance, p.stress] {
                for byte in value.to_le_bytes() {
                    hash = (hash ^ byte as u64).wrapping_mul(0x100000001b3);
                }
            }
        }
        println!("seed={seed} original-properties={hash:#x}");
        assert_eq!(hash, expected);
    }
}

#[test]
fn persisted_profiles_and_continuous_evaluation_agree() {
    for seed in SEEDS {
        let c = Chemistry::new(seed).unwrap();
        assert_eq!(c.version, 4);
        assert_eq!(
            postcard::to_stdvec(&c).unwrap(),
            postcard::to_stdvec(&Chemistry::new(seed).unwrap()).unwrap()
        );
        let restored: Chemistry = postcard::from_bytes(&postcard::to_stdvec(&c).unwrap()).unwrap();
        restored.validate().unwrap();
        for (s, p) in c.properties.iter().enumerate() {
            let evaluated = c.profiles.evaluate(coordinate(s));
            for (a, b) in p.interaction.into_iter().zip(evaluated) {
                assert!((a - b).abs() < 1e-12 && a.abs() <= 1.);
            }
        }
        for row in c.profiles.coefficients {
            let norm: f64 = row.iter().map(|v| v.abs()).sum();
            assert!(norm > 0. && norm.is_finite());
            assert!((row.iter().map(|v| (v / norm).abs()).sum::<f64>() - 1.).abs() < 1e-14);
        }
        for x in 0..31 {
            for y in 0..31 {
                assert!(
                    c.profiles
                        .evaluate([x as f64 / 2., y as f64 / 2.])
                        .iter()
                        .all(|v| v.abs() <= 1.)
                );
            }
        }
    }
}

#[test]
fn invalid_profile_definitions_are_rejected() {
    let c = Chemistry::new(101).unwrap();
    for value in [f64::NAN, f64::INFINITY] {
        let mut bad = c.clone();
        bad.profiles.coefficients[0][0] = value;
        assert!(bad.validate().is_err());
        let mut bad = c.clone();
        bad.properties[0].interaction[1] = value;
        assert!(bad.validate().is_err());
    }
    let mut bad = c.clone();
    bad.profiles.coefficients[0] = [0.; 16];
    assert!(bad.validate().is_err());
    let mut bad = c.clone();
    bad.properties[0].interaction[0] += 0.01;
    assert!(bad.validate().is_err());
    let mut json = serde_json::to_value(&c.profiles).unwrap();
    json["coefficients"][0].as_array_mut().unwrap().pop();
    assert!(serde_json::from_value::<ProfileBasis>(json).is_err());
}
