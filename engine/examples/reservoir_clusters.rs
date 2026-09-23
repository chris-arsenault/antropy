//! Constructed reservoir-coupling fixtures: pair approach, mismatched pair and cluster formation.
//! Usage: reservoir_clusters GAMMA RANGE DRIFT STEPS [SEED]
use antropy_engine::{config::Config, random::Random, source_medium, world::World};

const MATCHED: [(usize, f64); 2] = [(0, 0.6), (136, 0.4)];
const MISMATCHED: [(usize, f64); 1] = [(255, 1.)];

fn world(positions: &[[f64; 2]], mixtures: &[&[(usize, f64)]], c: &Config) -> World {
    let mut w = World::new(
        27,
        Config {
            founders: 0,
            source_count: positions.len(),
            source_priming: 0.,
            source_processing: 0.,
            ..c.clone()
        },
    )
    .unwrap();
    for (i, s) in w.sources.iter_mut().enumerate() {
        [s.habitat.x, s.habitat.y] = positions[i];
        s.habitat.radius = 3.;
        s.rebuild(&w.config, &w.field);
        s.mixture.fill(0.);
        for &(k, q) in mixtures[i % mixtures.len()] {
            s.mixture[k] = q;
        }
        // Zero release keeps the inventory, and so the charge, constant during the fixture.
        s.rate = 0.;
        s.amount = s.interface;
    }
    source_medium::project(&mut w);
    w
}

fn distance(w: &World, i: usize, j: usize) -> f64 {
    let a = [w.sources[i].habitat.x, w.sources[i].habitat.y];
    let b = [w.sources[j].habitat.x, w.sources[j].habitat.y];
    antropy_engine::movement::distance(a, b, &w.config)
}

/// Single-linkage groups within 15 units, just beyond the matched-pair equilibrium (~11).
fn groups(w: &World) -> Vec<usize> {
    let n = w.sources.len();
    let mut parent: Vec<usize> = (0..n).collect();
    fn find(p: &mut [usize], i: usize) -> usize {
        if p[i] != i {
            p[i] = find(p, p[i]);
        }
        p[i]
    }
    for i in 0..n {
        for j in i + 1..n {
            if distance(w, i, j) <= 15. {
                let (a, b) = (find(&mut parent, i), find(&mut parent, j));
                parent[a] = b;
            }
        }
    }
    let mut sizes = std::collections::BTreeMap::new();
    for i in 0..n {
        *sizes.entry(find(&mut parent, i)).or_insert(0) += 1;
    }
    let mut v: Vec<_> = sizes.into_values().collect();
    v.sort_unstable_by(|a, b| b.cmp(a));
    v
}

fn main() {
    let args: Vec<f64> = std::env::args()
        .skip(1)
        .map(|a| a.parse().unwrap())
        .collect();
    let (gamma, range, drift, steps) = (args[0], args[1], args[2], args[3] as usize);
    let seed = args.get(4).copied().unwrap_or(1.) as u64;
    let c = Config {
        width: 160.,
        height: 160.,
        reservoir_repulsion: gamma,
        reservoir_range: range,
        source_drift: drift,
        ..Config::default()
    };
    // Chemical response of the left reservoir along +x (toward the right one) at each separation.
    let profile: Vec<_> = [4., 6., 7., 8., 10., 12., 14., 16., 20., 24.]
        .iter()
        .map(|&d| {
            let w = world(
                &[[80. - d / 2., 80.], [80. + d / 2., 80.]],
                &[&MATCHED[..]],
                &c,
            );
            let g = w.field.gradient(&w.sources[0].footprint);
            let r = source_medium::response(&w.sources[0], 0, &w.config, &w.field, &w.chemistry);
            let p = [-0.51, 0.49];
            format!(
                "d={d}: v={:+.4} (a·gA={:+.4}, -b·gB={:+.4})",
                r.velocity[0],
                p[0] * g[0][0],
                -p[1] * g[0][1]
            )
        })
        .collect();
    if std::env::var("PROFILE").is_ok() {
        println!("{}", profile.join("\n"));
    }
    for (label, mixtures) in [
        ("matched pair", vec![&MATCHED[..]]),
        ("mismatched pair", vec![&MATCHED[..], &MISMATCHED[..]]),
    ] {
        let mut w = world(&[[74., 80.], [86., 80.]], &mixtures, &c);
        let start = distance(&w, 0, 1);
        let mut trace = vec![];
        for step in 0..steps {
            source_medium::advance(&mut w);
            if step % (steps / 5).max(1) == 0 {
                trace.push(format!("{:.2}", distance(&w, 0, 1)));
            }
        }
        println!(
            "{label}: start {start:.1} -> {:.2}  trace {}",
            distance(&w, 0, 1),
            trace.join(" ")
        );
    }
    let mut rng = Random::new(seed);
    let positions: Vec<_> = (0..30)
        .map(|_| [50. + 60. * rng.unit(), 50. + 60. * rng.unit()])
        .collect();
    let mut w = world(&positions, &[&MATCHED[..]], &c);
    println!("30 reservoirs start groups {:?}", groups(&w));
    for step in 1..=steps {
        source_medium::advance(&mut w);
        if step % (steps / 4).max(1) == 0 {
            println!("  step {step}: groups {:?}", groups(&w));
        }
    }
}
