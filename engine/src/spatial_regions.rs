//! A single sparse regional lifetime/index owner shared by material and derived operators.
#[derive(Clone, Debug, PartialEq)]
pub struct Entry<T> {
    pub id: usize,
    pub value: T,
}
#[derive(Clone, Debug, PartialEq)]
pub struct Regions<T> {
    slots: Vec<u32>,
    pub entries: Vec<Entry<T>>,
}
impl<T> Default for Regions<T> {
    fn default() -> Self {
        Self::new(0)
    }
}
impl<T> Regions<T> {
    pub fn new(count: usize) -> Self {
        Self {
            slots: vec![0; count],
            entries: Vec::new(),
        }
    }
    pub fn index_bytes(&self) -> usize {
        self.slots.capacity() * 4
    }
    pub fn get(&self, id: usize) -> Option<&T> {
        let slot = self.slots[id];
        (slot != 0).then(|| &self.entries[slot as usize - 1].value)
    }
    pub fn get_mut(&mut self, id: usize) -> Option<&mut T> {
        let slot = self.slots[id];
        (slot != 0).then(|| &mut self.entries[slot as usize - 1].value)
    }
    pub fn own(&mut self, id: usize, create: impl FnOnce() -> T) -> &mut T {
        if self.slots[id] == 0 {
            self.entries.push(Entry {
                id,
                value: create(),
            });
            self.slots[id] = self.entries.len() as u32;
        }
        self.get_mut(id).unwrap()
    }
    /// Position of an owned region in `entries`.
    pub fn slot(&self, id: usize) -> usize {
        self.slots[id] as usize - 1
    }
    pub fn take(&mut self, id: usize) -> Option<T> {
        let slot = self.slots[id];
        if slot == 0 {
            return None;
        }
        let i = slot as usize - 1;
        let removed = self.entries.swap_remove(i);
        self.slots[id] = 0;
        if i < self.entries.len() {
            self.slots[self.entries[i].id] = (i + 1) as u32;
        }
        Some(removed.value)
    }
    pub fn retain(&mut self, keep: impl Fn(&Entry<T>) -> bool) {
        let mut i = 0;
        while i < self.entries.len() {
            if keep(&self.entries[i]) {
                i += 1;
                continue;
            }
            let removed = self.entries.swap_remove(i);
            self.slots[removed.id] = 0;
            if i < self.entries.len() {
                self.slots[self.entries[i].id] = (i + 1) as u32;
            }
        }
    }
}
