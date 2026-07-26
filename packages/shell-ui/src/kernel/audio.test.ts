/**
 * @file audio.test.ts
 * @module StyxOS/Kernel/AudioDeviceTests
 * @description Vitest test suite for /dev/dsp virtual audio device driver and sound synthesis.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { AudioDeviceNode } from "./audio";

describe("Styx OS Audio Device Driver Test Suite", () => {
  it("should initialize /dev/dsp character device node with correct stat metadata", () => {
    const audioNode = new AudioDeviceNode(8);
    const stat = audioNode.stat();

    expect(stat.ino).toBe(8);
    expect(stat.mode).toBe(0o666);
    expect(stat.isDir).toBe(false);
  });

  it("should write frequency PCM audio data to /dev/dsp without throwing", () => {
    const audioNode = new AudioDeviceNode(8);
    const written = audioNode.write(0, new Uint8Array([110, 220, 440]));

    expect(written).toBe(3);
  });

  it("should execute /bin/beep.wasm via sys_execve and stream audio status report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/beep.wasm",
      ["/bin/beep.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Audio Synthesizer");
  });
});
