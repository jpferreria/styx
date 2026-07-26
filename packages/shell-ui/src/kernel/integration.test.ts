/**
 * @file integration.test.ts
 * @module StyxOS/Kernel/IntegrationTests
 * @description Integration test suite for WASI execve process execution and POSIX compliance suite.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("UnixKernel Integration & WASI Execve Test Suite", () => {
  it("should execute /bin/hello.wasm binary via sys_execve and stream stdout", async () => {
    const kernel = new UnixKernel();
    let stdoutOutput = "";

    const exitCode = await kernel.sys_execve(
      "/bin/hello.wasm",
      ["/bin/hello.wasm"],
      undefined,
      (stdout) => {
        stdoutOutput += stdout;
      }
    );

    expect(exitCode).toBe(0);
    expect(stdoutOutput).toContain("Hello from Wasm App inside Styx OS Kernel!");
  });

  it("should pass the built-in POSIX compliance test suite", () => {
    const kernel = new UnixKernel();
    const report = kernel.runPosixTestSuite();

    expect(report).toContain("[PASS] POSIX Syscall: mkdir & stat");
    expect(report).toContain("[PASS] POSIX Syscall: open, write, read & close");
    expect(report).toContain("[PASS] POSIX Syscall: readdir & unlink");
    expect(report).toContain("[PASS] Kernel Security: capability permission checks");
    expect(report).toContain("Summary: 4/4 POSIX assertions passed successfully.");
  });
});
