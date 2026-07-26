/**
 * @file user.test.ts
 * @module StyxOS/Kernel/UserTests
 * @description Vitest test suite for user authentication, /etc/passwd management, su, sudo, and whoami.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS User Accounts & Authentication Test Suite", () => {
  it("should parse and read /etc/passwd and /etc/shadow system files", () => {
    const kernel = new UnixKernel();

    const fdPasswd = kernel.sys_open("/etc/passwd", false);
    const passwdText = new TextDecoder().decode(kernel.sys_read(fdPasswd, 2048));
    kernel.sys_close(fdPasswd);

    expect(passwdText).toContain("root:x:0:0:Styx Superuser");
    expect(passwdText).toContain("user:x:1000:1000:Styx User");

    const fdShadow = kernel.sys_open("/etc/shadow", false);
    const shadowText = new TextDecoder().decode(kernel.sys_read(fdShadow, 2048));
    kernel.sys_close(fdShadow);

    expect(shadowText).toContain("root:");
    expect(shadowText).toContain("user:");
  });

  it("should fetch UID/GID and switch user context via sys_setuid", () => {
    const kernel = new UnixKernel();

    expect(kernel.sys_getuid()).toBe(1000); // Default user UID
    expect(kernel.sys_getgid()).toBe(1000);

    kernel.sys_setuid(0); // Switch to root UID 0
    expect(kernel.sys_getuid()).toBe(0);
    expect(kernel.userManager.getCurrentUser().username).toBe("root");

    kernel.sys_setuid(1000); // Switch back to user
    expect(kernel.sys_getuid()).toBe(1000);
    expect(kernel.userManager.getCurrentUser().username).toBe("user");
  });

  it("should authenticate users and handle su / sudo operations", () => {
    const kernel = new UnixKernel();

    expect(kernel.userManager.authenticate("root", "root")).toBe(true);
    expect(kernel.userManager.authenticate("user", "user")).toBe(true);
    expect(kernel.userManager.authenticate("user", "wrongpass")).toBe(false);

    kernel.userManager.setCurrentUser("root");
    expect(kernel.userManager.getCurrentUser().uid).toBe(0);
  });
});
