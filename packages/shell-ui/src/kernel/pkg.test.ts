/**
 * @file pkg.test.ts
 * @module StyxOS/Kernel/PackageManagerTests
 * @description Vitest test suite for PackageManager spkg update, /etc/spkg.conf, install, and remove operations.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { PackageManager } from "./pkg";

describe("Styx OS Package Manager Subsystem Test Suite", () => {
  it("should read /etc/spkg.conf configuration file from VFS", () => {
    const kernel = new UnixKernel();

    const fd = kernel.sys_open("/etc/spkg.conf", false);
    const confText = new TextDecoder().decode(kernel.sys_read(fd, 2048));
    kernel.sys_close(fd);

    expect(confText).toContain("mirror=https://pkg.styx-os.org");
    expect(confText).toContain("architecture=wasm32-wasi");
  });

  it("should perform spkg update repository index synchronization", async () => {
    const kernel = new UnixKernel();
    const pkg = new PackageManager(kernel);

    const updateLog = await pkg.update();
    expect(updateLog).toContain("Hit:1 https://pkg.styx-os.org");
    expect(updateLog).toContain("Updated 4 package index manifests");
  });

  it("should list, install, and remove packages", () => {
    const kernel = new UnixKernel();
    const pkg = new PackageManager(kernel);

    const initialList = pkg.list();
    expect(initialList).toContain("grep");

    const installed = pkg.install("grep");
    expect(installed).toBe(true);
    expect(pkg.list()).toContain("installed");

    const removed = pkg.remove("grep");
    expect(removed).toBe(true);
  });
});
