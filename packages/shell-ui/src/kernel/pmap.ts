/**
 * @file pmap.ts
 * @module StyxOS/Kernel/PMapEngine
 * @description Virtual Memory Map Inspector (/proc/[pid]/maps, pmap).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface MemorySegment {
  address: string;
  sizeKb: number;
  perms: string;
  mapping: string;
}

export class PMapEngine {
  private kernel: UnixKernel;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  getProcessMaps(pid: number = 1): MemorySegment[] {
    const cmd = pid === 1 ? "init" : pid === 2 ? "sh" : "top-gui";
    return [
      { address: "0000555555554000", sizeKb: 16, perms: "r-xp", mapping: `/bin/${cmd}` },
      { address: "0000555555558000", sizeKb: 4, perms: "r--p", mapping: `/bin/${cmd}` },
      { address: "0000555555559000", sizeKb: 4, perms: "rw-p", mapping: `/bin/${cmd}` },
      { address: "0000555555700000", sizeKb: 132, perms: "rw-p", mapping: "[heap]" },
      { address: "00007ffff7a00000", sizeKb: 2048, perms: "r-xp", mapping: "/lib/libc.so.6" },
      { address: "00007ffff7c00000", sizeKb: 64, perms: "rw-s", mapping: "/dev/shm/styx_shm" },
      { address: "00007ffffffde000", sizeKb: 132, perms: "rw-p", mapping: "[stack]" },
    ];
  }

  formatPMap(pid: number = 1): string {
    const segments = this.getProcessMaps(pid);
    const cmd = pid === 1 ? "init" : pid === 2 ? "sh" : "top-gui";
    const status = this.kernel.procFSNode ? "" : "";
    const lines: string[] = [`${pid}:   /bin/${cmd}${status}`];

    let totalKb = 0;
    for (const seg of segments) {
      lines.push(`${seg.address} ${seg.sizeKb.toString().padStart(5, " ")}K ${seg.perms.padEnd(5, " ")} ${seg.mapping}`);
      totalKb += seg.sizeKb;
    }
    lines.push(` total ${totalKb.toString().padStart(16, " ")}K\n`);
    return lines.join("\n");
  }
}
