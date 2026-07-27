/**
 * @file eventfd.test.ts
 * @module StyxOS/Kernel/EventNotificationEngineTests
 * @description Vitest test suite for POSIX Asynchronous Event Notification Subsystem and /bin/epoll.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { EPOLLIN } from "./eventfd";

describe("Styx OS POSIX Event Notification Subsystem Test Suite", () => {
  it("should create, write, and read eventfd counter descriptors", () => {
    const kernel = new UnixKernel();
    const efd = kernel.eventNotificationEngine.createEventFD(10);

    kernel.eventNotificationEngine.writeEventFD(efd, 5);
    const count = kernel.eventNotificationEngine.readEventFD(efd);

    expect(count).toBe(15);
    expect(kernel.eventNotificationEngine.readEventFD(efd)).toBe(0);
  });

  it("should subscribe eventfd descriptors to epoll instance and wait for ready events", () => {
    const kernel = new UnixKernel();
    const efd = kernel.eventNotificationEngine.createEventFD(0);
    const epfd = kernel.eventNotificationEngine.epollCreate();

    kernel.eventNotificationEngine.epollCtl(epfd, "ADD", efd, EPOLLIN);
    expect(kernel.eventNotificationEngine.epollWait(epfd).length).toBe(0);

    kernel.eventNotificationEngine.writeEventFD(efd, 1);
    const ready = kernel.eventNotificationEngine.epollWait(epfd);

    expect(ready.length).toBe(1);
    expect(ready[0]).toBe(efd);
  });

  it("should execute /bin/epoll.wasm via sys_execve and format epoll stats", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/epoll.wasm",
      ["/bin/epoll.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Event Notification");
  });
});
