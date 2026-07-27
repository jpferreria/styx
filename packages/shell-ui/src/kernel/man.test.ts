/**
 * @file man.test.ts
 * @module StyxOS/Kernel/ManualManagerTests
 * @description Vitest test suite for ManualManager man page lookups, /usr/share/man/man1 files, and /bin/man.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { ManualManager } from "./man";

describe("Styx OS POSIX Manual Page Subsystem Test Suite", () => {
  it("should read /usr/share/man/man1/spkg.1 man page file from VFS", () => {
    const kernel = new UnixKernel();

    const fd = kernel.sys_open("/usr/share/man/man1/spkg.1", false);
    const manText = new TextDecoder().decode(kernel.sys_read(fd, 4096));
    kernel.sys_close(fd);

    expect(manText).toContain("SPKG(1)");
    expect(manText).toContain("package manager");
  });

  it("should format POSIX manual pages for target commands", () => {
    const man = new ManualManager();

    const page = man.getManPage("top");
    expect(page).toContain("TOP(1)");
    expect(page).toContain("SYNOPSIS");
    expect(page).toContain("DESCRIPTION");
  });

  it("should execute /bin/man.wasm via sys_execve and stream manual report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/man.wasm",
      ["/bin/man.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Manual Pages");
  });
});
