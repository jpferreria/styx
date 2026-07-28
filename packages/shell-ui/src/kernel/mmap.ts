/**
 * @file mmap.ts
 * @module StyxOS/Kernel/MMapEngine
 * @description POSIX Inter-Process Memory Mapping Subsystem (mmap, munmap, msync, mprotect, /proc/self/maps, lsmaps).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";
import { ProcFSNode } from "./procfs";

export const PROT_READ = 1;
export const PROT_WRITE = 2;
export const PROT_EXEC = 4;

export const MAP_SHARED = 1;
export const MAP_PRIVATE = 2;
export const MAP_ANONYMOUS = 32;

export interface MMapRegion {
  id: number;
  startAddr: string;
  endAddr: string;
  length: number;
  prot: number;
  flags: number;
  path: string;
  data: Uint8Array;
}

export class MMapEngine {
  private _kernel: UnixKernel;
  private mappings: Map<string, MMapRegion> = new Map();
  private nextAddr: number = 0x7f9020000000;
  private nextId: number = 1;

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;
    this.setupProcSelfMapsNode();
  }

  getKernel(): UnixKernel {
    return this._kernel;
  }

  private setupProcSelfMapsNode(): void {
    const procDir = this._kernel.resolvePath("/proc");
    if (procDir && procDir.stat().isDir) {
      if ("children" in procDir && procDir.children instanceof Map) {
        let selfNode = procDir.lookup("self");
        if (!selfNode) {
          selfNode = new ProcFSNode(501, () => "", true);
          procDir.children.set("self", selfNode);
        }
        if ("children" in selfNode && selfNode.children instanceof Map) {
          selfNode.children.set("maps", new ProcFSNode(502, () => this.formatProcSelfMaps(), false));
        }
      }
    }
  }

  mmap(path: string, length: number = 4096, prot: number = PROT_READ | PROT_WRITE, flags: number = MAP_SHARED): MMapRegion {
    const startNum = this.nextAddr;
    const endNum = startNum + length;
    this.nextAddr = endNum + 0x1000;

    const startAddr = "0x" + startNum.toString(16);
    const endAddr = "0x" + endNum.toString(16);

    let data = new Uint8Array(length);
    if (path && path !== "[anon]") {
      const fileNode = this._kernel.resolvePath(path);
      if (fileNode && typeof fileNode.read === "function") {
        const fileBytes = fileNode.read(0, length);
        data.set(fileBytes.slice(0, length));
      }
    }

    const region: MMapRegion = {
      id: this.nextId++,
      startAddr,
      endAddr,
      length,
      prot,
      flags,
      path: path || "[anon]",
      data,
    };

    this.mappings.set(startAddr, region);
    return region;
  }

  munmap(startAddr: string): boolean {
    return this.mappings.delete(startAddr);
  }

  msync(startAddr: string): boolean {
    const region = this.mappings.get(startAddr);
    if (!region || region.path === "[anon]") return false;

    const fileNode = this._kernel.resolvePath(region.path);
    if (fileNode && typeof fileNode.write === "function") {
      fileNode.write(0, region.data);
      return true;
    }
    return false;
  }

  mprotect(startAddr: string, newProt: number): boolean {
    const region = this.mappings.get(startAddr);
    if (region) {
      region.prot = newProt;
      return true;
    }
    return false;
  }

  formatProcSelfMaps(): string {
    const lines: string[] = [];
    for (const reg of this.mappings.values()) {
      const pR = (reg.prot & PROT_READ) ? "r" : "-";
      const pW = (reg.prot & PROT_WRITE) ? "w" : "-";
      const pX = (reg.prot & PROT_EXEC) ? "x" : "-";
      const pS = (reg.flags & MAP_SHARED) ? "s" : "p";
      const perms = `${pR}${pW}${pX}${pS}`;

      const addrRange = `${reg.startAddr.replace("0x", "")}-${reg.endAddr.replace("0x", "")}`;
      lines.push(`${addrRange.padEnd(25)} ${perms} 00000000 00:00 0                         ${reg.path}`);
    }
    return lines.join("\n") + (lines.length ? "\n" : "");
  }

  listMaps(): string {
    const lines: string[] = [
      "=== Styx OS Virtual Memory Mappings (lsmaps / /proc/self/maps) ===",
      "ADDRESS RANGE               PERMS   SIZE_BYTES  MAPPED PATH",
    ];

    for (const reg of this.mappings.values()) {
      const pR = (reg.prot & PROT_READ) ? "r" : "-";
      const pW = (reg.prot & PROT_WRITE) ? "w" : "-";
      const pX = (reg.prot & PROT_EXEC) ? "x" : "-";
      const pS = (reg.flags & MAP_SHARED) ? "s" : "p";
      const perms = `${pR}${pW}${pX}${pS}`;

      const addrRange = `${reg.startAddr}-${reg.endAddr}`;
      lines.push(`${addrRange.padEnd(27)} ${perms.padEnd(7)} ${reg.length.toString().padEnd(11)} ${reg.path}`);
    }

    return lines.join("\n") + "\n";
  }
}
