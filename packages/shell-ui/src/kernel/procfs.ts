/**
 * @file procfs.ts
 * @module StyxOS/Kernel/ProcFS
 * @description Virtual /proc filesystem driver providing dynamic system information, memory stats, and process status.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { VNode, FileStat, DirEntry } from "./index";

export type ProcFSGenerator = () => string;

export class ProcFSNode implements VNode {
  ino: number;
  generator: ProcFSGenerator;
  isDirNode: boolean;
  children: Map<string, VNode> = new Map();

  constructor(ino: number, generator: ProcFSGenerator, isDir: boolean = false) {
    this.ino = ino;
    this.generator = generator;
    this.isDirNode = isDir;
  }

  stat(): FileStat {
    const text = this.generator();
    return {
      ino: this.ino,
      mode: 0o444,
      size: text.length,
      isDir: this.isDirNode,
      mtime: Date.now(),
    };
  }

  read(offset: number, count: number): Uint8Array {
    const text = this.generator();
    const bytes = new TextEncoder().encode(text);
    if (offset >= bytes.length) return new Uint8Array(0);
    return bytes.slice(offset, offset + count);
  }

  write(): number {
    throw new Error("Errno 13 (EACCES): ProcFS virtual files are read-only");
  }

  readdir(): DirEntry[] {
    const list: DirEntry[] = [];
    for (const [name, node] of this.children.entries()) {
      list.push({ name, isDir: node.stat().isDir, size: node.stat().size });
    }
    return list;
  }

  createChild(name: string, isDir: boolean, _mode: number): VNode {
    const child = new ProcFSNode(Math.floor(Math.random() * 10000) + 2000, () => "", isDir);
    this.children.set(name, child);
    return child;
  }

  lookup(name: string): VNode | null {
    return this.children.get(name) || null;
  }

  removeChild(name: string): void {
    this.children.delete(name);
  }
}
