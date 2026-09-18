use crate::{
    chemical_operators::Operators,
    chemical_products::Transform,
    chemistry::{self, Chemistry},
    config::Config,
    diagnostics,
    genetics::{Enzyme, Machinery, angles},
};
use std::f64::consts::PI;

fn enzyme(angle: f64) -> Enzyme {
    Enzyme {
        x: 7.,
        y: 7.,
        dx: 1.,
        dy: -1.,
        angle,
    }
}
#[test]
fn rotated_and_reflected_frames_preserve_compiled_products_and_costs() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config::default();
    for e in [
        enzyme(0.37),
        Enzyme {
            x: 0.,
            y: 0.,
            dx: -2.3,
            dy: 1.1,
            angle: -1.2,
        },
    ] {
        for mirror in [false, true] {
            let map = |[x, y]: [f64; 2]| if mirror { [15. - x, y] } else { [15. - y, x] };
            let vector = |[x, y]: [f64; 2]| if mirror { [-x, y] } else { [-y, x] };
            let id = |s| {
                let [x, y] = map(chemistry::coordinate(s));
                x as usize * 16 + y as usize
            };
            let [x, y] = map([e.x, e.y]);
            let [dx, dy] = vector([e.dx, e.dy]);
            let other = Enzyme {
                x,
                y,
                dx,
                dy,
                angle: if mirror { -e.angle } else { e.angle },
            };
            let mut transformed = chemistry.clone();
            for s in 0..256 {
                transformed.properties[id(s)] = chemistry.properties[s].clone();
            }
            let mut m = Machinery::seed(&chemistry, &[0, 80]);
            m.enzymes[0] = e;
            let a = Operators::compile(&m, &c, &chemistry);
            m.enzymes[0] = other;
            let b = Operators::compile(&m, &c, &transformed);
            for edge in &a.enzymes[0].conversions {
                let other = b.enzymes[0]
                    .conversions
                    .iter()
                    .find(|x| x.substrate == id(edge.substrate))
                    .unwrap();
                assert!((edge.catalytic - other.catalytic).abs() < 1e-12);
                assert!((edge.work - other.work).abs() < 1e-12);
                let mut expected = [0.; 256];
                let mut actual = [0.; 256];
                for p in &edge.products {
                    expected[id(p.species)] += p.weight;
                }
                for p in &other.products {
                    actual[p.species] += p.weight;
                }
                assert!(
                    expected
                        .iter()
                        .zip(actual)
                        .all(|(a, b)| (a - b).abs() < 1e-12)
                );
            }
        }
        for s in 0..256 {
            let products = Transform::new(e).products(s);
            assert!(products.len() <= 8 && products.iter().all(|p| p.weight >= 0.));
            assert!((products.iter().map(|p| p.weight).sum::<f64>() - 1.).abs() < 1e-12);
        }
    }
}

#[test]
fn founders_share_a_map_instead_of_a_product_and_export_their_products() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config::default();
    let m = Machinery::seed(&chemistry, &[0, 80]);
    let reversed = Machinery::seed(&chemistry, &[80, 0]);
    let products: Vec<_> = m.enzymes[..2]
        .iter()
        .zip([0, 80])
        .map(|(e, s)| Transform::new(*e).products(s))
        .collect();
    assert_eq!(
        [m.enzymes[0].dx, m.enzymes[0].dy],
        [m.enzymes[1].dx, m.enzymes[1].dy]
    );
    assert!(
        products[0]
            .iter()
            .all(|a| products[1].iter().all(|b| a.species != b.species))
    );
    let operators = Operators::compile(&m, &c, &chemistry);
    for i in 0..2 {
        assert_eq!(m.enzymes[i], reversed.enzymes[1 - i]);
        assert_eq!(m.transporters[i + 2], reversed.transporters[3 - i]);
        let s = [0, 80][i];
        let edge = operators.enzymes[i]
            .conversions
            .iter()
            .find(|e| e.substrate == s)
            .unwrap();
        assert!(edge.work > 0.);
        assert!(products[i].iter().all(|p| {
            operators.transporters[i + 2]
                .iter()
                .any(|a| a.species == p.species && a.value > 0.)
        }));
    }
}

