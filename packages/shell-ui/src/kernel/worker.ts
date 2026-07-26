/**
 * @file worker.ts
 * @module StyxOS/Kernel/Worker
 * @description Off-main-thread Web Worker task runner for isolated WebAssembly process execution.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface ProcessWorkerMessage {
  type: "RUN_WASM";
  wasmBytes: ArrayBuffer;
  argv: string[];
  envp: Record<string, string>;
}

self.onmessage = async (event: MessageEvent<ProcessWorkerMessage>) => {
  const { type, wasmBytes, argv, envp } = event.data;

  if (type === "RUN_WASM") {
    try {
      let memory: WebAssembly.Memory;
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const wasiImports = {
        wasi_snapshot_preview1: {
          args_sizes_get: (argcPtr: number, argvBufSizePtr: number): number => {
            const view = new DataView(memory.buffer);
            view.setUint32(argcPtr, argv.length, true);
            let size = 0;
            for (const arg of argv) size += encoder.encode(arg + "\0").length;
            view.setUint32(argvBufSizePtr, size, true);
            return 0;
          },

          args_get: (argvPtr: number, argvBufPtr: number): number => {
            const view = new DataView(memory.buffer);
            let currBufPtr = argvBufPtr;
            for (let i = 0; i < argv.length; i++) {
              view.setUint32(argvPtr + i * 4, currBufPtr, true);
              const bytes = encoder.encode(argv[i] + "\0");
              new Uint8Array(memory.buffer, currBufPtr, bytes.length).set(bytes);
              currBufPtr += bytes.length;
            }
            return 0;
          },

          environ_sizes_get: (envcPtr: number, envBufSizePtr: number): number => {
            const view = new DataView(memory.buffer);
            const envEntries = Object.entries(envp).map(([k, v]) => `${k}=${v}\0`);
            view.setUint32(envcPtr, envEntries.length, true);
            let size = 0;
            for (const entry of envEntries) size += encoder.encode(entry).length;
            view.setUint32(envBufSizePtr, size, true);
            return 0;
          },

          environ_get: (environPtr: number, environBufPtr: number): number => {
            const view = new DataView(memory.buffer);
            const envEntries = Object.entries(envp).map(([k, v]) => `${k}=${v}\0`);
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

              if (fd === 1 || fd === 2) {
                const str = decoder.decode(buf);
                self.postMessage({ type: "STDOUT", data: str });
                totalWritten += bufLen;
              }
            }
            view.setUint32(nwrittenPtr, totalWritten, true);
            return 0;
          },

          fd_read: (_fd: number, _iovsPtr: number, _iovsLen: number, nreadPtr: number): number => {
            const view = new DataView(memory.buffer);
            view.setUint32(nreadPtr, 0, true);
            return 0;
          },

          proc_exit: (rval: number): void => {
            self.postMessage({ type: "EXIT", exitCode: rval });
          },
        },
      };

      const module = await WebAssembly.compile(wasmBytes);
      const instance = await WebAssembly.instantiate(module, wasiImports);
      memory = instance.exports.memory as WebAssembly.Memory;

      const startFn = instance.exports._start || instance.exports.main;
      if (typeof startFn === "function") {
        try {
          startFn();
        } catch (err: any) {
          if (!err.message?.includes("proc_exit")) throw err;
        }
      }

      self.postMessage({ type: "EXIT", exitCode: 0 });
    } catch (err: any) {
      self.postMessage({ type: "ERROR", error: err.message });
    }
  }
};
