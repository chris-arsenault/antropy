//! Geometry of the persisted potential surface, independent of organism outcomes.
use crate::chemistry::Properties;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Topology {
    pub rising: [usize; 2],
    pub falling: [usize; 2],
    pub minima: usize,
    pub maxima: usize,
}

pub fn topology(properties: &[Properties]) -> Topology {
    let mut t = Topology {
        rising: [0; 2],
        falling: [0; 2],
        minima: 0,
        maxima: 0,
    };
    for s in 0..256 {
        let p = properties[s].potential;
        let mut smaller = true;
        let mut larger = true;
        for (axis, stride) in [16, 1].into_iter().enumerate() {
            let position = if axis == 0 { s / 16 } else { s % 16 };
            if position < 15 {
                let q = properties[s + stride].potential;
                t.rising[axis] += usize::from(q > p);
                t.falling[axis] += usize::from(q < p);
                smaller &= p < q;
                larger &= p > q;
            }
            if position > 0 {
                let q = properties[s - stride].potential;
                smaller &= p < q;
                larger &= p > q;
            }
        }
        t.minima += usize::from(smaller);
        t.maxima += usize::from(larger);
    }
    t
}

pub fn validate(properties: &[Properties]) -> Result<(), String> {
    let t = topology(properties);
    if t.rising.iter().chain(&t.falling).any(|n| *n < 60) || t.minima < 2 || t.maxima < 2 {
        Err("Chemical potential lacks multidirectional basins".into())
    } else {
        Ok(())
    }
}
