use crate::{
    genetics::{Chromosome, Compiled},
    organism::Cell,
    world::World,
};
use std::collections::BTreeMap;

#[derive(Default)]
pub struct Colors {
    selection: Option<(u32, u64, Option<u64>)>,
    genomes: BTreeMap<u64, [f32; 3]>,
    cells: BTreeMap<u64, [f32; 3]>,
    ancestors: BTreeMap<u64, u64>,
}
pub fn hue_rgb(h: f64) -> [f32; 3] {
    std::array::from_fn(|i| {
        let k = (h * 6. + [0., 4., 2.][i]).rem_euclid(6.);
        (0.9 - 0.65 * k.min(4. - k).clamp(0., 1.)) as f32
    })
}
fn heat(f: f64) -> [f32; 3] {
    hue_rgb((220. - 190. * f.clamp(0., 1.)) / 360.)
}
pub fn family(w: &World, c: &Cell) -> u64 {
    let mut id = c.id;
    for _ in 0..c.generation % 4 {
        if let Some(p) = crate::ancestry::get(&w.ancestry, id)
            .and_then(|a| a.parent())
            .filter(|p| crate::ancestry::get(&w.ancestry, *p).is_some())
        {
            id = p;
        }
    }
    id
}
pub fn ancestor_path(w: &World, mut id: u64) -> BTreeMap<u64, u64> {
    let mut path = BTreeMap::new();
    let mut depth = 0;
    while let Some(a) = crate::ancestry::get(&w.ancestry, id) {
        path.insert(id, depth);
        depth += 1;
        let Some(p) = a.parent() else {
            break;
        };
        id = p;
    }
    path
}
pub fn links(w: &World, reference: u64, id: u64, path: &BTreeMap<u64, u64>) -> Option<(u64, u64)> {
    let a = crate::ancestry::get(&w.ancestry, reference)?;
    let b = crate::ancestry::get(&w.ancestry, id)?;
    if a.lineage != b.lineage {
        return None;
    }
    let mut cursor = id;
    let mut steps = 0;
    loop {
        if let Some(n) = path.get(&cursor) {
            return Some((cursor, steps + n));
        }
        cursor = crate::ancestry::get(&w.ancestry, cursor)?.parent()?;
        steps += 1;
    }
}
fn physical(g: &Chromosome) -> Vec<f64> {
    let mut out: Vec<_> = g.physical.iter().map(|v| *v as f64).collect();
    let m = &g.chemistry;
    out.extend(m.inward);
    out.extend(m.programs.map(f64::from));
    out.push(f64::from(m.keys.is_some()));
    for (site, point) in m
        .receptors
        .iter()
        .map(|p| p.point())
        .chain(m.transporters.iter().map(|p| [p.x, p.y]))
        .chain(m.enzymes.iter().map(|p| [p.x, p.y]))
        .chain([m.membrane.point()])
        .enumerate()
    {
        if let Some(keys) = &m.keys {
            let key = keys.site(site);
            out.extend(key.weights);
            out.push(key.bias / crate::binding::BIAS_BOUND);
        } else {
            out.extend([point[0] / 15., point[1] / 15.]);
            out.extend([0.; 7]);
        }
    }
    for e in &m.enzymes {
        out.extend([e.center_x / 15., e.center_y / 15.]);
    }
    out
}
pub fn physical_distance(a: &Chromosome, b: &Chromosome) -> f64 {
    let left = physical(a);
    let right = physical(b);
    let angles: f64 = a
        .chemistry
        .enzymes
        .iter()
        .zip(&b.chemistry.enzymes)
        .map(|(a, b)| {
            (crate::genetics::angles::difference(a.angle, b.angle) / std::f64::consts::TAU).powi(2)
        })
        .sum();
    ((angles
        + left
            .iter()
            .zip(&right)
            .map(|(x, y)| (x - y).powi(2))
            .sum::<f64>())
        / (left.len() + crate::organism::MAX_ENZYMES) as f64)
        .sqrt()
}
fn genotype_color(g: &Compiled, reference: Option<&Compiled>, mode: u32) -> [f32; 3] {
    let m = &g.chromosome.chemistry;
    let b = &g.body;
    let membrane = crate::recognition_observation::preferred(&g.operators.membrane);
    let import = crate::recognition_observation::preferred(&g.operators.transporters[0]);
    let fraction = match mode {
        6 => membrane[0] / 15.,
        7 => membrane[1] / 15.,
        8 => b[1] / b[0] / 0.16,
        9 => {
            m.transporters
                .iter()
                .enumerate()
                .map(|(i, _)| b[7 + i])
                .sum::<f64>()
                / b[0]
                / 0.32
        }
        10 => {
            (0..crate::organism::MAX_ENZYMES)
                .map(|s| b[crate::organism::enzyme_stock(s)])
                .sum::<f64>()
                / b[0]
                / 0.32
        }
        12 | 13 => {
            let Some(r) = reference else {
                return [0.3, 0.35, 0.4];
            };
            if mode == 12 {
                physical_distance(&g.chromosome, &r.chromosome) / 0.1
            } else {
                crate::controller::genome_distance(&g.chromosome.behavior, &r.chromosome.behavior)
                    / 0.01
            }
        }
        _ => {
            return hue_rgb(
                (import[0] / 15. * 0.65 + import[1] / 15. * 0.25 + membrane[1] / 15. * 0.1).fract(),
            );
        }
    };
    heat(fraction)
}
impl Colors {
    pub fn prepare(&mut self, w: &World, mode: u32, selected: u64) {
        let reference = crate::ancestry::get(&w.ancestry, selected)
            .map(|a| a.genome)
            .filter(|id| w.genomes.contains_key(id));
        if self.selection != Some((mode, selected, reference)) {
            self.genomes.clear();
            self.cells.clear();
            self.ancestors = if mode == 11 {
                ancestor_path(w, selected)
            } else {
                BTreeMap::new()
            };
            self.selection = Some((mode, selected, reference));
        }
        if self.cells.len() > w.cells.len().saturating_mul(2) {
            self.cells.clear();
        }
        if self.genomes.len() > w.genomes.len().saturating_mul(2) {
            self.genomes.retain(|id, _| w.genomes.contains_key(id));
        }
    }
    pub fn color(
        &mut self,
        w: &World,
        c: &Cell,
        mode: u32,
        selected: u64,
        energy: f64,
    ) -> [f32; 3] {
        match mode {
            1 => hue_rgb((c.lineage as f64 * 0.618033988749895).fract()),
            2 => hue_rgb((c.genome as f64 * 0.618033988749895).fract()),
            3 => heat(energy),
            4 => hue_rgb(c.brain.task as f64 / 256.),
            5 => hue_rgb((family(w, c) as f64 * 0.618033988749895).fract()),
            14 | 15 => crate::chemical_roles::color(c, mode == 15),
            11 => *self.cells.entry(c.id).or_insert_with(|| {
                links(w, selected, c.id, &self.ancestors)
                    .map(|(_, n)| heat(n as f64 / 16.))
                    .unwrap_or([0.3, 0.35, 0.4])
            }),
            _ => *self.genomes.entry(c.genome).or_insert_with(|| {
                let reference = crate::ancestry::get(&w.ancestry, selected)
                    .and_then(|a| w.genomes.get(&a.genome))
                    .and_then(|g| g.compiled.as_ref());
                genotype_color(
                    w.genomes[&c.genome].compiled.as_ref().unwrap(),
                    reference,
                    mode,
                )
            }),
        }
    }
}
