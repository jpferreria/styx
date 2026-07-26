/**
 * @file kernel.test.ts
 * @module StyxOS/Kernel/UnitTests
 * @description Vitest unit test suite for VFS, permissions, and POSIX system call functionality.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { UnixKernel } from "./index";

describe("UnixKernel Unit Test Suite", () => {
  let kernel: UnixKernel;

  beforeEach(() => {
    kernel = new UnixKernel();
  });

  it("should initialize default Unix directory hierarchy", () => {
    const rootStat = kernel.sys_stat("/");
    expect(rootStat.isDir).toBe(true);

    const tmpStat = kernel.sys_stat("/tmp");
    expect(tmpStat.isDir).toBe(true);

    const userStat = kernel.sys_stat("/home/user");
    expect(userStat.isDir).toBe(true);
  });

  it("should handle file creation, writing, reading, and close", () => {
    const fd = kernel.sys_open("/tmp/unittest.txt", true);
    const content = "Antigravity OS Unit Test 2026";
    const bytesWritten = kernel.sys_write(fd, new TextEncoder().encode(content));
    expect(bytesWritten).toBe(content.length);
    kernel.sys_close(fd);

    const fd2 = kernel.sys_open("/tmp/unittest.txt", false);
    const readBuf = kernel.sys_read(fd2, 100);
    kernel.sys_close(fd2);

    expect(new TextDecoder().decode(readBuf)).toBe(content);
  });

  it("should list directory entries with sys_readdir", () => {
    kernel.sys_mkdir("/tmp/testdir1");
    kernel.sys_mkdir("/tmp/testdir2");

    const entries = kernel.sys_readdir("/tmp");
    const names = entries.map((e) => e.name);

    expect(names).toContain("testdir1");
    expect(names).toContain("testdir2");
  });

  it("should enforce capability permission model", () => {
    // Expect sys_mkdir to succeed when Capability.STORAGE_ACCESS is present
    expect(() => kernel.sys_mkdir("/tmp/cap_test")).not.toThrow();

    // Revoke permissions
    (kernel as any).capabilities = 0;
    expect(() => kernel.sys_mkdir("/tmp/denied_dir")).toThrowError(/Permission denied/);
  });
});
