/**
 * @file mutex.ts
 * @module StyxOS/Kernel/MutexSpinlockEngine
 * @description Real-Time Multi-Process IPC Shared Mutex & Spinlock Engine (pthread_mutex_init, pthread_mutex_lock, pthread_mutex_unlock, pthread_spin_lock).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface MutexState {
  name: string;
  type: "normal" | "recursive" | "spinlock";
  locked: boolean;
  ownerPid: number;
  lockCount: number;
}

export class MutexSpinlockEngine {
  private mutices: Map<string, MutexState> = new Map();

  constructor(_kernel: UnixKernel) {}

  pthread_mutex_init(name: string, type: "normal" | "recursive" | "spinlock" = "normal"): boolean {
    if (this.mutices.has(name)) return false;
    this.mutices.set(name, {
      name,
      type,
      locked: false,
      ownerPid: 0,
      lockCount: 0,
    });
    return true;
  }

  pthread_mutex_lock(name: string, pid: number = 1): boolean {
    let m = this.mutices.get(name);
    if (!m) {
      this.pthread_mutex_init(name, "normal");
      m = this.mutices.get(name)!;
    }

    if (!m.locked) {
      m.locked = true;
      m.ownerPid = pid;
      m.lockCount = 1;
      return true;
    }

    if (m.type === "recursive" && m.ownerPid === pid) {
      m.lockCount++;
      return true;
    }

    return false;
  }

  pthread_mutex_unlock(name: string, pid: number = 1): boolean {
    const m = this.mutices.get(name);
    if (!m || !m.locked) return false;
    if (m.ownerPid !== pid && m.ownerPid !== 0) return false;

    if (m.type === "recursive") {
      m.lockCount--;
      if (m.lockCount <= 0) {
        m.locked = false;
        m.ownerPid = 0;
        m.lockCount = 0;
      }
    } else {
      m.locked = false;
      m.ownerPid = 0;
      m.lockCount = 0;
    }

    return true;
  }

  pthread_mutex_destroy(name: string): boolean {
    return this.mutices.delete(name);
  }

  pthread_spin_lock(name: string, pid: number = 1): boolean {
    return this.pthread_mutex_lock(name, pid);
  }

  pthread_spin_unlock(name: string, pid: number = 1): boolean {
    return this.pthread_mutex_unlock(name, pid);
  }

  formatMutexStatus(): string {
    const lines: string[] = [
      "=== Styx OS POSIX Shared Mutex & Spinlock Status ===",
      "Name                 Type       State    Owner PID  Lock Count",
    ];

    if (this.mutices.size === 0) {
      lines.push("No active IPC mutices or spinlocks.");
    } else {
      for (const m of this.mutices.values()) {
        const stateStr = m.locked ? "LOCKED" : "UNLOCKED";
        lines.push(`${m.name.padEnd(20)} ${m.type.padEnd(10)} ${stateStr.padEnd(8)} ${String(m.ownerPid).padEnd(10)} ${m.lockCount}`);
      }
    }

    return lines.join("\n") + "\n";
  }
}
