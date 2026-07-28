/**
 * @file flock.ts
 * @module StyxOS/Kernel/FileLockEngine
 * @description POSIX File Locking Subsystem (flock, fcntl, /proc/locks, lslocks).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";
import { ProcFSNode } from "./procfs";

export const LOCK_SH = 1; // Shared lock
export const LOCK_EX = 2; // Exclusive lock
export const LOCK_NB = 4; // Non-blocking
export const LOCK_UN = 8; // Unlock

export interface FileLockRecord {
  id: number;
  pid: number;
  path: string;
  type: "FLOCK" | "POSIX";
  mode: "READ" | "WRITE";
  start: number;
  end: number | "LEN_MAX";
}

export class FileLockEngine {
  private kernel: UnixKernel;
  private locks: Map<string, FileLockRecord> = new Map();
  private nextLockId: number = 1;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
    this.setupProcLocksNode();
  }

  private setupProcLocksNode(): void {
    const procDir = this.kernel.resolvePath("/proc");
    if (procDir && procDir.stat().isDir) {
      if ("children" in procDir && procDir.children instanceof Map) {
        procDir.children.set("locks", new ProcFSNode(300, () => this.formatProcLocks(), false));
      }
    }
  }

  lock(pid: number, path: string, mode: "READ" | "WRITE" = "WRITE", nonBlocking: boolean = false): boolean {
    const existing = this.locks.get(path);
    if (existing) {
      if (existing.pid !== pid && (existing.mode === "WRITE" || mode === "WRITE")) {
        if (nonBlocking) return false;
        throw new Error(`Errno 11: Resource temporarily unavailable (File '${path}' locked by PID ${existing.pid})`);
      }
    }

    const rec: FileLockRecord = {
      id: this.nextLockId++,
      pid,
      path,
      type: "FLOCK",
      mode,
      start: 0,
      end: "LEN_MAX",
    };
    this.locks.set(path, rec);
    return true;
  }

  unlock(pid: number, path: string): boolean {
    const existing = this.locks.get(path);
    if (existing && existing.pid === pid) {
      this.locks.delete(path);
      return true;
    }
    return false;
  }

  formatProcLocks(): string {
    const lines: string[] = [];
    let idx = 1;
    for (const lock of this.locks.values()) {
      lines.push(`${idx}: ${lock.type.padEnd(5)} ADVISORY  ${lock.mode.padEnd(5)} ${lock.pid} 00:00:0 0 EOF`);
      idx++;
    }
    return lines.join("\n") + (lines.length ? "\n" : "");
  }

  listLocks(): string {
    const lines: string[] = [
      "=== Styx OS Kernel File Locks (lslocks) ===",
      "ID   COMMAND     PID   TYPE   MODE  M  PATH",
    ];

    for (const lock of this.locks.values()) {
      lines.push(`${lock.id.toString().padEnd(4)} sh          ${lock.pid.toString().padEnd(5)} ${lock.type.padEnd(6)} ${lock.mode.padEnd(5)} 1  ${lock.path}`);
    }

    return lines.join("\n") + "\n";
  }
}
