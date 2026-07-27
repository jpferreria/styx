/**
 * @file fifo.ts
 * @module StyxOS/Kernel/FIFOManager
 * @description POSIX FIFO / Named Pipe Subsystem (mkfifo, lsfifo).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { VNode, FileStat, DirEntry, UnixKernel } from "./index";

export class FifoNode implements VNode {
  ino: number;
  mode: number;
  mtime: number = Date.now();
  private buffer: number[] = [];

  constructor(ino: number = 200, mode: number = 0o666) {
    this.ino = ino;
    this.mode = mode;
  }

  stat(): FileStat {
    return { ino: this.ino, mode: this.mode, size: this.buffer.length, isDir: false, mtime: this.mtime };
  }

  read(_offset: number, count: number): Uint8Array {
    const toRead = Math.min(count, this.buffer.length);
    const result = new Uint8Array(toRead);
    for (let i = 0; i < toRead; i++) {
      result[i] = this.buffer.shift()!;
    }
    return result;
  }

  write(_offset: number, data: Uint8Array): number {
    for (let i = 0; i < data.length; i++) {
      this.buffer.push(data[i]);
    }
    this.mtime = Date.now();
    return data.length;
  }

  readdir(): DirEntry[] { return []; }
  createChild(): VNode { throw new Error("FIFO nodes do not support directory child creation"); }
  removeChild(): boolean { return false; }
  lookup(): VNode | null { return null; }
}

export class FIFOManager {
  private kernel: UnixKernel;
  private fifos: Map<string, FifoNode> = new Map();
  private nextIno: number = 200;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  mkfifo(path: string, mode: number = 0o666): FifoNode {
    const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
    const name = path.substring(path.lastIndexOf("/") + 1);
    const parentDir = this.kernel.resolvePath(parentPath);

    if (!parentDir || !parentDir.stat().isDir) {
      throw new Error(`Errno 2: Parent directory not found for FIFO '${path}'`);
    }

    const fifoNode = new FifoNode(this.nextIno++, mode);
    parentDir.createChild(name, false, mode);
    this.fifos.set(path, fifoNode);
    return fifoNode;
  }

  getFifo(path: string): FifoNode | undefined {
    return this.fifos.get(path);
  }

  listFifos(): string {
    const lines: string[] = [
      "=== Styx OS POSIX FIFO Named Pipe Registry ===",
      "INO     MODE    BUFFER_BYTES  PATH",
    ];

    for (const [path, fifo] of this.fifos.entries()) {
      const st = fifo.stat();
      lines.push(`${st.ino.toString().padEnd(7)} 0${st.mode.toString(8).padEnd(7)} ${st.size.toString().padEnd(13)} ${path}`);
    }

    return lines.join("\n") + "\n";
  }
}
