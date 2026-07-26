/**
 * @file top.ts
 * @module StyxOS/ShellHost/SystemMonitor
 * @description System performance monitor querying CPU utilization, RAM metrics, and active process threads.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "../kernel";

export interface SystemStats {
  cpuUsage: number;
  totalMemKb: number;
  usedMemKb: number;
  freeMemKb: number;
  processCount: number;
  uptimeSeconds: number;
}

export class SystemMonitor {
  private _kernel: UnixKernel;

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;
  }

  getMetrics(): SystemStats {
    const uptimeSeconds = Math.floor(performance.now() / 1000);
    const totalMemKb = 4194304; // 4 GB virtual RAM
    const usedMemKb = 1048576 + (uptimeSeconds * 12) % 524288;
    const freeMemKb = totalMemKb - usedMemKb;
    const cpuUsage = Math.min(99, Math.floor(15 + Math.sin(uptimeSeconds) * 10));
    const processCount = this._kernel ? 3 : 1;

    return {
      cpuUsage,
      totalMemKb,
      usedMemKb,
      freeMemKb,
      processCount,
      uptimeSeconds,
    };
  }

  generateReport(): string {
    const stats = this.getMetrics();
    return [
      `Styx OS Top - Uptime ${stats.uptimeSeconds}s, 1 user, load average: 0.12, 0.08, 0.05`,
      `Tasks: ${stats.processCount} total, 1 running, 2 sleeping, 0 stopped`,
      `%Cpu(s): ${stats.cpuUsage.toFixed(1)} us, 2.1 sy, 0.0 ni, ${(100 - stats.cpuUsage).toFixed(1)} id`,
      `MiB Mem : ${(stats.totalMemKb / 1024).toFixed(1)} total, ${(stats.freeMemKb / 1024).toFixed(1)} free, ${(stats.usedMemKb / 1024).toFixed(1)} used`,
      ``,
      `  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND`,
      `    1 user      20   0  327680  40960  16384 S   1.2   1.0   0:01.04 sh`,
      `    2 root      20   0  131072  16384   8192 S   0.0   0.4   0:00.02 init`,
      `    3 user      20   0  524288  65536  32768 S   0.8   1.6   0:00.55 worker-host`,
    ].join("\n") + "\n";
  }
}
