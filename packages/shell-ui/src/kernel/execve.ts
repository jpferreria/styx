/**
 * @file execve.ts
 * @module StyxOS/Kernel/Execve
 * @description WASI Preview 1 executable binary runner and system call import handler.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface ExecveOptions {
  kernel: UnixKernel;
  path: string;
  argv?: string[];
  envp?: Record<string, string>;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

export class WasmProcessRunner {
  private kernel: UnixKernel;
  private path: string;
  private argv: string[];
  private envp: Record<string, string>;
  private onStdout?: (data: string) => void;
  private onStderr?: (data: string) => void;

  constructor(options: ExecveOptions) {
    this.kernel = options.kernel;
    this.path = options.path;
    this.argv = options.argv || [options.path];
    this.envp = options.envp || {
      PATH: "/bin:/usr/bin",
      HOME: "/home/user",
      TERM: "xterm-256color",
    };
    this.onStdout = options.onStdout;
    this.onStderr = options.onStderr;
  }

  async run(): Promise<number> {
    const fileNode = this.kernel.resolvePath(this.path);
    if (!fileNode || fileNode.stat().isDir) {
      throw new Error(`Errno 2 (ENOENT): Executable binary not found at ${this.path}`);
    }

    const wasmBytes = fileNode.read(0, fileNode.stat().size);
    if (wasmBytes.length === 0) {
      throw new Error(`Errno 8 (ENOEXEC): Empty executable binary`);
    }

    let exitCode = 0;
    let memory: WebAssembly.Memory;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // WASI Preview 1 Imports
    const wasiImports = {
      wasi_snapshot_preview1: {
        args_sizes_get: (argcPtr: number, argvBufSizePtr: number): number => {
          const view = new DataView(memory.buffer);
          view.setUint32(argcPtr, this.argv.length, true);
          let size = 0;
          for (const arg of this.argv) {
            size += encoder.encode(arg + "\0").length;
          }
          view.setUint32(argvBufSizePtr, size, true);
          return 0; // Success
        },

        args_get: (argvPtr: number, argvBufPtr: number): number => {
          const view = new DataView(memory.buffer);
          let currArgvBufPtr = argvBufPtr;

          for (let i = 0; i < this.argv.length; i++) {
            view.setUint32(argvPtr + i * 4, currArgvBufPtr, true);
            const bytes = encoder.encode(this.argv[i] + "\0");
            new Uint8Array(memory.buffer, currArgvBufPtr, bytes.length).set(bytes);
            currArgvBufPtr += bytes.length;
          }
          return 0;
        },

        environ_sizes_get: (envcPtr: number, envBufSizePtr: number): number => {
          const view = new DataView(memory.buffer);
          const envEntries = Object.entries(this.envp).map(([k, v]) => `${k}=${v}\0`);
          view.setUint32(envcPtr, envEntries.length, true);
          let size = 0;
          for (const entry of envEntries) {
            size += encoder.encode(entry).length;
          }
          view.setUint32(envBufSizePtr, size, true);
          return 0;
        },

        environ_get: (environPtr: number, environBufPtr: number): number => {
          const view = new DataView(memory.buffer);
          const envEntries = Object.entries(this.envp).map(([k, v]) => `${k}=${v}\0`);
          let currBufPtr = environBufPtr;

          for (let i = 0; i < envEntries.length; i++) {
            view.setUint32(environPtr + i * 4, currBufPtr, true);
            const bytes = encoder.encode(envEntries[i]);
            new Uint8Array(memory.buffer, currBufPtr, bytes.length).set(bytes);
            currBufPtr += bytes.length;
          }
          return 0;
        },

        fd_write: (fd: number, iovsPtr: number, iovsLen: number, nwrittenPtr: number): number => {
          const view = new DataView(memory.buffer);
          let totalWritten = 0;

          for (let i = 0; i < iovsLen; i++) {
            const bufPtr = view.getUint32(iovsPtr + i * 8, true);
            const bufLen = view.getUint32(iovsPtr + i * 8 + 4, true);
            const buf = new Uint8Array(memory.buffer, bufPtr, bufLen);

            if (fd === 1) { // stdout
              const str = decoder.decode(buf);
              this.onStdout?.(str);
              totalWritten += bufLen;
            } else if (fd === 2) { // stderr
              const str = decoder.decode(buf);
              this.onStderr?.(str);
              totalWritten += bufLen;
            } else {
              // VFS Write
              totalWritten += this.kernel.sys_write(fd, buf);
            }
          }

          view.setUint32(nwrittenPtr, totalWritten, true);
          return 0;
        },

        fd_read: (fd: number, iovsPtr: number, iovsLen: number, nreadPtr: number): number => {
          const view = new DataView(memory.buffer);
          let totalRead = 0;

          for (let i = 0; i < iovsLen; i++) {
            const bufPtr = view.getUint32(iovsPtr + i * 8, true);
            const bufLen = view.getUint32(iovsPtr + i * 8 + 4, true);

            const chunk = this.kernel.sys_read(fd, bufLen);
            new Uint8Array(memory.buffer, bufPtr, chunk.length).set(chunk);
            totalRead += chunk.length;
            if (chunk.length < bufLen) break;
          }

          view.setUint32(nreadPtr, totalRead, true);
          return 0;
        },

        proc_exit: (rval: number): void => {
          exitCode = rval;
        },
      },
    };

    const module = await WebAssembly.compile(wasmBytes.buffer as ArrayBuffer);
    const instance = await WebAssembly.instantiate(module, wasiImports);
    memory = instance.exports.memory as WebAssembly.Memory;

    const startFn = instance.exports._start || instance.exports.main;
    if (typeof startFn === "function") {
      try {
        startFn();
      } catch (err: any) {
        if (!err.message?.includes("proc_exit")) {
          throw err;
        }
      }
    }

    return exitCode;
  }
}
