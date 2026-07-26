/**
 * @file socket.ts
 * @module StyxOS/Kernel/Socket
 * @description POSIX virtual socket device driver mapping socket descriptors to browser CORS fetch and WebSockets.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { VNode, FileStat, DirEntry } from "./index";

export enum SocketDomain {
  AF_INET = 2,
}

export enum SocketType {
  SOCK_STREAM = 1,
  SOCK_DGRAM = 2,
}

export class SocketNode implements VNode {
  ino: number;
  domain: SocketDomain;
  type: SocketType;
  remoteUrl: string | null = null;
  connected: boolean = false;
  responseBuffer: Uint8Array = new Uint8Array(0);
  mtime: number = Date.now();

  constructor(ino: number, domain: SocketDomain = SocketDomain.AF_INET, type: SocketType = SocketType.SOCK_STREAM) {
    this.ino = ino;
    this.domain = domain;
    this.type = type;
  }

  async connect(url: string): Promise<void> {
    this.remoteUrl = url;
    try {
      if (typeof fetch !== "undefined") {
        const res = await fetch(url);
        const text = await res.text();
        this.responseBuffer = new TextEncoder().encode(text);
      } else {
        this.responseBuffer = new TextEncoder().encode(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nStyx OS Mock Socket Data for ${url}`);
      }
      this.connected = true;
      this.mtime = Date.now();
    } catch (err: any) {
      this.responseBuffer = new TextEncoder().encode(`HTTP/1.1 502 Bad Gateway\r\n\r\nSocket Error: ${err.message}`);
      this.connected = true;
    }
  }

  stat(): FileStat {
    return {
      ino: this.ino,
      mode: 0o666,
      size: this.responseBuffer.length,
      isDir: false,
      mtime: this.mtime,
    };
  }

  read(_offset: number, count: number): Uint8Array {
    if (this.responseBuffer.length === 0) return new Uint8Array(0);
    const toRead = Math.min(count, this.responseBuffer.length);
    const chunk = this.responseBuffer.slice(0, toRead);
    this.responseBuffer = this.responseBuffer.slice(toRead);
    return chunk;
  }

  write(_offset: number, data: Uint8Array): number {
    this.mtime = Date.now();
    return data.length;
  }

  readdir(): DirEntry[] {
    return [];
  }

  createChild(): VNode {
    throw new Error("Sockets do not support directory child creation");
  }

  lookup(): VNode | null {
    return null;
  }

  removeChild(): void {
    throw new Error("Sockets do not support directory child removal");
  }
}
