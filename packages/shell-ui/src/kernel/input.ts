/**
 * @file input.ts
 * @module StyxOS/Kernel/InputDeviceEngine
 * @description Hardware USB/HID Input Subsystem (/dev/input/event0, /dev/input/mice, evtest).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export const EV_SYN = 0x00;
export const EV_KEY = 0x01;
export const EV_REL = 0x02;
export const EV_ABS = 0x03;

export interface InputEvent {
  timeSec: number;
  timeUsec: number;
  type: number;
  code: number;
  value: number;
}

export class InputDeviceEngine {
  private kernel: UnixKernel;
  private keyboardEvents: InputEvent[] = [];
  private mouseEvents: InputEvent[] = [];

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
    this.setupInputDevices();
  }

  private setupInputDevices(): void {
    const devDir = this.kernel.resolvePath("/dev");
    if (devDir && devDir.stat().isDir) {
      const inputDir = devDir.lookup("input") || devDir.createChild("input", true, 0o755);
      if (inputDir && inputDir.stat().isDir) {
        if (!inputDir.lookup("event0")) inputDir.createChild("event0", false, 0o666);
        if (!inputDir.lookup("mice")) inputDir.createChild("mice", false, 0o666);
      }
    }

    // Seed default sample HID events
    const now = Math.floor(Date.now() / 1000);
    this.keyboardEvents.push({ timeSec: now, timeUsec: 100, type: EV_KEY, code: 28, value: 1 }); // KEY_ENTER down
    this.keyboardEvents.push({ timeSec: now, timeUsec: 150, type: EV_KEY, code: 28, value: 0 }); // KEY_ENTER up
    this.mouseEvents.push({ timeSec: now, timeUsec: 200, type: EV_REL, code: 0, value: 5 });     // REL_X +5
    this.mouseEvents.push({ timeSec: now, timeUsec: 210, type: EV_REL, code: 1, value: -3 });    // REL_Y -3
  }

  emitKeyEvent(code: number, value: number): void {
    const now = Date.now();
    this.keyboardEvents.push({
      timeSec: Math.floor(now / 1000),
      timeUsec: (now % 1000) * 1000,
      type: EV_KEY,
      code,
      value,
    });
  }

  emitMouseEvent(relX: number, relY: number): void {
    const now = Date.now();
    this.mouseEvents.push({
      timeSec: Math.floor(now / 1000),
      timeUsec: (now % 1000) * 1000,
      type: EV_REL,
      code: 0,
      value: relX,
    });
    this.mouseEvents.push({
      timeSec: Math.floor(now / 1000),
      timeUsec: (now % 1000) * 1000,
      type: EV_REL,
      code: 1,
      value: relY,
    });
  }

  evtest(): string {
    const lines: string[] = [
      "=== Styx OS Hardware USB/HID Input Event Inspector (evtest) ===",
      "Input driver version: 1.0.1",
      "Available devices:",
      "/dev/input/event0:  Styx Virtual Keyboard HID Device",
      "/dev/input/mice:    Styx Virtual Mouse HID Device",
      "",
      "--- Recent HID Event Log (/dev/input/event0 & /dev/input/mice) ---",
      "TIMESTAMP             DEV           TYPE      CODE   VALUE",
    ];

    for (const ev of this.keyboardEvents) {
      lines.push(`${ev.timeSec}.${ev.timeUsec.toString().padStart(6, "0")}  /dev/input/event0  EV_KEY(${ev.type})  ${ev.code.toString().padEnd(6)} ${ev.value}`);
    }

    for (const ev of this.mouseEvents) {
      lines.push(`${ev.timeSec}.${ev.timeUsec.toString().padStart(6, "0")}  /dev/input/mice    EV_REL(${ev.type})  ${ev.code.toString().padEnd(6)} ${ev.value}`);
    }

    return lines.join("\n") + "\n";
  }

  listInputs(): string {
    const lines: string[] = [
      "=== Styx OS Input Event Devices ===",
      "DEVICE            NAME                                BUS   TYPE",
      "/dev/input/event0 Styx Virtual Keyboard HID Device   USB   Keyboard",
      "/dev/input/mice   Styx Virtual Mouse HID Device      USB   Mouse",
    ];
    return lines.join("\n") + "\n";
  }
}
