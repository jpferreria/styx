/**
 * @file devnodes.ts
 * @module StyxOS/Kernel/DeviceNodeEngine
 * @description Universal Device Major/Minor Node Driver & Character Device Subsystem (/dev/null, /dev/zero, /dev/full, mknod).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { VNode, FileStat, DirEntry, UnixKernel } from "./index";

export class NullDeviceNode implements VNode {
  ino: number = 100;
  mtime: number = Date.now();

  stat(): FileStat {
    return { ino: this.ino, mode: 0o666, size: 0, isDir: false, mtime: this.mtime };
  }

  read(_offset: number, _count: number): Uint8Array {
    return new Uint8Array(0);
  }

  write(_offset: number, data: Uint8Array): number {
    return data.length;
  }

  readdir(): DirEntry[] { return []; }
  createChild(): VNode { throw new Error("Character devices do not support directory child creation"); }
  removeChild(): boolean { return false; }
  lookup(): VNode | null { return null; }
}

export class ZeroDeviceNode implements VNode {
  ino: number = 101;
  mtime: number = Date.now();

  stat(): FileStat {
    return { ino: this.ino, mode: 0o666, size: 0, isDir: false, mtime: this.mtime };
  }

  read(_offset: number, count: number): Uint8Array {
    return new Uint8Array(Math.min(count, 4096));
  }

  write(_offset: number, data: Uint8Array): number {
    return data.length;
  }

  readdir(): DirEntry[] { return []; }
  createChild(): VNode { throw new Error("Character devices do not support directory child creation"); }
  removeChild(): boolean { return false; }
  lookup(): VNode | null { return null; }
}

export class FullDeviceNode implements VNode {
  ino: number = 102;
  mtime: number = Date.now();

  stat(): FileStat {
    return { ino: this.ino, mode: 0o666, size: 0, isDir: false, mtime: this.mtime };
  }

  read(_offset: number, count: number): Uint8Array {
    return new Uint8Array(Math.min(count, 4096));
  }

  write(_offset: number, _data: Uint8Array): number {
    throw new Error("Errno 28: No space left on device");
  }

  readdir(): DirEntry[] { return []; }
  createChild(): VNode { throw new Error("Character devices do not support directory child creation"); }
  removeChild(): boolean { return false; }
  lookup(): VNode | null { return null; }
}

export interface DeviceNodeInfo {
  path: string;
  type: "c" | "b";
  major: number;
  minor: number;
}

export class DeviceNodeEngine {
  private kernel: UnixKernel;
  private registry: Map<string, DeviceNodeInfo> = new Map();

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
    this.registerStandardDevices();
  }

  private registerStandardDevices(): void {
    const devDir = this.kernel.resolvePath("/dev");
    if (devDir && devDir.stat().isDir) {
      if (!devDir.lookup("null")) {
        devDir.createChild("null", false, 0o666);
      }
      if (!devDir.lookup("zero")) {
        devDir.createChild("zero", false, 0o666);
      }
      if (!devDir.lookup("full")) {
        devDir.createChild("full", false, 0o666);
      }
    }

    this.registry.set("/dev/null", { path: "/dev/null", type: "c", major: 1, minor: 3 });
    this.registry.set("/dev/zero", { path: "/dev/zero", type: "c", major: 1, minor: 5 });
    this.registry.set("/dev/full", { path: "/dev/full", type: "c", major: 1, minor: 7 });
  }

  mknod(path: string, type: "c" | "b", major: number, minor: number): void {
    const parentDir = this.kernel.resolvePath(path.substring(0, path.lastIndexOf("/")) || "/");
    const name = path.substring(path.lastIndexOf("/") + 1);

    if (!parentDir || !parentDir.stat().isDir) {
      throw new Error(`Errno 2: Parent directory not found for '${path}'`);
    }

    parentDir.createChild(name, false, 0o666);
    this.registry.set(path, { path, type, major, minor });
  }

  listDevices(): string {
    const lines: string[] = [
      "=== Styx OS Character & Block Device Node Registry ===",
      "TYPE  MAJOR  MINOR  PATH",
    ];

    for (const info of this.registry.values()) {
      lines.push(`${info.type.padEnd(5)} ${info.major.toString().padEnd(6)} ${info.minor.toString().padEnd(6)} ${info.path}`);
    }

    return lines.join("\n") + "\n";
  }
}
