/**
 * @file pty.test.ts
 * @module StyxOS/Kernel/PtyManagerTests
 * @description Vitest test suite for PtyManager pseudoterminal allocation, ptsname, and /bin/pty.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Pseudoterminal Driver (PTY) Test Suite", () => {
  it("should create PTY master/slave pair and resolve ptsname", () => {
    const kernel = new UnixKernel();
    const session = kernel.ptyManager.createPtyPair();

    expect(session.slavePath).toContain("/dev/pts/");
    expect(kernel.ptyManager.ptsname(session.masterFd)).toBe(session.slavePath);

    expect(kernel.ptyManager.grantpt(session.masterFd)).toBe(true);
    expect(kernel.ptyManager.unlockpt(session.masterFd)).toBe(true);
  });

  it("should format active PTY session table report", () => {
    const kernel = new UnixKernel();
    const report = kernel.ptyManager.listSessions();

    expect(report).toContain("PTY ID");
    expect(report).toContain("/dev/pts/");
  });

  it("should execute /bin/pty.wasm via sys_execve and stream executable report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/pty.wasm",
      ["/bin/pty.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Pseudoterminal");
  });
});
