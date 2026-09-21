//! Direct addressing for ordinary IDs; sparse overflow accepts arbitrary imported IDs.
use std::collections::HashMap;

const PAGE_SIZE: usize = 256;
const DIRECTORY_PAGES: u64 = 65_536;
const EMPTY: usize = usize::MAX;

#[derive(Clone, Debug)]
struct Page {
    slots: [usize; PAGE_SIZE],
    occupied: usize,
}
impl Default for Page {
    fn default() -> Self {
        Self {
            slots: [EMPTY; PAGE_SIZE],
            occupied: 0,
        }
    }
}

#[derive(Clone, Debug, Default)]
pub(super) struct Slots {
    // At most 512 KiB of directory pointers on native / 256 KiB on wasm32.
    // Slot pages are allocated only for represented IDs and freed when empty.
    directory: Vec<Option<Box<Page>>>,
    overflow: HashMap<u64, Box<Page>>,
}
impl Slots {
    pub fn get(&self, id: u64) -> Option<usize> {
        let page = id / PAGE_SIZE as u64;
        let entries = if page < DIRECTORY_PAGES {
            self.directory.get(page as usize)?.as_deref()?
        } else {
            self.overflow.get(&page)?
        };
        let slot = entries.slots[id as usize % PAGE_SIZE];
        (slot != EMPTY).then_some(slot)
    }
    pub fn insert(&mut self, id: u64, slot: usize) {
        let page = id / PAGE_SIZE as u64;
        let entries = if page < DIRECTORY_PAGES {
            let page = page as usize;
            if self.directory.len() <= page {
                self.directory.resize_with(page + 1, || None);
            }
            self.directory[page].get_or_insert_with(Default::default)
        } else {
            self.overflow.entry(page).or_default()
        };
        let old = std::mem::replace(&mut entries.slots[id as usize % PAGE_SIZE], slot);
        entries.occupied += usize::from(old == EMPTY);
    }
    pub fn remove(&mut self, id: u64) -> Option<usize> {
        let page = id / PAGE_SIZE as u64;
        let entries = if page < DIRECTORY_PAGES {
            self.directory.get_mut(page as usize)?.as_deref_mut()?
        } else {
            self.overflow.get_mut(&page)?
        };
        let old = std::mem::replace(&mut entries.slots[id as usize % PAGE_SIZE], EMPTY);
        if old == EMPTY {
            return None;
        }
        entries.occupied -= 1;
        if entries.occupied == 0 {
            if page < DIRECTORY_PAGES {
                self.directory[page as usize] = None;
            } else {
                self.overflow.remove(&page);
            }
        }
        Some(old)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sparse_ids_allocate_only_live_pages_and_release_empty_pages() {
        let mut slots = Slots::default();
        for (index, id) in [1, 255, 256, (DIRECTORY_PAGES - 1) * 256, u64::MAX]
            .into_iter()
            .enumerate()
        {
            slots.insert(id, index);
            assert_eq!(slots.get(id), Some(index));
        }
        assert_eq!(slots.directory.len(), DIRECTORY_PAGES as usize);
        assert_eq!(slots.directory.iter().flatten().count(), 3);
        assert_eq!(slots.overflow.len(), 1);
        assert_eq!(slots.remove(1), Some(0));
        assert!(slots.directory[0].is_some());
        assert_eq!(slots.remove(255), Some(1));
        assert!(slots.directory[0].is_none());
        assert_eq!(slots.remove(u64::MAX), Some(4));
        assert!(slots.overflow.is_empty());
        assert_eq!(slots.get(u64::MAX), None);
        assert_eq!(slots.remove(u64::MAX), None);
    }
}
