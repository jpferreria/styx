//! Styx OS Kernel POSIX Errno and Error Types
//!
//! @file error.rs
//! @module StyxOS/Kernel/Error
//! @description POSIX-compliant error codes (errno) and internal kernel error abstractions.
//!
//! Copyright (C) 2026 Styx OS Project Authors
//! Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
//! See <https://www.gnu.org/licenses/gpl-3.0.html> for copyleft licensing details.

use thiserror::Error;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(i32)]
pub enum Errno {
    EPERM = 1,     // Operation not permitted
    ENOENT = 2,    // No such file or directory
    ESRCH = 3,     // No such process
    EINTR = 4,     // Interrupted system call
    EIO = 5,       // I/O error
    EBADF = 9,     // Bad file number
    EAGAIN = 11,   // Try again
    ENOMEM = 12,   // Out of memory
    EACCES = 13,   // Permission denied
    EEXIST = 17,   // File exists
    EXDEV = 18,    // Cross-device link
    ENOTDIR = 20,  // Not a directory
    EISDIR = 21,   // Is a directory
    EINVAL = 22,   // Invalid argument
    ENFILE = 23,   // File table overflow
    EMFILE = 24,   // Too many open files
    ENOSYS = 38,   // Function not implemented
    ENOTEMPTY = 39,// Directory not empty
}

#[derive(Error, Debug, PartialEq, Eq)]
pub enum KernelError {
    #[error("POSIX Error: {0:?}")]
    Posix(Errno),

    #[error("Capability Denied: {0}")]
    CapabilityDenied(String),

    #[error("Storage Driver Error: {0}")]
    StorageError(String),
}

impl From<Errno> for KernelError {
    fn from(err: Errno) -> Self {
        KernelError::Posix(err)
    }
}

pub type Result<T> = std::result::Result<T, KernelError>;
