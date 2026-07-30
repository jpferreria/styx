/**
 * @file socket.test.ts
 * @module StyxOS/Kernel/SocketTests
 * @description Vitest test suite for POSIX sys_socket, sys_connect, WebSockets proxying, network I/O, and /bin/curl.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Virtual Socket & Network Test Suite", () => {
  it("should allocate a socket descriptor and connect to a remote endpoint", async () => {
    const kernel = new UnixKernel();
    const sockFd = kernel.sys_socket();
    expect(sockFd).toBeGreaterThan(0);

    await kernel.sys_connect(sockFd, "https://httpbin.org/get");
    const responseBytes = kernel.sys_recv(sockFd, 4096);
    expect(responseBytes.length).toBeGreaterThan(0);

    kernel.sys_close(sockFd);
  });

  it("should support socket bind, send, and WebSocket proxying mode", async () => {
    const kernel = new UnixKernel();
    const sockFd = kernel.sys_socket();

    const descriptor = (kernel as any).fds.get(sockFd);
    expect(descriptor).toBeDefined();
    const node = descriptor.node;

    node.bind("127.0.0.1", 8080);
    expect(node.boundPort).toBe(8080);

    node.write(0, new TextEncoder().encode("PING"));
    expect(node.stat().mode).toBe(0o666);
  });

  it("should execute /bin/curl.wasm via sys_execve and output network data", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/curl.wasm",
      ["/bin/curl.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Styx OS");
  });
});
