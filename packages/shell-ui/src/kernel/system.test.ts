/**
 * @file system.test.ts
 * @module StyxOS/Kernel/SystemDiagnosticEngineTests
 * @description Vitest test suite for Grand POSIX Subsystem Convergence (syscheck, posix-status) and /bin/syscheck.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Grand POSIX System Diagnostic & Convergence Test Suite", () => {
  it("should audit all 40+ POSIX kernel subsystems and report 100% operational status score", () => {
    const kernel = new UnixKernel();
    const audit = kernel.systemDiagnosticEngine.syscheck();

    expect(audit.total).toBeGreaterThanOrEqual(40);
    expect(audit.operational).toBe(audit.total);
    expect(audit.score).toBe(100.0);
  });

  it("should format posix-status diagnostic report matrix", () => {
    const kernel = new UnixKernel();
    const report = kernel.systemDiagnosticEngine.formatPosixStatus();

    expect(report).toContain("GRAND POSIX KERNEL SUBSYSTEM AUDIT");
    expect(report).toContain("100% OPERATIONAL");
    expect(report).toContain("Virtual File System");
    expect(report).toContain("Security Capabilities");
    expect(report).toContain("Process Resource Limits");
    expect(report).toContain("Event Polling & Multiplexing");
  });

  it("should execute /bin/syscheck.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/syscheck.wasm",
      ["/bin/syscheck.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("System Health Tool");
  });
});
