//! Styx OS Process Control Block (PCB) and Descriptor Table
//!
//! @file process/mod.rs
//! @module StyxOS/Kernel/Process
//! @description Process abstractions, PID tracking, and file descriptor table management.
//!
//! Copyright (C) 2026 Styx OS Project Authors
//! Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
//! See <https://www.gnu.org/licenses/gpl-3.0.html> for copyleft licensing details.

use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use crate::error::{Errno, Result, KernelError};
use crate::vfs::{VNode, OpenFlags};
use crate::security::CapabilitySet;

pub type Pid = u32;
pub type Fd = i32;

pub struct OpenFile {
    pub node: Arc<dyn VNode>,
    pub offset: RwLock<u64>,
    pub flags: OpenFlags,
}

pub struct FdTable {
    descriptors: HashMap<Fd, Arc<OpenFile>>,
    next_fd: Fd,
}

impl FdTable {
    pub fn new() -> Self {
        Self {
            descriptors: HashMap::new(),
            next_fd: 0,
        }
    }

    pub fn insert(&mut self, file: Arc<OpenFile>) -> Fd {
        let fd = self.next_fd;
        self.descriptors.insert(fd, file);
        self.next_fd += 1;
        fd
    }

    pub fn insert_at(&mut self, fd: Fd, file: Arc<OpenFile>) {
        self.descriptors.insert(fd, file);
        if fd >= self.next_fd {
            self.next_fd = fd + 1;
        }
    }

    pub fn get(&self, fd: Fd) -> Result<Arc<OpenFile>> {
        self.descriptors.get(&fd).cloned().ok_or(KernelError::Posix(Errno::EBADF))
    }

    pub fn close(&mut self, fd: Fd) -> Result<()> {
        self.descriptors.remove(&fd).ok_or(KernelError::Posix(Errno::EBADF))?;
        Ok(())
    }
}

pub struct ProcessControlBlock {
    pub pid: Pid,
    pub ppid: Pid,
    pub uid: u32,
    pub gid: u32,
    pub cwd: String,
    pub fds: RwLock<FdTable>,
    pub capabilities: CapabilitySet,
    pub env: HashMap<String, String>,
}

impl ProcessControlBlock {
    pub fn new(pid: Pid, ppid: Pid) -> Self {
        let mut env = HashMap::new();
        env.insert("PATH".to_string(), "/bin:/usr/bin".to_string());
        env.insert("HOME".to_string(), "/home/user".to_string());
        env.insert("TERM".to_string(), "xterm-256color".to_string());

        Self {
            pid,
            ppid,
            uid: 1000,
            gid: 1000,
            cwd: "/home/user".to_string(),
            fds: RwLock::new(FdTable::new()),
            capabilities: CapabilitySet::default(),
            env,
        }
    }
}
