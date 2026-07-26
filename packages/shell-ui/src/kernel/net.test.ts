/**
 * @file net.test.ts
 * @module StyxOS/Kernel/NetworkManagerTests
 * @description Vitest test suite for NetworkManager hostname resolution, ping diagnostics, and /bin/ping.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { NetworkManager } from "./net";

describe("Styx OS Network Diagnostics Test Suite", () => {
  it("should parse and read /etc/hosts system configuration file", () => {
    const kernel = new UnixKernel();

    const fd = kernel.sys_open("/etc/hosts", false);
    const hostsText = new TextDecoder().decode(kernel.sys_read(fd, 2048));
    kernel.sys_close(fd);

    expect(hostsText).toContain("127.0.0.1        localhost");
    expect(hostsText).toContain("google.com");
  });

  it("should resolve hostnames and measure ping ICMP latency statistics", async () => {
    const net = new NetworkManager();

    expect(net.resolveHost("localhost")).toBe("127.0.0.1");
    expect(net.resolveHost("google.com")).toBe("142.250.190.46");

    const report = await net.ping("localhost", 2);
    expect(report).toContain("PING localhost");
    expect(report).toContain("icmp_seq=1");
    expect(report).toContain("0% packet loss");
  });

  it("should execute /bin/ping.wasm via sys_execve and stream ping response", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/ping.wasm",
      ["/bin/ping.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("PING localhost");
  });
});
