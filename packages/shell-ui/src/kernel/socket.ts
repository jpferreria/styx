/**
 * @file socket.ts
 * @module StyxOS/Kernel/Socket
 * @description POSIX virtual socket device driver mapping socket descriptors to browser WebSockets and CORS fetch proxy.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { VNode, FileStat } from "./index";

export enum SocketDomain {
  AF_UNIX = 1,
  AF_INET = 2,
  AF_INET6 = 10,
}

export enum SocketType {
  SOCK_STREAM = 1,
  SOCK_DGRAM = 2,
  SOCK_RAW = 3,
}

export class SocketNode implements VNode {
  ino: number;
  domain: SocketDomain;
  type: SocketType;
  remoteUrl: string | null = null;
  boundPort: number = 0;
  connected: boolean = false;
  responseBuffer: Uint8Array = new Uint8Array(0);
  mtime: number = Date.now();
  private ws: WebSocket | null = null;

  constructor(ino: number, domain: SocketDomain = SocketDomain.AF_INET, type: SocketType = SocketType.SOCK_STREAM) {
    this.ino = ino;
    this.domain = domain;
    this.type = type;
  }

  bind(address: string, port: number): void {
    this.remoteUrl = `${address}:${port}`;
    this.boundPort = port;
  }

  async connect(url: string): Promise<void> {
    this.remoteUrl = url;
    try {
      if (url.startsWith("ws://") || url.startsWith("wss://")) {
        if (typeof WebSocket !== "undefined") {
          this.ws = new WebSocket(url);
          this.ws.binaryType = "arraybuffer";
          this.ws.onmessage = (ev) => {
            const data = new Uint8Array(ev.data);
            const merged = new Uint8Array(this.responseBuffer.length + data.length);
            merged.set(this.responseBuffer, 0);
            merged.set(data, this.responseBuffer.length);
            this.responseBuffer = merged;
          };
          this.connected = true;
          return;
        }
      }

      if (typeof fetch !== "undefined") {
        const httpUrl = url.startsWith("http") ? url : `https://${url}`;
        const res = await fetch(httpUrl);
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

  send(data: Uint8Array): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
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
    this.send(data);
    return data.length;
  }

  readdir(): any[] {
    return [];
  }

  createChild(_name: string, _isDir: boolean, _mode: number): VNode {
    throw new Error("Errno 20: Not a directory");
  }

  lookup(_name: string): VNode | null {
    return null;
  }

  removeChild(_name: string): void {}
}
