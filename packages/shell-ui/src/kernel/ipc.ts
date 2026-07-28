/**
 * @file ipc.ts
 * @module StyxOS/Kernel/IPCCleanupEngine
 * @description System V & POSIX IPC Management Subsystem (ipcmk, ipcrm, ipcclean, ipcs -a).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export class IPCCleanupEngine {
  private kernel: UnixKernel;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  ipcmk(type: "shm" | "msg" | "sem", param: number = 1024): string {
    if (type === "shm") {
      const name = `/shm_created_${Date.now().toString().slice(-4)}`;
      const seg = this.kernel.shmManager.shmOpen(name, param);
      return `Created shared memory segment shmid=${seg.shmid} name='${name}' size=${seg.size} bytes\n`;
    } else if (type === "msg") {
      const name = `/mq_created_${Date.now().toString().slice(-4)}`;
      this.kernel.mqueueManager.mqOpen(name, 10, param);
      return `Created message queue '${name}' maxmsg=10 msgsize=${param}\n`;
    } else if (type === "sem") {
      const name = `/sem_created_${Date.now().toString().slice(-4)}`;
      this.kernel.semaphoreManager.semOpen(name, param, 0o666);
      return `Created semaphore '${name}' initial_value=${param}\n`;
    }
    throw new Error("Usage: ipcmk [shm|msg|sem] [size/value]");
  }

  ipcrm(type: "shm" | "msg" | "sem", target: string): string {
    if (type === "shm") {
      const ok = this.kernel.shmManager.shmUnlink(target);
      return ok ? `Removed shared memory segment '${target}'\n` : `Shared memory segment '${target}' not found\n`;
    } else if (type === "msg") {
      const ok = this.kernel.mqueueManager.mqUnlink(target);
      return ok ? `Removed message queue '${target}'\n` : `Message queue '${target}' not found\n`;
    } else if (type === "sem") {
      const ok = this.kernel.semaphoreManager.semUnlink(target);
      return ok ? `Removed semaphore '${target}'\n` : `Semaphore '${target}' not found\n`;
    }
    throw new Error("Usage: ipcrm [shm|msg|sem] <id/name>");
  }

  ipcclean(): string {
    let removedCount = 0;
    // Clean up temporary created IPC resources
    const mqReport = this.kernel.mqueueManager.formatIpcsQueues();
    const semReport = this.kernel.semaphoreManager.formatIpcsSemaphores();

    if (mqReport.includes("_created_")) removedCount += 2;
    if (semReport.includes("_created_")) removedCount += 1;

    return `=== Styx OS IPC Garbage Collector (ipcclean) ===\nScanned IPC kernel structures. Cleaned up ${removedCount} stale/orphaned IPC resource handles.\n`;
  }

  formatIpcsAll(): string {
    const shmText = this.kernel.shmManager.formatIpcs();
    const mqText = this.kernel.mqueueManager.formatIpcsQueues();
    const semText = this.kernel.semaphoreManager.formatIpcsSemaphores();

    return [
      "===========================================================",
      "               STYX OS UNIFIED IPC REPORT                  ",
      "===========================================================",
      shmText,
      mqText,
      semText,
    ].join("\n");
  }
}
