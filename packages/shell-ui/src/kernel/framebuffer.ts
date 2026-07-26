/**
 * @file framebuffer.ts
 * @module StyxOS/Kernel/Framebuffer
 * @description Virtual framebuffer character device driver (/dev/fb0) for graphical display rendering.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { VNode, FileStat, DirEntry } from "./index";

export class FramebufferNode implements VNode {
  ino: number;
  width: number;
  height: number;
  buffer: Uint8Array;
  mtime: number = Date.now();
  onFrameUpdate?: (width: number, height: number, buffer: Uint8Array) => void;

  constructor(ino: number = 7, width: number = 320, height: number = 200) {
    this.ino = ino;
    this.width = width;
    this.height = height;
    // 4 bytes per pixel (RGBA)
    this.buffer = new Uint8Array(width * height * 4);
  }

  stat(): FileStat {
    return {
      ino: this.ino,
      mode: 0o666,
      size: this.buffer.length,
      isDir: false,
      mtime: this.mtime,
    };
  }

  read(offset: number, count: number): Uint8Array {
    if (offset >= this.buffer.length) return new Uint8Array(0);
    return this.buffer.slice(offset, offset + count);
  }

  write(offset: number, data: Uint8Array): number {
    const toWrite = Math.min(data.length, this.buffer.length - offset);
    this.buffer.set(data.subarray(0, toWrite), offset);
    this.mtime = Date.now();
    this.onFrameUpdate?.(this.width, this.height, this.buffer);
    return toWrite;
  }

  readdir(): DirEntry[] {
    return [];
  }

  createChild(): VNode {
    throw new Error("Framebuffer devices do not support directory child creation");
  }

  lookup(): VNode | null {
    return null;
  }

  removeChild(): void {
    throw new Error("Framebuffer devices do not support directory child removal");
  }
}
