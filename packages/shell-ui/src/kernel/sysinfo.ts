/**
 * @file sysinfo.ts
 * @module StyxOS/Kernel/SysInfoEngine
 * @description POSIX Extended System Information & Diagnostic Engine (sysinfo, uname, free, /proc/sysinfo).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";
import { ProcFSNode } from "./procfs";

export interface SysInfoStruct {
  uptime: number;
  loads: [number, number, number];
  totalram: number;
  freeram: number;
  sharedram: number;
  bufferram: number;
  totalswap: number;
  freeswap: number;
  procs: number;
}

export class SysInfoEngine {
  private _kernel: UnixKernel;

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;
    this.setupProcSysinfoNode();
  }

  getKernel(): UnixKernel {
    return this._kernel;
  }

  private setupProcSysinfoNode(): void {
    const procDir = this._kernel.resolvePath("/proc");
    if (procDir && procDir.stat().isDir) {
      if ("children" in procDir && procDir.children instanceof Map) {
        procDir.children.set("sysinfo", new ProcFSNode(503, () => this.formatProcSysinfo(), false));
      }
    }
  }

  sysinfo(): SysInfoStruct {
    const mono = this._kernel.timeEngine.clock_gettime(1);
    return {
      uptime: mono.tv_sec,
      loads: [0.05, 0.03, 0.01],
      totalram: 4 * 1024 * 1024 * 1024, // 4GB
      freeram: 3 * 1024 * 1024 * 1024,  // 3GB
      sharedram: 64 * 1024 * 1024,      // 64MB
      bufferram: 256 * 1024 * 1024,     // 256MB
      totalswap: 512 * 1024 * 1024,     // 512MB
      freeswap: 512 * 1024 * 1024,      // 512MB
      procs: 2,
    };
  }

  uname(args: string[] = []): string {
    const sysName = "Linux";
    const nodeName = "styx-os";
    const release = "6.1.0-styx-wasm";
    const version = "#1 SMP PREEMPT Styx OS v0.20.0";
    const machine = "wasm32";

    if (args.includes("-a") || args.length === 0) {
      return `${sysName} ${nodeName} ${release} ${version} ${machine}\n`;
    }
    if (args.includes("-s")) return `${sysName}\n`;
    if (args.includes("-n")) return `${nodeName}\n`;
    if (args.includes("-r")) return `${release}\n`;
    if (args.includes("-m")) return `${machine}\n`;

    return `${sysName} ${nodeName} ${release} ${version} ${machine}\n`;
  }

  free(args: string[] = []): string {
    const info = this.sysinfo();
    const isHuman = args.includes("-h");

    const fmt = (bytes: number) => {
      if (!isHuman) return Math.floor(bytes / 1024).toString().padEnd(10);
      if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)}Gi`.padEnd(10);
      if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)}Mi`.padEnd(10);
      return `${Math.floor(bytes / 1024)}Ki`.padEnd(10);
    };

    const usedRam = info.totalram - info.freeram;
    const availRam = info.freeram + info.bufferram;

    const lines: string[] = [
      `               total        used        free      shared  buff/cache   available`,
      `Mem:       ${fmt(info.totalram)} ${fmt(usedRam)} ${fmt(info.freeram)} ${fmt(info.sharedram)} ${fmt(info.bufferram)} ${fmt(availRam)}`,
      `Swap:      ${fmt(info.totalswap)} ${fmt(0)} ${fmt(info.freeswap)}`,
    ];

    return lines.join("\n") + "\n";
  }

  formatProcSysinfo(): string {
    const s = this.sysinfo();
    return [
      `uptime: ${s.uptime}`,
      `loads: ${s.loads.join(", ")}`,
      `totalram: ${s.totalram}`,
      `freeram: ${s.freeram}`,
      `sharedram: ${s.sharedram}`,
      `bufferram: ${s.bufferram}`,
      `totalswap: ${s.totalswap}`,
      `freeswap: ${s.freeswap}`,
      `procs: ${s.procs}`,
    ].join("\n") + "\n";
  }
}
