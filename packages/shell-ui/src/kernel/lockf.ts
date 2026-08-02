/**
 * @file lockf.ts
 * @module StyxOS/Kernel/RecordLockEngine
 * @description POSIX Advisory Record File Locking Subsystem & Advisory Byte-Range Locks (lockf, fcntl F_SETLK, fcntl F_GETLK).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface RecordLock {
  path: string;
  start: number;
  len: number; // 0 = until end of file
  type: "F_RDLCK" | "F_WRLCK";
  pid: number;
}

export class RecordLockEngine {
  private locks: Map<string, RecordLock[]> = new Map();

  constructor(_kernel?: UnixKernel) {}

  fcntl_setlk(
    path: string,
    type: "F_RDLCK" | "F_WRLCK" | "F_UNLCK",
    start: number = 0,
    len: number = 0,
    pid: number = 1
  ): boolean {
    const norm = path.startsWith("/") ? path : `/${path}`;
    let list = this.locks.get(norm) || [];

    if (type === "F_UNLCK") {
      // Remove overlapping locks owned by this PID
      list = list.filter((l) => !(l.pid === pid && l.start === start && l.len === len));
      this.locks.set(norm, list);
      return true;
    }

    // Check conflict with other PIDs
    for (const l of list) {
      if (l.pid !== pid) {
        if (l.type === "F_WRLCK" || type === "F_WRLCK") {
          const overlaps = (len === 0 || l.len === 0) || (start < l.start + l.len && start + len > l.start);
          if (overlaps) return false; // Conflict!
        }
      }
    }

    list.push({ path: norm, start, len, type, pid });
    this.locks.set(norm, list);
    return true;
  }

  fcntl_getlk(path: string, start: number = 0, len: number = 0): RecordLock | null {
    const norm = path.startsWith("/") ? path : `/${path}`;
    const list = this.locks.get(norm);
    if (!list) return null;

    for (const l of list) {
      const overlaps = (len === 0 || l.len === 0) || (start < l.start + l.len && start + len > l.start);
      if (overlaps) return l;
    }
    return null;
  }

  lockf(
    path: string,
    cmd: "F_LOCK" | "F_TLOCK" | "F_ULOCK" | "F_TEST",
    start: number = 0,
    len: number = 0,
    pid: number = 1
  ): boolean {
    if (cmd === "F_ULOCK") {
      return this.fcntl_setlk(path, "F_UNLCK", start, len, pid);
    } else if (cmd === "F_TEST") {
      return this.fcntl_getlk(path, start, len) === null;
    } else {
      // F_LOCK or F_TLOCK (Exclusive write lock)
      return this.fcntl_setlk(path, "F_WRLCK", start, len, pid);
    }
  }

  formatRecordLocksStatus(): string {
    const lines: string[] = [
      "=== Styx OS POSIX fcntl / lockf Byte-Range Record Locks ===",
      "Path                 PID    Type     Start      Length",
    ];

    let total = 0;
    for (const [p, list] of this.locks.entries()) {
      for (const l of list) {
        total++;
        lines.push(`${p.padEnd(20)} ${String(l.pid).padEnd(6)} ${l.type.padEnd(8)} ${String(l.start).padEnd(10)} ${l.len === 0 ? "EOF" : l.len}`);
      }
    }

    if (total === 0) {
      lines.push("No active POSIX byte-range record locks.");
    }

    return lines.join("\n") + "\n";
  }
}
