/**
 * @file poll.test.ts
 * @module StyxOS/Kernel/EventMultiplexEngineTests
 * @description Vitest test suite for POSIX Inter-Process Event Polling & Multiplexing (select, poll, epoll_create, epoll_ctl, epoll_wait, lspoll) and /bin/poll.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { POLLIN, POLLOUT } from "./poll";

describe("Styx OS POSIX Event Polling & Multiplexing Test Suite", () => {
  it("should poll array of file descriptors via select and poll", () => {
    const kernel = new UnixKernel();

    const sel = kernel.eventMultiplexEngine.select([0, 1, 2], [1, 2], []);
    expect(sel.read).toEqual([0, 1, 2]);
    expect(sel.write).toEqual([1, 2]);

    const pollRes = kernel.eventMultiplexEngine.poll([
      { fd: 0, events: POLLIN, revents: 0 },
      { fd: 1, events: POLLOUT, revents: 0 },
    ]);
    expect(pollRes[0].revents & POLLIN).toBeTruthy();
    expect(pollRes[1].revents & POLLOUT).toBeTruthy();
  });

  it("should manage epoll instance lifecycle (epoll_create, epoll_ctl, epoll_wait, lspoll)", () => {
    const kernel = new UnixKernel();

    const epfd = kernel.eventMultiplexEngine.epollCreate(1024);
    expect(epfd).toBeGreaterThanOrEqual(800);

    const addOk = kernel.eventMultiplexEngine.epollCtl(epfd, "ADD", 3, POLLIN);
    expect(addOk).toBe(true);

    const events = kernel.eventMultiplexEngine.epollWait(epfd, 10);
    expect(events.length).toBe(1);
    expect(events[0].fd).toBe(3);

    const lspollReport = kernel.eventMultiplexEngine.lspoll();
    expect(lspollReport).toContain("Active Epoll Multiplexing Descriptors");
    expect(lspollReport).toContain("POLLIN");
  });

  it("should execute /bin/poll.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/poll.wasm",
      ["/bin/poll.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Event Multiplexing Tool");
  });
});
