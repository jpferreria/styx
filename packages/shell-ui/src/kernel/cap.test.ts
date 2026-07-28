/**
 * @file cap.test.ts
 * @module StyxOS/Kernel/CapabilityEngineTests
 * @description Vitest test suite for POSIX Capabilities & Linux Credentials Engine (capget, capset, getcap, setcap, getuid, setuid) and /bin/getcap.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { CAP_SYS_ADMIN, CAP_NET_BIND_SERVICE } from "./cap";

describe("Styx OS POSIX Capabilities Subsystem Test Suite", () => {
  it("should retrieve and modify process capability sets via capget/capset", () => {
    const kernel = new UnixKernel();

    const caps = kernel.capabilityEngine.capget(1);
    expect(caps.effective & CAP_SYS_ADMIN).toBeTruthy();

    const ok = kernel.capabilityEngine.capset(1, CAP_NET_BIND_SERVICE, CAP_NET_BIND_SERVICE, 0);
    expect(ok).toBe(true);

    const updated = kernel.capabilityEngine.capget(1);
    expect(updated.effective & CAP_NET_BIND_SERVICE).toBeTruthy();
  });

  it("should get and set user credentials and executable file capabilities", () => {
    const kernel = new UnixKernel();

    const uid = kernel.capabilityEngine.getuid();
    expect(uid).toBe(1000);

    const capText = kernel.capabilityEngine.getcap("/bin/ping.wasm");
    expect(capText).toContain("/bin/ping.wasm");

    const setOut = kernel.capabilityEngine.setcap("/bin/ping.wasm", "cap_net_bind_service=+ep");
    expect(setOut).toContain("Updated capabilities");

    const newCapText = kernel.capabilityEngine.getcap("/bin/ping.wasm");
    expect(newCapText).toContain("cap_net_bind_service=+ep");
  });

  it("should execute /bin/getcap.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/getcap.wasm",
      ["/bin/getcap.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Capability Tool");
  });
});
