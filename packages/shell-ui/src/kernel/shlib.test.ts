/**
 * @file shlib.test.ts
 * @module StyxOS/Kernel/SharedLibraryEngineTests
 * @description Vitest test suite for Dynamic Linker Subsystem (ld-styx.so, ldconfig, ldd) and /bin/ldd.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Dynamic Linker & Shared Library Loader Test Suite", () => {
  it("should generate shared library cache /etc/ld.so.cache via ldconfig", () => {
    const kernel = new UnixKernel();
    const configReport = kernel.sharedLibraryEngine.ldconfig();

    expect(configReport).toContain("/etc/ld.so.cache");
    expect(configReport).toContain("libc.so.6");
    expect(configReport).toContain("libm.so.6");

    const cacheFile = kernel.resolvePath("/etc/ld.so.cache");
    expect(cacheFile).not.toBeNull();
  });

  it("should inspect shared library dependencies for executable binary via ldd", () => {
    const kernel = new UnixKernel();
    const lddReport = kernel.sharedLibraryEngine.ldd("/bin/hello.wasm");

    expect(lddReport).toContain("/bin/hello.wasm");
    expect(lddReport).toContain("libc.so.6");
    expect(lddReport).toContain("ld-styx.so.1");
  });

  it("should execute /bin/ldd.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/ldd.wasm",
      ["/bin/ldd.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Dynamic Linker Inspector");
  });

  it("should support dynamic library loading and symbol resolution via dlopen, dlsym, and dlclose", () => {
    const kernel = new UnixKernel();
    const handle = kernel.sharedLibraryEngine.dlopen("/lib/libm.so.6");
    expect(handle).toBeGreaterThan(0);

    const sinFunc = kernel.sharedLibraryEngine.dlsym(handle, "sin");
    expect(sinFunc).toBeDefined();
    expect(sinFunc(Math.PI / 2)).toBeCloseTo(1);

    const verFunc = kernel.sharedLibraryEngine.dlsym(handle, "styx_version");
    expect(verFunc()).toBe("0.20.0");

    const status = kernel.sharedLibraryEngine.formatDlopenStatus();
    expect(status).toContain("libm.so.6");

    const closeRes = kernel.sharedLibraryEngine.dlclose(handle);
    expect(closeRes).toBe(true);
  });
});
