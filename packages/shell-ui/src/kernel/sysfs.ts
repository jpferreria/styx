/**
 * @file sysfs.ts
 * @module StyxOS/Kernel/SysFS
 * @description Virtual SysFS (/sys) device tree and hardware probe subsystem (lspci, lsusb).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface PciDevice {
  slot: string;
  vendor: string;
  device: string;
  description: string;
}

export interface UsbDevice {
  bus: string;
  device: string;
  id: string;
  description: string;
}

export class SysFSManager {
  private pciDevices: PciDevice[] = [];
  private usbDevices: UsbDevice[] = [];

  constructor() {
    this.pciDevices = [
      { slot: "00:00.0", vendor: "8086:1237", device: "Host Bridge", description: "Styx Virtual System Controller" },
      { slot: "00:01.0", vendor: "8086:7000", device: "ISA Bridge", description: "Styx Virtual Bus Controller" },
      { slot: "00:02.0", vendor: "1234:1111", device: "VGA Controller", description: "Styx Virtual Framebuffer Display (/dev/fb0)" },
      { slot: "00:03.0", vendor: "8086:2415", device: "Audio Controller", description: "Styx Web Audio DSP Device (/dev/dsp)" },
    ];

    this.usbDevices = [
      { bus: "Bus 001", device: "Device 001", id: "1d6b:0002", description: "Linux Foundation 2.0 root hub" },
      { bus: "Bus 001", device: "Device 002", id: "046d:c52b", description: "Logitech Unifying Receiver (Styx Virtual HID Keyboard/Mouse)" },
    ];
  }

  listPci(): string {
    const lines: string[] = [];
    for (const d of this.pciDevices) {
      lines.push(`${d.slot} ${d.device}: ${d.description} (${d.vendor})`);
    }
    return lines.join("\n") + "\n";
  }

  listUsb(): string {
    const lines: string[] = [];
    for (const u of this.usbDevices) {
      lines.push(`${u.bus} ${u.device}: ID ${u.id} ${u.description}`);
    }
    return lines.join("\n") + "\n";
  }
}
