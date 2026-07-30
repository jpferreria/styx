/**
 * @file acl.test.ts
 * @module StyxOS/Kernel/AccessControlListEngineTests
 * @description Vitest test suite for POSIX Extended Access Control Lists (POSIX ACLs - getfacl, setfacl).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Extended Access Control Lists (ACLs) Test Suite", () => {
  it("should output standard POSIX ACL entries via getfacl", () => {
    const kernel = new UnixKernel();
    const output = kernel.accessControlListEngine.getfacl("/home/user/README.txt");

    expect(output).toContain("# file: home/user/README.txt");
    expect(output).toContain("user:rw-");
    expect(output).toContain("group:r--");
    expect(output).toContain("other:r--");
  });

  it("should modify and remove extended user ACL entries via setfacl", () => {
    const kernel = new UnixKernel();
    const filePath = "/home/user/README.txt";

    // Modify ACL entry
    const modResult = kernel.accessControlListEngine.setfacl(["-m", "u:alice:rw-", filePath]);
    expect(modResult).toContain("updated POSIX ACL");

    const aclReport = kernel.accessControlListEngine.getfacl(filePath);
    expect(aclReport).toContain("user:alice:rw-");

    // Remove ACL entry
    const remResult = kernel.accessControlListEngine.setfacl(["-x", "u:alice", filePath]);
    expect(remResult).toContain("updated POSIX ACL");

    const aclReportAfter = kernel.accessControlListEngine.getfacl(filePath);
    expect(aclReportAfter).not.toContain("user:alice");
  });

  it("should evaluate POSIX ACL permission checks", () => {
    const kernel = new UnixKernel();
    const filePath = "/home/user/README.txt";

    kernel.accessControlListEngine.setfacl(["-m", "u:bob:---", filePath]);
    const allowed = kernel.accessControlListEngine.checkAccess(filePath, "user", ["user"]);
    expect(allowed).toBe(true);
  });
});
