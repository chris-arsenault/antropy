//! Rolling sums visit only the union of finite-support intervals on occupied lines.
use super::Support;
#[derive(Clone, Copy, Debug)]
struct Span {
    line: usize,
    start: usize,
    end: usize,
}
#[derive(Clone, Debug, Default)]
pub(super) struct Events {
    blocks: Vec<usize>,
    listed: Vec<bool>,
}
impl Events {
    pub fn axis(
        &mut self,
        out: &mut Support,
        input: &Support,
        shape: [usize; 2],
        width: f64,
        axis: usize,
    ) {
        const BLOCK: usize = 32;
        let count = shape[axis];
        let blocks = count.div_ceil(BLOCK);
        let radius = (width + 0.5).floor() as usize;
        out.reset(shape[0] * shape[1]);
        if radius == 0 {
            for &n in &input.nodes {
                out.add(n, input.values[n]);
            }
            return;
        }
        for key in self.blocks.drain(..) {
            self.listed[key] = false;
        }
        self.listed.resize(blocks * shape[1 - axis], false);
        for &n in &input.nodes {
            if input.values[n] == 0. {
                continue;
            }
            let (x, line) = if axis == 0 {
                (n % shape[0], n / shape[0])
            } else {
                (n / shape[0], n % shape[0])
            };
            if 2 * radius + 1 >= count {
                self.mark(line * blocks, 0, count, blocks);
            } else {
                let start = (x + count - radius) % count;
                let end = start + 2 * radius + 1;
                self.mark(line * blocks, start, end.min(count), blocks);
                if end > count {
                    self.mark(line * blocks, 0, end - count, blocks);
                }
            }
        }
        self.blocks.sort_unstable();
        let mut index = 0;
        while index < self.blocks.len() {
            let first = self.blocks[index];
            let mut end = first + 1;
            index += 1;
            while index < self.blocks.len()
                && self.blocks[index] == end
                && end / blocks == first / blocks
            {
                end += 1;
                index += 1;
            }
            let span = Span {
                line: first / blocks,
                start: first % blocks * BLOCK,
                end: ((end - first / blocks * blocks) * BLOCK).min(count),
            };
            line(out, input, shape, axis, span, width, radius);
        }
    }
    fn mark(&mut self, base: usize, start: usize, end: usize, _blocks: usize) {
        for block in start / 32..end.div_ceil(32) {
            let key = base + block;
            if !self.listed[key] {
                self.listed[key] = true;
                self.blocks.push(key);
            }
        }
    }
}

fn line(
    out: &mut Support,
    input: &Support,
    shape: [usize; 2],
    axis: usize,
    span: Span,
    width: f64,
    radius: usize,
) {
    let count = shape[axis];
    let node = |x| {
        if axis == 0 {
            span.line * shape[0] + x
        } else {
            x * shape[0] + span.line
        }
    };
    let interior = 2 * radius - 1;
    let mut remove = (span.start + count - (radius - 1) % count) % count;
    let mut left = (span.start + count - radius % count) % count;
    let mut right = (span.start + radius) % count;
    let mut sum = if interior >= count {
        (0..count).map(|x| input.values[node(x)]).sum::<f64>() * (interior / count) as f64
    } else {
        0.
    };
    for j in 0..interior % count {
        sum += input.values[node((remove + j) % count)];
    }
    let edge = width - radius as f64 + 0.5;
    let norm = 1. / (2. * width);
    let next = |x| if x + 1 == count { 0 } else { x + 1 };
    for x in span.start..span.end {
        let a = input.values[node(left)];
        let b = input.values[node(right)];
        out.add(node(x), (sum + edge * (a + b)) * norm);
        sum += b - input.values[node(remove)];
        remove = next(remove);
        left = next(left);
        right = next(right);
    }
}
