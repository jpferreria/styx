/**
 * @file sem.ts
 * @module StyxOS/Kernel/SemaphoreManager
 * @description POSIX Semaphore Subsystem (sem_open, sem_wait, sem_post, ipcs -s).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface SemaphoreItem {
  name: string;
  value: number;
  mode: number;
  waitingCount: number;
}

export class SemaphoreManager {
  private kernel: UnixKernel;
  private semaphores: Map<string, SemaphoreItem> = new Map();

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
    // Create default system semaphores
    this.semOpen("/mutex_vfs", 1, 0o666);
    this.semOpen("/sem_proc", 2, 0o666);
  }

  semOpen(name: string, value: number = 1, mode: number = 0o666): SemaphoreItem {
    const key = name.startsWith("/") ? name : `/${name}`;
    let sem = this.semaphores.get(key);
    if (!sem) {
      sem = { name: key, value, mode, waitingCount: 0 };
      this.semaphores.set(key, sem);

      const devDir = this.kernel.resolvePath("/dev");
      if (devDir && devDir.stat().isDir) {
        const semDir = devDir.lookup("semaphore") || devDir.createChild("semaphore", true, 0o755);
        const nodeName = key.substring(1);
        if (semDir && semDir.stat().isDir && !semDir.lookup(nodeName)) {
          semDir.createChild(nodeName, false, mode);
        }
      }
    }
    return sem;
  }

  semWait(name: string): boolean {
    const key = name.startsWith("/") ? name : `/${name}`;
    const sem = this.semaphores.get(key);
    if (!sem) throw new Error(`Errno 2: Semaphore not found '${key}'`);

    if (sem.value > 0) {
      sem.value--;
      return true;
    } else {
      sem.waitingCount++;
      return false; // Blocked
    }
  }

  semPost(name: string): number {
    const key = name.startsWith("/") ? name : `/${name}`;
    const sem = this.semaphores.get(key);
    if (!sem) throw new Error(`Errno 2: Semaphore not found '${key}'`);

    if (sem.waitingCount > 0) {
      sem.waitingCount--;
    } else {
      sem.value++;
    }
    return sem.value;
  }

  semGetValue(name: string): number {
    const key = name.startsWith("/") ? name : `/${name}`;
    const sem = this.semaphores.get(key);
    if (!sem) throw new Error(`Errno 2: Semaphore not found '${key}'`);
    return sem.value;
  }

  semUnlink(name: string): boolean {
    const key = name.startsWith("/") ? name : `/${name}`;
    return this.semaphores.delete(key);
  }

  formatIpcsSemaphores(): string {
    const lines: string[] = [
      "=== Styx OS POSIX Semaphore Arrays (ipcs -s) ===",
      "SEM_NAME             VALUE   WAITING   PERMS",
    ];

    for (const sem of this.semaphores.values()) {
      lines.push(`${sem.name.padEnd(20)} ${sem.value.toString().padEnd(7)} ${sem.waitingCount.toString().padEnd(9)} 0${sem.mode.toString(8)}`);
    }

    return lines.join("\n") + "\n";
  }
}