#[test]
fn angular_refit_pays_short_arc_and_preserves_unaffected_operators() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let mut cell = w.cells[0].clone();
    cell.energy = 1.;
    cell.installed.enzymes[0].angle = PI - 0.1;
    cell.operators = Some(Operators::compile(&cell.installed, &w.config, &w.chemistry));
    let unaffected = cell.operators.as_ref().unwrap().enzymes[1].clone();
    let old = cell.operators.as_ref().unwrap().enzymes[0].clone();
    let mut g = w.genomes[&1].clone();
    g.chromosomes[0].chemistry = cell.installed.clone();
    g.chromosomes[0].chemistry.enzymes[0].angle = -PI + 0.1;
    g.compile(&w.config, &w.chemistry);
    let target = g.compiled.as_ref().unwrap();
    let mut unfunded = cell.clone();
    unfunded.energy = 0.;
    crate::refitting::advance(&mut unfunded, target, &w.config, &w.chemistry, 1.);
    assert_eq!(unfunded.installed, cell.installed);
    crate::refitting::advance(&mut cell, target, &w.config, &w.chemistry, 1.);
    let expected = 0.25 * cell.body[11] * w.config.construction_energy;
    assert!((cell.flows.refitting - expected).abs() < 1e-12);
    assert!(
        (angles::difference(PI - 0.1, cell.installed.enzymes[0].angle)
            - 0.25 / w.config.affinity_radius)
            .abs()
            < 1e-12
    );
    assert!(!std::sync::Arc::ptr_eq(
        &old,
        &cell.operators.as_ref().unwrap().enzymes[0]
    ));
    assert!(std::sync::Arc::ptr_eq(
        &unaffected,
        &cell.operators.as_ref().unwrap().enzymes[1]
    ));
    crate::refitting::advance(&mut cell, target, &w.config, &w.chemistry, 10.);
    assert_eq!(cell.installed, target.chromosome.chemistry);
    assert!(std::sync::Arc::ptr_eq(
        &target.operators.enzymes[0],
        &cell.operators.as_ref().unwrap().enzymes[0]
    ));
}

#[test]
fn circular_expression_validation_and_continuation_cover_nonzero_angles() {
    assert!((angles::mean(PI - 0.1, -PI + 0.1).abs() - PI).abs() < 1e-12);
    assert_eq!(angles::mean(0., -PI), 0.);
    let mut w = diagnostics::nutrition(0.8, 2., true, false);
    let g = w.genomes.get_mut(&1).unwrap();
    g.chromosomes[0].chemistry.enzymes[0].angle = 0.7;
    g.compile(&w.config, &w.chemistry);
    diagnostics::initialize(&mut w);
    w.cells[0].installed.enzymes[0].angle = 0.2;
    w.cells[0].operators = Some(Operators::compile(
        &w.cells[0].installed,
        &w.config,
        &w.chemistry,
    ));
    let mut restored = crate::world::World::restore(&w.snapshot().unwrap()).unwrap();
    for _ in 0..8 {
        w.step();
        restored.step();
    }
    assert_eq!(w.snapshot().unwrap(), restored.snapshot().unwrap());
    for angle in [f64::NAN, f64::INFINITY, PI, -PI - 0.01] {
        let mut g = w.genomes[&1].clone();
        g.chromosomes[0].chemistry.enzymes[0].angle = angle;
        assert!(g.validate(&w.config).is_err());
        let mut m = w.cells[0].installed.clone();
        m.enzymes[0].angle = angle;
        assert!(m.validate().is_err());
    }
}

#[test]
fn diploid_expression_compiles_parameter_mixture_without_installing_it() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let mut c = w.config.clone();
    c.ploidy = "diploid".into();
    let mut g = w.genomes[&1].clone();
    g.chromosomes.push(g.chromosomes[0].clone());
    g.chromosomes[0].chemistry.enzymes[0] = enzyme(-0.4);
    g.chromosomes[1].chemistry.enzymes[0] = enzyme(1.2);
    g.compile(&c, &w.chemistry);
    g.validate(&c).unwrap();
    let expressed = g.compiled.as_ref().unwrap();
    let e = expressed.chromosome.chemistry.enzymes[0];
    assert!((e.angle - 0.4).abs() < 1e-12);
    let t = Transform::new(e);
    assert!(t.components().len() > 1);
    for row in &expressed.operators.enzymes[0].conversions {
        assert_eq!(row.products, t.products(row.substrate));
    }
    // Compiling an inherited target does not mutate any installed cell.
    assert_ne!(w.cells[0].installed.enzymes[0], e);
}
