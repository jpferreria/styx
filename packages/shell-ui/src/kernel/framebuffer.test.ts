/**
 * @file framebuffer.test.ts
 * @module StyxOS/Kernel/FramebufferTests
 * @description Vitest test suite for /dev/fb0 virtual framebuffer device driver and graphical Wasm binaries.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { FramebufferNode } from "./framebuffer";

describe("Styx OS Framebuffer & Display Driver Test Suite", () => {
  it("should initialize /dev/fb0 character device node with correct resolution and mode", () => {
    const fbNode = new FramebufferNode(7, 320, 200);
    const stat = fbNode.stat();

    expect(stat.ino).toBe(7);
    expect(stat.mode).toBe(0o666);
    expect(stat.size).toBe(320 * 200 * 4); // 256,000 bytes RGBA
  });

  it("should write RGBA pixel buffer to /dev/fb0 and trigger frame update callback", () => {
    const fbNode = new FramebufferNode(7, 320, 200);
    let updated = false;

    fbNode.onFrameUpdate = (w, h, buf) => {
      updated = true;
      expect(w).toBe(320);
      expect(h).toBe(200);
      expect(buf[0]).toBe(255); // Red byte
    };

    const pixels = new Uint8Array([255, 0, 0, 255]); // Red pixel
    const written = fbNode.write(0, pixels);

    expect(written).toBe(4);
    expect(updated).toBe(true);
  });

  it("should execute /bin/draw.wasm via sys_execve and stream status report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/draw.wasm",
      ["/bin/draw.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Framebuffer Pattern");
  });
});
