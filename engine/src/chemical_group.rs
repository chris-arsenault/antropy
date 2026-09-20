//! Exact (S16 × S16) ⋊ C2 actions on bounded chemical identities.
//! Kinetic mixtures of these actions are not themselves group elements.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Action {
    axes: [[u8; 16]; 2],
    swapped: bool,
}

impl Action {
    pub fn identity() -> Self {
        Self {
            axes: [std::array::from_fn(|i| i as u8); 2],
            swapped: false,
        }
    }

    pub fn apply(&self, species: usize) -> usize {
        let p = [species / 16, species % 16];
        let j = usize::from(self.swapped);
        self.axes[0][p[j]] as usize * 16 + self.axes[1][p[1 - j]] as usize
    }

    /// self after rhs, on stored identities, with no projection.
    pub fn compose(&self, rhs: &Self) -> Self {
        let j = usize::from(self.swapped);
        Self {
            axes: std::array::from_fn(|a| {
                std::array::from_fn(|i| self.axes[a][rhs.axes[a ^ j][i] as usize])
            }),
            swapped: self.swapped ^ rhs.swapped,
        }
    }

    pub fn inverse(&self) -> Self {
        let mut result = Self::identity();
        let j = usize::from(self.swapped);
        result.swapped = self.swapped;
        for a in 0..2 {
            for i in 0..16 {
                result.axes[a ^ j][self.axes[a][i] as usize] = i as u8;
            }
        }
        result
    }

    /// Reflect the interval whose image stays in bounds; fix its complement.
    pub fn intervals(k: [u8; 2]) -> Self {
        assert!(k.iter().all(|&x| x <= 30));
        Self {
            axes: k.map(|k| {
                std::array::from_fn(|i| {
                    let other = k as i16 - i as i16;
                    if (0..16).contains(&other) {
                        other as u8
                    } else {
                        i as u8
                    }
                })
            }),
            swapped: false,
        }
    }

    pub fn quarter(turns: u8) -> Self {
        let q = turns % 4;
        Self {
            axes: std::array::from_fn(|a| {
                let reversed = if a == 0 { q == 1 || q == 2 } else { q >= 2 };
                std::array::from_fn(|i| if reversed { 15 - i as u8 } else { i as u8 })
            }),
            swapped: q % 2 == 1,
        }
    }

    pub fn adjacent(axis: usize, lower: usize) -> Self {
        assert!(axis < 2 && lower < 15);
        let mut result = Self::identity();
        result.axes[axis].swap(lower, lower + 1);
        result
    }

    /// Coordinate-bit exchange: a total involution at one of four dyadic scales.
    pub fn dyadic(axis: usize, bit: usize) -> Self {
        assert!(axis < 2 && bit < 4);
        let mut result = Self::identity();
        result.axes[axis] = std::array::from_fn(|i| (i ^ (1 << bit)) as u8);
        result
    }
}

/// D4 action on continuous recognition parameters, not a projection.
pub fn quarter_point([x, y]: [f64; 2], turns: u8) -> [f64; 2] {
    match turns % 4 {
        0 => [x, y],
        1 => [15. - y, x],
        2 => [15. - x, 15. - y],
        _ => [y, 15. - x],
    }
}

/// A local edge selects a transposition; an outward edge selects identity.
pub fn neighbor(species: usize, axis: usize, direction: i8) -> usize {
    assert!(axis < 2 && (direction == -1 || direction == 1));
    let coordinate = [species / 16, species % 16][axis];
    let target = coordinate as i16 + direction as i16;
    if !(0..16).contains(&target) {
        species
    } else {
        Action::adjacent(axis, coordinate.min(target as usize)).apply(species)
    }
}
