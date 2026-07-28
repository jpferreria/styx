/**
 * @file rlimit.test.ts
 * @module StyxOS/Kernel/ResourceLimitEngineTests
 * @description Vitest test suite for POSIX Process Resource Limits (getrlimit, setrlimit, ulimit) and /bin/ulimit.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { RLIMIT_NOFILE, RLIMIT_STACK } from "./rlimit";

describe("Styx OS POSIX Resource Limits Subsystem Test Suite", () => {
  it("should query and update process resource limits via getrlimit/setrlimit", () => {
    const kernel = new UnixKernel();

    const nofile = kernel.resourceLimitEngine.getrlimit(RLIMIT_NOFILE);
    expect(nofile.rlim_cur).toBe(1024);

    const setOk = kernel.resourceLimitEngine.setrlimit(RLIMIT_NOFILE, 2048, 4096);
    expect(setOk).toBe(true);

    const updated = kernel.resourceLimitEngine.getrlimit(RLIMIT_NOFILE);
    expect(updated.rlim_cur).toBe(2048);
  });

  it("should enforce soft limit <= hard limit invariant and run ulimit shell command", () => {
    const kernel = new UnixKernel();

    expect(() => {
      kernel.resourceLimitEngine.setrlimit(RLIMIT_STACK, 8192, 4096);
    }).toThrow("exceeds hard limit");

    const report = kernel.resourceLimitEngine.ulimit(["-a"]);
    expect(report).toContain("ulimit -a");
    expect(report).toContain("open files");

    const setOut = kernel.resourceLimitEngine.ulimit(["-n", "2048"]);
    expect(setOut).toContain("set to 2048");
  });

  it("should execute /bin/ulimit.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/ulimit.wasm",
      ["/bin/ulimit.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Resource Limit Tool");
  });
});
