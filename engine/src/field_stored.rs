//! Checkpoint layout. Derived feature arrays keep the v40 byte layout: they are written
//! from site projections and ignored on load, where `refresh` recomputes them from material.
use super::Field;
use serde::ser::SerializeStruct;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// Projection components recomputed from each saved row, so a snapshot depends only on
/// saved material and never on incremental rounding.
struct Derived<'a>(&'a Field, usize);
impl Derived<'_> {
    fn at(&self, n: usize) -> crate::spatial_material::Projection {
        let f = self.0;
        let (row, mask, projection) = f.amounts.site(n);
        match (&f.rows, mask) {
            (_, 0) => [0.; 6],
            (Some(rows), _) => crate::chemical_projection::project_active(row, rows, mask),
            (None, _) => projection,
        }
    }
}
impl Serialize for Derived<'_> {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let f = self.0;
        let n = f.nx * f.ny;
        let area = f.spacing * f.spacing;
        match self.1 {
            2 | 3 => s.collect_seq((0..n).map(|i| self.at(i)[self.1] / area)),
            _ => s.collect_seq((0..n).map(|i| {
                let p = self.at(i);
                [p[4] / area, p[5] / area]
            })),
        }
    }
}

impl Serialize for Field {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let mut state = s.serialize_struct("Field", 9)?;
        state.serialize_field("nx", &self.nx)?;
        state.serialize_field("ny", &self.ny)?;
        state.serialize_field("spacing", &self.spacing)?;
        state.serialize_field("amounts", &self.amounts)?;
        state.serialize_field("impedance", &Derived(self, 2))?;
        state.serialize_field("stress", &Derived(self, 3))?;
        state.serialize_field("signal", &Derived(self, 4))?;
        state.serialize_field("totals", &self.totals)?;
        state.serialize_field("drift", &self.drift)?;
        state.end()
    }
}

#[derive(Deserialize)]
struct Stored {
    nx: usize,
    ny: usize,
    spacing: f64,
    amounts: crate::spatial_material::Material,
    impedance: Vec<f64>,
    stress: Vec<f64>,
    signal: Vec<[f64; 2]>,
    totals: [f64; 2],
    drift: f64,
}

impl<'de> Deserialize<'de> for Field {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let s = Stored::deserialize(d)?;
        let n = s.nx.saturating_mul(s.ny);
        if n > crate::memory_budget::MAX_FIELD_NODES
            || s.nx < 4
            || s.ny < 4
            || s.amounts.len() != n * crate::chemistry::SPECIES
            || s.impedance.len() != n
            || s.stress.len() != n
            || s.signal.len() != n
        {
            return Err(serde::de::Error::custom("Invalid field state"));
        }
        Ok(Field::from_material(
            s.nx, s.ny, s.spacing, s.amounts, s.totals, s.drift,
        ))
    }
}
