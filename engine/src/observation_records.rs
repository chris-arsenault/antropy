//! Byte and count limits shared by nonphysical diagnostic histories.
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::VecDeque;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Records {
    pub entries: VecDeque<Value>,
    pub dropped: u64,
    #[serde(skip)]
    bytes: usize,
    #[serde(skip)]
    count_limit: usize,
    #[serde(skip)]
    byte_limit: usize,
}
impl Records {
    pub fn new(count: usize, bytes: usize) -> Self {
        Self {
            entries: VecDeque::new(),
            dropped: 0,
            bytes: 0,
            count_limit: count,
            byte_limit: bytes,
        }
    }
    pub fn rebound(&mut self, count: usize, bytes: usize) {
        self.count_limit = count;
        self.byte_limit = bytes;
        self.bytes = self.entries.iter().map(size).sum();
        self.trim();
    }
    pub fn push(&mut self, value: Value) {
        let bytes = size(&value);
        if bytes > self.byte_limit {
            self.dropped += 1;
            return;
        }
        self.bytes += bytes;
        self.entries.push_back(value);
        self.trim();
    }
    pub fn can_push(&self, value: &Value) -> bool {
        self.entries.len() < self.count_limit && self.bytes + size(value) <= self.byte_limit
    }
    fn trim(&mut self) {
        while self.entries.len() > self.count_limit || self.bytes > self.byte_limit {
            let Some(value) = self.entries.pop_front() else {
                break;
            };
            self.bytes -= size(&value);
            self.dropped += 1;
        }
    }
    pub fn decimate(&mut self) {
        let old = std::mem::take(&mut self.entries);
        self.bytes = 0;
        for (i, value) in old.into_iter().enumerate() {
            if i.is_multiple_of(2) {
                self.push(value);
            } else {
                self.dropped += 1;
            }
        }
    }
    pub fn drain(&mut self) -> impl Iterator<Item = Value> + '_ {
        self.bytes = 0;
        self.entries.drain(..)
    }
}
fn size(value: &Value) -> usize {
    value.to_string().len() + 1
}
