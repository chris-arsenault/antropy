//! Shared chemical definitions. Mutable diagnostic access detaches retained definitions.
use super::Properties;
use serde::{Deserialize, Serialize};
use std::ops::{Deref, DerefMut};
use std::sync::Arc;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(transparent)]
pub struct PropertyTable(Arc<Vec<Properties>>);

impl From<Vec<Properties>> for PropertyTable {
    fn from(properties: Vec<Properties>) -> Self {
        Self(Arc::new(properties))
    }
}

impl PropertyTable {
    pub(crate) fn same_definition(&self, other: &Self) -> bool {
        Arc::ptr_eq(&self.0, &other.0)
    }
}

impl Deref for PropertyTable {
    type Target = Vec<Properties>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for PropertyTable {
    fn deref_mut(&mut self) -> &mut Self::Target {
        Arc::make_mut(&mut self.0)
    }
}

impl<'a> IntoIterator for &'a PropertyTable {
    type Item = &'a Properties;
    type IntoIter = std::slice::Iter<'a, Properties>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

impl<'a> IntoIterator for &'a mut PropertyTable {
    type Item = &'a mut Properties;
    type IntoIter = std::slice::IterMut<'a, Properties>;
    fn into_iter(self) -> Self::IntoIter {
        self.iter_mut()
    }
}
