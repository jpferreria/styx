/**
 * @file hwprobe.ts
 * @module StyxOS/Kernel/HardwareProbeEngine
 * @description System Hardware Peripheral Probe Subsystem (lscpu, lspci, lsusb).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export class HardwareProbeEngine {
  private kernel: UnixKernel;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  lscpu(): string {
    return [
      "Architecture:            x86_64 / WebAssembly Wasm64",
      "CPU op-mode(s):          32-bit, 64-bit",
      "Address sizes:           48 bits physical, 48 bits virtual",
      "Byte Order:              Little Endian",
      "CPU(s):                  2",
      "On-line CPU(s) list:     0,1",
      "Vendor ID:               StyxVirtualCPU Engine",
      "Model name:              Styx OS WebAssembly SIMD Multi-Core Core i7",
      "CPU MHz:                 2400.000",
      "BogoMIPS:                4800.00",
      "Virtualization:          WASI WebWorker Sandbox",
      "L1d cache:               64 KiB",
      "L1i cache:               64 KiB",
      "L2 cache:                512 KiB",
      "L3 cache:                4 MiB",
      "Vulnerability Mitigation: Speculative Store Bypass / Wasm Isolates",
      "Flags:                   fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss ht syscall nx rdtscp lm constant_tsc rep_good nopl xtopology tsc_known_freq pni pclmulqdq ssse3 fma cx16 sse4.1 sse4.2 x2apic movbe popcnt tsc_deadline_timer aes xsave avx f16c rdrand hypervisor lahf_lm abm 3dnowprefetch cpuid fsgsbase bmi1 avx2 smep bmi2 erms invpcid rdseed adx smap clflushopt xsaveopt xsavec xgetbv1 xsaves wasm_simd128",
      "",
    ].join("\n");
  }

  lspci(): string {
    const sysActive = !!this.kernel.sysfsManager;
    return [
      "00:00.0 Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)",
      "00:01.0 ISA bridge: Intel Corporation 82371SB PIIX3 ISA [PIIX3] (rev 00)",
      "00:01.1 IDE interface: Intel Corporation 82371SB PIIX3 IDE [PIIX3] (rev 00)",
      "00:02.0 VGA compatible controller: Styx OS Framebuffer GPU (/dev/fb0 320x200 RGBA)",
      "00:03.0 Ethernet controller: Red Hat, Inc. Virtio network device (rev 01)",
      "00:04.0 Audio device: Intel Corporation 82801AA AC'97 Audio Controller (rev 01)",
      "00:05.0 USB controller: Intel Corporation 82371SB PIIX3 USB [USB-UHCI] (rev 01)" + (sysActive ? "" : ""),
      "",
    ].join("\n");
  }

  lsusb(): string {
    return [
      "Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub",
      "Bus 001 Device 002: ID 046d:c52b Logitech, Inc. Unifying Receiver (Keyboard & Mouse)",
      "Bus 001 Device 003: ID 08bb:2704 Texas Instruments PCM2704 16-Bit Stereo Audio DAC",
      "",
    ].join("\n");
  }
}
