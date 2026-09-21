use crate::world::World;

/// A display sampling window. It never changes the physical mesh or simulation work.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Window {
    pub x: i32,
    pub y: i32,
    pub nx: usize,
    pub ny: usize,
    pub step: usize,
}
impl Window {
    pub fn full(w: &World) -> Self {
        Self {
            x: 0,
            y: 0,
            nx: w.field.nx,
            ny: w.field.ny,
            step: 1,
        }
    }
    pub fn node(&self, w: &World, i: usize) -> usize {
        let x = self.x + (i % self.nx * self.step + self.step / 2) as i32;
        let y = self.y + (i / self.nx * self.step + self.step / 2) as i32;
        y.rem_euclid(w.field.ny as i32) as usize * w.field.nx
            + x.rem_euclid(w.field.nx as i32) as usize
    }
    pub fn extent(&self, w: &World) -> [f32; 4] {
        [
            self.x as f32,
            self.y as f32,
            (self.nx * self.step) as f32,
            (self.ny * self.step) as f32,
        ]
        .map(|n| n * w.field.spacing as f32)
    }
    pub fn contains(&self, w: &World, x: f64, y: f64, radius: f64) -> bool {
        if *self == Self::full(w) {
            return true;
        }
        let [left, top, width, height] = self.extent(w).map(f64::from);
        [-w.config.width, 0., w.config.width]
            .iter()
            .any(|dx| x + dx + radius >= left && x + dx - radius <= left + width)
            && [-w.config.height, 0., w.config.height]
                .iter()
                .any(|dy| y + dy + radius >= top && y + dy - radius <= top + height)
    }
}
