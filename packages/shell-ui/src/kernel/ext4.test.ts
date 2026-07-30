/**
 * @file ext4.test.ts
 * @module StyxOS/Kernel/Ext4BlockEngineTests
 * @description Vitest test suite for Virtual EXT4 Block Storage Driver & OPFS Persistence Engine (/dev/sda, fdisk, mkfs.ext4, mount, umount).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Virtual EXT4 Block Storage Driver & OPFS Engine Test Suite", () => {
  it("should output GPT disk partition table via fdisk", () => {
    const kernel = new UnixKernel();
    const report = kernel.ext4BlockEngine.fdisk(["-l"]);

    expect(report).toContain("/dev/sda");
    expect(report).toContain("Disklabel type: gpt");
    expect(report).toContain("Linux filesystem");
  });

  it("should format EXT4 filesystem with superblock magic 0xEF53 via mkfs.ext4", () => {
    const kernel = new UnixKernel();
    const output = kernel.ext4BlockEngine.mkfsExt4("/dev/sda", "test-vol");

    expect(output).toContain("EXT4 Filesystem formatted");
    expect(output).toContain("test-vol");
  });

  it("should mount and unmount EXT4 block device onto VFS mount points", () => {
    const kernel = new UnixKernel();

    const mounted = kernel.ext4BlockEngine.mount("/dev/sda", "/mnt");
    expect(mounted).toBe(true);

    const status = kernel.ext4BlockEngine.formatMountStatus();
    expect(status).toContain("/dev/sda on /mnt type ext4");

    const unmounted = kernel.ext4BlockEngine.umount("/mnt");
    expect(unmounted).toBe(true);

    const statusAfter = kernel.ext4BlockEngine.formatMountStatus();
    expect(statusAfter).not.toContain("/mnt");
  });
});
