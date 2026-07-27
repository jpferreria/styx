/**
 * @file shm.ts
 * @module StyxOS/Kernel/SharedMemoryManager
 * @description POSIX Inter-Process Shared Memory subsystem (/dev/shm, shm_open, ipcs).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface ShmSegment {
  shmid: number;
  name: string;
  size: number;
  data: Uint8Array;
  owner: string;
}

export class SharedMemoryManager {
  private kernel: UnixKernel;
  private segments: Map<string, ShmSegment> = new Map();
  private nextShmId: number = 1000;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  shmOpen(name: string, size: number = 4096): ShmSegment {
    const normName = name.startsWith("/") ? name : `/${name}`;
    let seg = this.segments.get(normName);
    if (!seg) {
      seg = {
        shmid: this.nextShmId++,
        name: normName,
        size,
        data: new Uint8Array(size),
        owner: this.kernel.userManager.getCurrentUser().username,
      };
      this.segments.set(normName, seg);
    }
    return seg;
  }

  writeShm(name: string, offset: number, data: Uint8Array): void {
    const normName = name.startsWith("/") ? name : `/${name}`;
    const seg = this.shmOpen(normName, data.length + offset);
    seg.data.set(data, offset);
  }

  readShm(name: string, offset: number = 0, length?: number): Uint8Array | null {
    const normName = name.startsWith("/") ? name : `/${name}`;
    const seg = this.segments.get(normName);
    if (!seg) return null;
    const end = length ? offset + length : seg.data.length;
    return seg.data.slice(offset, end);
  }

  shmUnlink(name: string): boolean {
    const normName = name.startsWith("/") ? name : `/${name}`;
    return this.segments.delete(normName);
  }

  formatIpcs(): string {
    const lines: string[] = ["------ Shared Memory Segments --------"];
    lines.push(`key        shmid      owner      perms      bytes      nattch     status`);

    if (this.segments.size === 0) {
      lines.push(`0x00000000 1000       user       666        4096       1        `);
    } else {
      for (const s of this.segments.values()) {
        const keyHex = `0x0000${s.shmid.toString(16)}`;
        lines.push(`${keyHex.padEnd(10)} ${s.shmid.toString().padEnd(10)} ${s.owner.padEnd(10)} 666        ${s.size.toString().padEnd(10)} 1        `);
      }
    }
    return lines.join("\n") + "\n";
  }
}
