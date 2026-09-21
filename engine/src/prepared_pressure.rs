//! Reciprocal edge contributions maintained as owner reductions, without row rescans.
use crate::movement::geometry::{Body, Edge};

fn unit(edge: Edge, bodies: &[Body]) -> [f64; 2] {
    if edge.length > 0. {
        return edge.direction();
    }
    let a = bodies[edge.i].heading;
    let b = bodies[edge.j].heading;
    let direction = [b[0] - a[0], b[1] - a[1]];
    let norm = (direction[0] * direction[0] + direction[1] * direction[1]).sqrt();
    if norm > 1e-12 {
        direction.map(|v| v / norm)
    } else {
        [0.; 2]
    }
}

pub(crate) fn directions(unit: [f64; 2], heading: [f64; 2]) -> [f64; 4] {
    let forward = unit[0] * heading[0] + unit[1] * heading[1];
    let left = -unit[0] * heading[1] + unit[1] * heading[0];
    [
        (1. + forward) * 0.25,
        (1. + left) * 0.25,
        (1. - forward) * 0.25,
        (1. - left) * 0.25,
    ]
}

#[derive(Clone, Copy, Debug, Default)]
pub(crate) struct Row {
    pub shift: [f64; 2],
    moment: [f64; 2],
    heading: [f64; 2],
    weight: f64,
}
impl Row {
    pub(super) fn gather(
        &mut self,
        owner: usize,
        incident: &[usize],
        edges: &[Edge],
        bodies: &[Body],
        dt: f64,
    ) {
        *self = Self::default();
        let relaxation = 0.5 * (1. - (-dt).exp());
        self.heading = bodies[owner].heading;
        for &index in incident {
            let edge = edges[index];
            let weight = edge.weight();
            let orientation = if owner == edge.i { 1. } else { -1. };
            let correction = ((edge.extent - edge.length) * relaxation).min(dt * 0.5) / dt;
            for (shift, direction) in self.shift.iter_mut().zip(unit(edge, bodies)) {
                *shift -= orientation * direction * correction;
            }
            for (value, direction) in self.moment.iter_mut().zip(edge.direction()) {
                *value += weight * orientation * direction;
            }
            self.weight += weight;
        }
    }
    pub fn field(&self) -> f64 {
        1. / (1. + self.weight.max(0.))
    }
    pub fn contacts(&self) -> [f64; 4] {
        let forward = self.moment[0] * self.heading[0] + self.moment[1] * self.heading[1];
        let left = -self.moment[0] * self.heading[1] + self.moment[1] * self.heading[0];
        [forward, left, -forward, -left]
            .map(|value| ((self.weight + value) * self.field() * 0.25).max(0.))
    }
}
#[derive(Clone, Debug, Default)]
pub(crate) struct Pressure {
    pub rows: Vec<Row>,
    pub dt: f64,
    relaxation: f64,
}
impl Pressure {
    pub fn set_dt(&mut self, dt: f64) {
        self.dt = dt;
        self.relaxation = 0.5 * (1. - (-dt).exp());
    }
    pub fn clear(&mut self, count: usize) {
        self.rows.resize(count, Row::default());
        self.rows.fill(Row::default());
    }
    pub fn accumulate(&mut self, edge: Edge, bodies: &[Body], sign: f64) {
        let weight = edge.weight();
        if weight == 0. {
            return;
        }
        let a = bodies[edge.i].heading;
        let b = bodies[edge.j].heading;
        let unit = unit(edge, bodies);
        let direction = edge.direction();
        let correction =
            ((edge.extent - edge.length) * self.relaxation).min(self.dt * 0.5) / self.dt;
        for (i, heading, orientation) in [(edge.i, a, 1.), (edge.j, b, -1.)] {
            let row = &mut self.rows[i];
            for (shift, direction) in row.shift.iter_mut().zip(unit) {
                *shift -= sign * orientation * direction * correction;
            }
            for (value, direction) in row.moment.iter_mut().zip(direction) {
                *value += sign * weight * orientation * direction;
            }
            row.heading = heading;
            row.weight += sign * weight;
        }
    }
}
