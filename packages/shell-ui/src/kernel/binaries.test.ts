/**
 * @file binaries.test.ts
 * @module StyxOS/Kernel/BinariesTests
 * @description Vitest test suite for built-in Wasm application binaries (/bin/calc.wasm, /bin/wc.wasm).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Wasm Executable Binaries Test Suite", () => {
  it("should execute /bin/calc.wasm via sys_execve and stream output", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/calc.wasm",
      ["/bin/calc.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("[Calculator] Result: 42");
  });

  it("should execute /bin/wc.wasm via sys_execve and output stream metrics", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/wc.wasm",
      ["/bin/wc.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Styx OS Stream");
  });

  it("should execute /bin/wasm-info.wasm via sys_execve and inspect WASI component headers", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/wasm-info.wasm",
      ["/bin/wasm-info.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("WASI");
  });
});
