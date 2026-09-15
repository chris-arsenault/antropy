//! Stateless chemistry/compiler inspection; pre-integration runtime curves are labeled separately.
use crate::chemistry::{Chemistry, affinity, coordinate, product, reaction_energy};
use crate::{
    chemical_operators::{CompiledOperators, OPERATOR_VERSION, OperatorCompiler},
    chemical_profiles::ProfileCoverage,
    genetics::Target,
    machinery_parameters::{
        EnzymeParameters, MachineryParameters, PARAMETER_VERSION, TransportParameters,
    },
};
use serde_json::{Value, json};
const NAMES: [&str; 4] = ["potential", "diffusion", "impedance", "stress"];
fn values(c: &Chemistry, s: usize) -> [f64; 4] {
    let p = &c.properties[s];
    [p.potential, p.diffusion, p.impedance, p.stress]
}
fn neighborhood(c: &Chemistry, target: [f64; 2], radius: f64) -> Value {
    let mut weights = [0.; 256];
    for (s, w) in weights.iter_mut().enumerate() {
        *w = affinity(target, s, radius);
    }
    let total: f64 = weights.iter().sum();
    let squares: f64 = weights.iter().map(|w| w * w).sum();
    let mut p = serde_json::Map::new();
    for (i, name) in NAMES.iter().enumerate() {
        p.insert(
            (*name).into(),
            json!(
                weights
                    .iter()
                    .enumerate()
                    .map(|(s, w)| w * values(c, s)[i])
                    .sum::<f64>()
                    / total
            ),
        );
    }
    json!({"effectiveSpecies":total*total/squares,"properties":p})
}
fn analysis(c: &Chemistry, radius: f64) -> Value {
    let neighborhoods: Vec<_> = (0..256)
        .map(|s| neighborhood(c, coordinate(s), radius))
        .collect();
    let barrier = neighborhoods
        .iter()
        .filter(|n| {
            n["properties"]["impedance"].as_f64().unwrap() >= 9.6
                && n["properties"]["diffusion"].as_f64().unwrap() <= 0.025
        })
        .count();
    let normalize = |x: f64, i: usize| {
        let (a, b) = crate::chemistry::RANGES[i];
        if i == 1 {
            (x / a).ln() / (b / a).ln()
        } else {
            (x - a) / (b - a)
        }
    };
    let neighbors:Vec<_>=NAMES.iter().enumerate().map(|(i,name)|{
        let mut delta=Vec::new();for s in 0..256 {for t in [product(s,1,0),product(s,0,1)] {delta.push((normalize(values(c,s)[i],i)-normalize(values(c,t)[i],i)).abs());}}
        json!({"name":name,"maximumNormalizedStep":delta.iter().copied().fold(0.,f64::max),"meanNormalizedStep":delta.iter().sum::<f64>()/delta.len() as f64})
    }).collect();
    let start = (0..256)
        .max_by(|a, b| {
            c.properties[*a]
                .impedance
                .total_cmp(&c.properties[*b].impedance)
        })
        .unwrap();
    let direction = if coordinate(start)[1] >= 8. { -1 } else { 1 };
    let path: Vec<_> = (0..16)
        .map(|step| product(start, 0, direction * step))
        .collect();
    let transitions: Vec<_> = path
        .windows(2)
        .map(|pair| {
            let (usable, heat) = reaction_energy(
                c.properties[pair[0]].potential,
                c.properties[pair[1]].potential,
                0.8,
            );
            json!({"from":pair[0],"to":pair[1],"usable":usable,"heat":heat})
        })
        .collect();
    json!({"width":radius,"neighbors":neighbors,"neighborhoods":neighborhoods,"affinityWeightedBarrierCount":barrier,"impedancePath":{"species":path,"transitions":transitions,"lawStatus":"pre-integration reference-energy reaction law"}})
}
fn curves() -> Value {
    let distance: Vec<_> = (0..151).map(|i| i as f64 / 10.).collect();
    let load: Vec<_> = (0..121)
        .map(|i| 10_f64.powf(-3. + i as f64 / 20.))
        .collect();
    let steps: Vec<_> = (0..101).map(|i| i as f64 / 100.).collect();
    let affinities=[1.,2.,3.,6.].map(|width|json!({"width":width,"distance":distance,"response":distance.iter().map(|x|affinity([*x,0.],0,width)).collect::<Vec<_>>()}));
    let targets=[0,16,32].map(|species|json!({"species":species,"steps":steps,"response":steps.iter().map(|x|affinity([*x,0.],species,3.)).collect::<Vec<_>>()}));
    let offsets = [0, 15, 120, 240, 255].map(|species| {
        let products = [-1, 0, 1].map(|dx| json!({"dx":dx,"dy":1,"product":product(species,dx,1)}));
        json!({"species":species,"products":products})
    });
    json!({"lawStatus":"pre-integration runtime laws; M2/M3 replacement pending","affinity":affinities,
        "load":load,"movement":load.iter().map(|v|crate::movement::mobility(*v,0.5)).collect::<Vec<_>>(),
        "diffusion":load.iter().map(|v|crate::field::mobility(*v,1.)).collect::<Vec<_>>(),
        "targetMutations":targets,"offsetMutations":offsets})
}

