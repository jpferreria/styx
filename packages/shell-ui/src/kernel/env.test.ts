/**
 * @file env.test.ts
 * @module StyxOS/Kernel/EnvironmentTests
 * @description Vitest test suite for POSIX Environment Variable subsystem, /etc/environment, and export/env/unset.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Environment Variable Subsystem Test Suite", () => {
  it("should read system defaults from /etc/environment", () => {
    const kernel = new UnixKernel();

    const fd = kernel.sys_open("/etc/environment", false);
    const text = new TextDecoder().decode(kernel.sys_read(fd, 2048));
    kernel.sys_close(fd);

    expect(text).toContain('PATH="/bin:/usr/bin"');
    expect(text).toContain('USER="user"');
  });

  it("should set, fetch, and unset environment variables via syscalls", () => {
    const kernel = new UnixKernel();

    expect(kernel.sys_getenv("PATH")).toBe("/bin:/usr/bin");

    kernel.sys_setenv("CUSTOM_VAR", "StyxOSValue");
    expect(kernel.sys_getenv("CUSTOM_VAR")).toBe("StyxOSValue");

    kernel.sys_unsetenv("CUSTOM_VAR");
    expect(kernel.sys_getenv("CUSTOM_VAR")).toBeUndefined();
  });

  it("should execute /bin/env.wasm via sys_execve and output default environment", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/env.wasm",
      ["/bin/env.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("PATH=");
  });
});
