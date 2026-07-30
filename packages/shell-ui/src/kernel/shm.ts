/**
 * @file shm.ts
 * @module StyxOS/Kernel/SharedMemoryManager
 * @description POSIX Inter-Process Shared Memory subsystem (/dev/shm, shm_open, shm_unlink, ipcs -m).
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

  shm_open(name: string, _oflag: number = 0, _mode: number = 0o666): number {
    const seg = this.shmOpen(name);
    return seg.shmid;
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

  shm_unlink(name: string): boolean {
    return this.shmUnlink(name);
  }

  formatIpcsShm(): string {
    const lines: string[] = [
      "=== Styx OS POSIX Shared Memory Segments (ipcs -m) ===",
      "SHMID      KEY/NAME             SIZE (BYTES)  OWNER",
    ];

    for (const seg of this.segments.values()) {
      lines.push(`${seg.shmid.toString().padEnd(10)} ${seg.name.padEnd(20)} ${seg.size.toString().padEnd(13)} ${seg.owner}`);
    }

    return lines.join("\n") + "\n";
  }

  formatIpcs(): string {
    return this.formatIpcsShm();
  }
}
