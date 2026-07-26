/**
 * @file random.ts
 * @module StyxOS/Kernel/RandomDevice
 * @description Virtual cryptographic random device driver (/dev/urandom, /dev/random) using Web Crypto API.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { VNode, FileStat, DirEntry } from "./index";

export class RandomDeviceNode implements VNode {
  ino: number;

  constructor(ino: number = 9) {
    this.ino = ino;
  }

  stat(): FileStat {
    return {
      ino: this.ino,
      mode: 0o444,
      size: 0,
      isDir: false,
      mtime: Date.now(),
    };
  }

  read(_offset: number, count: number): Uint8Array {
    const bytes = new Uint8Array(count);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      // Fallback pseudo-random for headless test runners
      for (let i = 0; i < count; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return bytes;
  }

  write(): number {
    throw new Error("Errno 13 (EACCES): Random devices do not support write operations");
  }

  readdir(): DirEntry[] {
    return [];
  }

  createChild(): VNode {
    throw new Error("Random devices do not support directory child creation");
  }

  lookup(): VNode | null {
    return null;
  }

  removeChild(): void {
    throw new Error("Random devices do not support directory child removal");
  }
}
