//! Styx OS Security Capability Policy
//!
//! @file security/mod.rs
//! @module StyxOS/Kernel/Security
//! @description Fine-grained Unix capabilities and permission evaluation sets.
//!
//! Copyright (C) 2026 Styx OS Project Authors
//! Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
//! See <https://www.gnu.org/licenses/gpl-3.0.html> for copyleft licensing details.

use bitflags::bitflags;
use serde::{Serialize, Deserialize};
use crate::error::{KernelError, Result};

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
    pub struct Capability: u64 {
        const CHOWN            = 1 << 0;
        const DAC_OVERRIDE     = 1 << 1;
        const DAC_READ_SEARCH  = 1 << 2;
        const FOWNER           = 1 << 3;
        const KILL             = 1 << 4;
        const SETGID           = 1 << 5;
        const SETUID           = 1 << 6;
        const NET_RAW          = 1 << 7;
        const SYS_ADMIN        = 1 << 8;
        const STORAGE_ACCESS   = 1 << 9;
        const PROCESS_EXEC     = 1 << 10;
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CapabilitySet {
    pub effective: Capability,
    pub permitted: Capability,
    pub inheritable: Capability,
}

impl Default for CapabilitySet {
    fn default() -> Self {
        let default_caps = Capability::STORAGE_ACCESS | Capability::PROCESS_EXEC;
        Self {
            effective: default_caps,
            permitted: default_caps | Capability::SYS_ADMIN | Capability::DAC_OVERRIDE,
            inheritable: default_caps,
        }
    }
}

impl CapabilitySet {
    pub fn root() -> Self {
        Self {
            effective: Capability::all(),
            permitted: Capability::all(),
            inheritable: Capability::all(),
        }
    }

    pub fn check(&self, required: Capability) -> Result<()> {
        if self.effective.contains(required) {
            Ok(())
        } else {
            Err(KernelError::CapabilityDenied(format!(
                "Required capability {:?} is missing from effective set",
                required
            )))
        }
    }
}
