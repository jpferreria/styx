/**
 * @file pipe.ts
 * @module StyxOS/Kernel/Pipe
 * @description POSIX IPC pipe buffer implementation for unidirectional process data streaming.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { VNode, FileStat, DirEntry } from "./index";

export class PipeNode implements VNode {
  ino: number;
  buffer: Uint8Array = new Uint8Array(0);
  mtime: number = Date.now();

  constructor(ino: number) {
    this.ino = ino;
  }

  stat(): FileStat {
    return {
      ino: this.ino,
      mode: 0o600,
      size: this.buffer.length,
      isDir: false,
      mtime: this.mtime,
    };
  }

  read(_offset: number, count: number): Uint8Array {
    if (this.buffer.length === 0) return new Uint8Array(0);
    const toRead = Math.min(count, this.buffer.length);
    const chunk = this.buffer.slice(0, toRead);
    this.buffer = this.buffer.slice(toRead);
    return chunk;
  }

  write(_offset: number, data: Uint8Array): number {
    const next = new Uint8Array(this.buffer.length + data.length);
    next.set(this.buffer, 0);
    next.set(data, this.buffer.length);
    this.buffer = next;
    this.mtime = Date.now();
    return data.length;
  }

  readdir(): DirEntry[] {
    return [];
  }

  createChild(): VNode {
    throw new Error("Pipes do not support directory child creation");
  }

  lookup(): VNode | null {
    return null;
  }

  removeChild(): void {
    throw new Error("Pipes do not support directory child removal");
  }
}
