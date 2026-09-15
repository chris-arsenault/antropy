//! Compact resident history with the original v10 optional-number/string wire format.
use serde::{Deserialize, Deserializer, Serialize, Serializer};

pub const ALIVE: u64 = u64::MAX;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ancestor {
    pub id: u64,
    #[serde(with = "parent")]
    pub parent: u64,
    pub lineage: u64,
    pub genome: u64,
    pub born: u64,
    #[serde(with = "ended")]
    pub ended: u64,
    pub cause: Cause,
}
impl Ancestor {
    pub fn parent(&self) -> Option<u64> {
        (self.parent != 0).then_some(self.parent)
    }
    pub fn ended(&self) -> Option<u64> {
        (self.ended != ALIVE).then_some(self.ended)
    }
}
mod parent {
    use super::*;
    pub fn serialize<S: Serializer>(v: &u64, s: S) -> Result<S::Ok, S::Error> {
        (*v != 0).then_some(*v).serialize(s)
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<u64, D::Error> {
        match Option::<u64>::deserialize(d)? {
            Some(0) => Err(serde::de::Error::custom("Ancestor parent cannot be zero")),
            value => Ok(value.unwrap_or(0)),
        }
    }
}
mod ended {
    use super::*;
    pub fn serialize<S: Serializer>(v: &u64, s: S) -> Result<S::Ok, S::Error> {
        (*v != ALIVE).then_some(*v).serialize(s)
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<u64, D::Error> {
        match Option::<u64>::deserialize(d)? {
            Some(ALIVE) => Err(serde::de::Error::custom(
                "Ancestor end tick exceeds supported time",
            )),
            value => Ok(value.unwrap_or(ALIVE)),
        }
    }
}
#[derive(Clone, Copy, Debug)]
pub enum Cause {
    Alive,
    Division,
    Starvation,
    Damage,
    Disturbance,
    ConstructedDeath,
    ConstructedCorpse,
    SyntheticHistory,
}
impl Cause {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Alive => "alive",
            Self::Division => "division",
            Self::Starvation => "starvation",
            Self::Damage => "damage",
            Self::Disturbance => "disturbance",
            Self::ConstructedDeath => "constructed-death",
            Self::ConstructedCorpse => "constructed-corpse",
            Self::SyntheticHistory => "synthetic-history",
        }
    }
}
impl Serialize for Cause {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(self.as_str())
    }
}
impl<'de> Deserialize<'de> for Cause {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let value = <&str>::deserialize(d)?;
        match value {
            "alive" => Ok(Self::Alive),
            "division" => Ok(Self::Division),
            "starvation" => Ok(Self::Starvation),
            "damage" => Ok(Self::Damage),
            "disturbance" => Ok(Self::Disturbance),
            "constructed-death" => Ok(Self::ConstructedDeath),
            "constructed-corpse" => Ok(Self::ConstructedCorpse),
            "synthetic-history" => Ok(Self::SyntheticHistory),
            _ => Err(serde::de::Error::custom("Unknown ancestor end cause")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn compact_history_preserves_v10_bytes() {
        #[derive(Serialize)]
        struct Previous {
            id: u64,
            parent: Option<u64>,
            lineage: u64,
            genome: u64,
            born: u64,
            ended: Option<u64>,
            cause: String,
        }
        for (parent, ended, cause) in [
            (None, None, Cause::Alive),
            (Some(1), Some(0), Cause::Damage),
            (Some(1), Some(250), Cause::Division),
        ] {
            let old = Previous {
                id: 2,
                parent,
                lineage: 1,
                genome: 3,
                born: 0,
                ended,
                cause: cause.as_str().into(),
            };
            let bytes = postcard::to_stdvec(&old).unwrap();
            let compact: Ancestor = postcard::from_bytes(&bytes).unwrap();
            assert_eq!(bytes, postcard::to_stdvec(&compact).unwrap());
            assert_eq!(
                serde_json::to_value(old).unwrap(),
                serde_json::to_value(compact).unwrap()
            );
        }
        assert!(std::mem::size_of::<Ancestor>() <= 56);
    }
}
