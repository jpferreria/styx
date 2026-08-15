/**
 * @file shlib.ts
 * @module StyxOS/Kernel/SharedLibraryEngine
 * @description Dynamic Linker & Shared Library Loader Subsystem (ld-styx.so, ldconfig, ldd).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface SharedLibraryInfo {
  name: string;
  path: string;
  soname: string;
  address: string;
}

export interface LoadedDlHandle {
  handle: number;
  path: string;
  symbols: Map<string, any>;
}

export class SharedLibraryEngine {
  private kernel: UnixKernel;
  private libraries: Map<string, SharedLibraryInfo> = new Map();
  private loadedHandles: Map<number, LoadedDlHandle> = new Map();
  private nextHandleId: number = 1000;
  private lastError: string = "";

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
    this.setupStandardLibraries();
  }

  private setupStandardLibraries(): void {
    const libDir = this.kernel.resolvePath("/lib");

    const stdLibs: SharedLibraryInfo[] = [
      { name: "libc.so.6", path: "/lib/libc.so.6", soname: "libc.so.6", address: "0x00007f9010000000" },
      { name: "libm.so.6", path: "/lib/libm.so.6", soname: "libm.so.6", address: "0x00007f9010200000" },
      { name: "libpthread.so.0", path: "/lib/libpthread.so.0", soname: "libpthread.so.0", address: "0x00007f9010400000" },
      { name: "libwasm.so", path: "/lib/libwasm.so", soname: "libwasm.so", address: "0x00007f9010600000" },
      { name: "ld-styx.so.1", path: "/lib/ld-styx.so.1", soname: "ld-styx.so.1", address: "0x00007f9010800000" },
    ];

    for (const lib of stdLibs) {
      this.libraries.set(lib.name, lib);
      if (libDir && !libDir.lookup(lib.name)) {
        const fileNode = libDir.createChild(lib.name, false, 0o755);
        fileNode.write(0, new TextEncoder().encode(`/* Styx OS Shared Object ${lib.name} */\n`));
      }
    }
  }

  ldconfig(): string {
    const etcDir = this.kernel.resolvePath("/etc");
    const cacheNode = etcDir?.lookup("ld.so.cache") || etcDir?.createChild("ld.so.cache", false, 0o644);

    const lines: string[] = [
      "=== Styx OS Dynamic Linker Cache Generator (ldconfig) ===",
      `${this.libraries.size} libs found in cache '/etc/ld.so.cache'`,
      "",
      "SONAME           PATH                  LOAD ADDRESS",
    ];

    for (const lib of this.libraries.values()) {
      lines.push(`${lib.soname.padEnd(16)} ${lib.path.padEnd(21)} ${lib.address}`);
    }

    const cacheText = lines.join("\n") + "\n";
    if (cacheNode) {
      cacheNode.write(0, new TextEncoder().encode(cacheText));
    }
    return cacheText;
  }

  ldd(binaryPath: string = "/bin/hello.wasm"): string {
    const target = binaryPath.startsWith("/") ? binaryPath : `/${binaryPath}`;
    const file = this.kernel.resolvePath(target);

    if (!file) {
      throw new Error(`Errno 2: Binary not found '${target}'`);
    }

    const lines: string[] = [
      `=== Shared Library Dependencies for ${target} ===`,
      `\tlinux-vdso.so.1 (0x00007ffd99990000)`,
      `\tlibc.so.6 => /lib/libc.so.6 (0x00007f9010000000)`,
      `\tlibm.so.6 => /lib/libm.so.6 (0x00007f9010200000)`,
      `\tlibpthread.so.0 => /lib/libpthread.so.0 (0x00007f9010400000)`,
      `\t/lib/ld-styx.so.1 (0x00007f9010800000)`,
    ];

    return lines.join("\n") + "\n";
  }

  dlopen(path: string, _mode: number = 1): number {
    const normPath = path.startsWith("/") ? path : `/lib/${path}`;
    const libName = path.split("/").pop() || path;
    const file = this.kernel.resolvePath(normPath);
    if (!file && !this.libraries.has(libName)) {
      this.lastError = `dlopen: cannot open shared object file: No such file or directory (${path})`;
      return 0;
    }

    const handleId = ++this.nextHandleId;
    const symbols = new Map<string, any>();
    symbols.set("sin", (x: number) => Math.sin(x));
    symbols.set("cos", (x: number) => Math.cos(x));
    symbols.set("strlen", (s: string) => s.length);
    symbols.set("styx_version", () => "0.20.0");

    this.loadedHandles.set(handleId, {
      handle: handleId,
      path: normPath,
      symbols,
    });

    this.lastError = "";
    return handleId;
  }

  dlsym(handle: number, symbol: string): any {
    const loaded = this.loadedHandles.get(handle);
    if (!loaded) {
      this.lastError = `dlsym: invalid handle ${handle}`;
      return null;
    }
    if (!loaded.symbols.has(symbol)) {
      this.lastError = `dlsym: undefined symbol '${symbol}' in ${loaded.path}`;
      return null;
    }
    this.lastError = "";
    return loaded.symbols.get(symbol);
  }

  dlclose(handle: number): boolean {
    if (!this.loadedHandles.has(handle)) {
      this.lastError = `dlclose: handle ${handle} not loaded`;
      return false;
    }
    this.loadedHandles.delete(handle);
    this.lastError = "";
    return true;
  }

  dlerror(): string {
    const err = this.lastError;
    this.lastError = "";
    return err;
  }

  formatDlopenStatus(): string {
    const lines: string[] = ["=== Styx OS Dynamic Shared Object Loader Status (dlopen) ==="];
    lines.push(`Loaded Libraries: ${this.loadedHandles.size}`);
    lines.push(`System Cache:     ${this.libraries.size} sonames in /etc/ld.so.cache`);
    lines.push("");
    lines.push("HANDLE  PATH                  SYMBOLS EXPORTED");
    for (const dl of this.loadedHandles.values()) {
      lines.push(`${dl.handle.toString().padEnd(7)} ${dl.path.padEnd(21)} ${Array.from(dl.symbols.keys()).join(", ")}`);
    }
    return lines.join("\n") + "\n";
  }
}