fn operator_examples(c: &Chemistry) -> Result<Value, String> {
    let compiler = OperatorCompiler::new(c)?;
    let mut examples = Vec::new();
    for (name, [x, y], offset) in [
        ("corner", [0., 0.], [1., 1.]),
        ("center", [7., 7.], [1., 0.]),
        ("fractional", [7.5, 7.5], [0.25, -0.75]),
        ("reflected", [14.5, 14.5], [1., 1.]),
        ("idle", [7., 7.], [0., 0.]),
    ] {
        let center = Target { x, y };
        let parameters = MachineryParameters {
            version: PARAMETER_VERSION,
            receptors: [center; 4],
            membrane: center,
            transporters: [TransportParameters { center }; 4],
            enzymes: [EnzymeParameters { center, offset }; 4],
        };
        let op = compiler.compile_target(&parameters)?;
        let conversions: Vec<_> = op.enzymes[0]
            .iter()
            .map(|c| {
                json!({
                    "substrate":c.substrate,
                    "products":c.products.iter().map(|p|json!({"species":p.species,"weight":p.weight})).collect::<Vec<_>>(),
                    "binding":c.binding,"attenuation":c.attenuation,"work":c.work,"heat":c.heat,
                })
            })
            .collect();
        examples.push(
            json!({"name":name,"parameters":parameters,"ownedBytes":op.owned_bytes(),
            "sharedDefinitionBytes":op.key.definition.len(),"membraneProfile":op.profile,
            "enzymeConversionCounts":op.enzymes.each_ref().map(|e|e.len()),
            "representativeEngagement":op.engagement[0].iter().map(|a|json!({"species":a.species,"weight":a.value})).collect::<Vec<_>>(),
            "representativeEnzyme":conversions}),
        );
    }
    Ok(
        json!({"version":OPERATOR_VERSION,"maximumOwnedBytes":CompiledOperators::maximum_owned_bytes(),
        "parameterVersion":PARAMETER_VERSION,
        "maximumConversions":crate::chemical_operators::MAX_CONVERSIONS,
        "maximumProducts":crate::chemical_operators::MAX_PRODUCTS,
        "scope":"canonical executable coefficients used by composed kernels; ordinary World integration pending M2-M4; slots repeat within each fixture",
        "byteScope":"target-sized structs and boxed payloads; excludes allocator overhead and shared definition",
        "examples":examples}),
    )
}

pub fn atlas(seed: u64) -> Result<Value, String> {
    let c = Chemistry::new(seed)?;
    let mut definition = serde_json::to_value(&c).unwrap();
    definition["ranges"] = json!(
        NAMES
            .into_iter()
            .zip(crate::chemistry::RANGES)
            .collect::<std::collections::BTreeMap<_, _>>()
    );
    let widths=[1.,2.,3.,6.].map(|width|json!({"width":width,"center":neighborhood(&c,[7.5,7.5],width),"corner":neighborhood(&c,[0.,0.],width)}));
    Ok(
        json!({"schemaVersion":6,"definition":definition,"coverage":c.coverage(),"analysis":analysis(&c,3.),
        "physicalCoverage":c.physical_coverage(),"coverageNames":crate::chemistry::COVERAGE_NAMES,
        "profileRanges":[[-1,1],[-1,1]],"profileCoverage":ProfileCoverage::measure(&c.properties),
        "operators":operator_examples(&c)?,
        "affinityWidths":widths,
        "curves":curves()}),
    )
}
