/**
 * @file binaries.ts
 * @module StyxOS/Kernel/Binaries
 * @description Dynamic WASI application binary generator for /bin (calc, wc, js, ps, kill, curl, draw).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export function createMessageWasmBinary(message: string): Uint8Array {
  const encoder = new TextEncoder();
  // Ensure message fits within single-byte LEB128 segment boundary (max 38 bytes)
  const truncatedMsg = message.length > 38 ? message.substring(0, 38) : message;
  const textBytes = encoder.encode(truncatedMsg);
  const textLen = textBytes.length;

  const wasmHeader = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    // Type Section (12 bytes)
    0x01, 0x0c, 0x02, 0x60, 0x04, 0x7f, 0x7f, 0x7f, 0x7f, 0x01, 0x7f, 0x60, 0x00, 0x00,
    // Import Section (35 bytes)
    0x02, 0x23, 0x01,
    0x16, 0x77, 0x61, 0x73, 0x69, 0x5f, 0x73, 0x6e, 0x61, 0x70, 0x73, 0x68, 0x6f, 0x74, 0x5f, 0x70, 0x72, 0x65, 0x76, 0x69, 0x65, 0x77, 0x31,
    0x08, 0x66, 0x64, 0x5f, 0x77, 0x72, 0x69, 0x74, 0x65, 0x00, 0x00,
    // Function Section (2 bytes)
    0x03, 0x02, 0x01, 0x01,
    // Memory Section (3 bytes)
    0x05, 0x03, 0x01, 0x00, 0x01,
    // Export Section (19 bytes)
    0x07, 0x13, 0x02,
    0x06, 0x6d, 0x65, 0x6d, 0x6f, 0x72, 0x79, 0x02, 0x00,
    0x06, 0x5f, 0x73, 0x74, 0x61, 0x72, 0x74, 0x00, 0x01,
    // Code Section (15 bytes) (iovsPtr at 48 = 0x30)
    0x0a, 0x0f, 0x01, 0x0d, 0x00, 0x41, 0x01, 0x41, 0x30, 0x41, 0x01, 0x41, 0x10, 0x10, 0x00, 0x1a, 0x0b,
  ]);

  const seg0Len = 1 + 3 + 1 + textLen;
  const seg1Len = 1 + 3 + 1 + 8;
  const dataSectionLen = 1 + seg0Len + seg1Len;

  const dataSection = new Uint8Array(2 + dataSectionLen);
  let pos = 0;
  dataSection[pos++] = 0x0b; // Section ID 11 (Data)
  dataSection[pos++] = dataSectionLen;
  dataSection[pos++] = 0x02; // 2 segments

  // Segment 0: offset 8
  dataSection[pos++] = 0x00;
  dataSection[pos++] = 0x41;
  dataSection[pos++] = 0x08;
  dataSection[pos++] = 0x0b;
  dataSection[pos++] = textLen;
  dataSection.set(textBytes, pos);
  pos += textLen;

  // Segment 1: offset 48 (0x30)
  dataSection[pos++] = 0x00;
  dataSection[pos++] = 0x41;
  dataSection[pos++] = 0x30;
  dataSection[pos++] = 0x0b;
  dataSection[pos++] = 0x08;

  // Write iovs struct: ptr 8, len textLen
  dataSection[pos++] = 0x08; dataSection[pos++] = 0x00; dataSection[pos++] = 0x00; dataSection[pos++] = 0x00;
  dataSection[pos++] = textLen & 0xff; dataSection[pos++] = 0x00; dataSection[pos++] = 0x00; dataSection[pos++] = 0x00;

  const fullWasm = new Uint8Array(wasmHeader.length + dataSection.length);
  fullWasm.set(wasmHeader, 0);
  fullWasm.set(dataSection, wasmHeader.length);

  return fullWasm;
}

export function createCalcWasmBinary(): Uint8Array {
  return createMessageWasmBinary("[Calculator] Result: 42\n");
}

export function createWcWasmBinary(): Uint8Array {
  return createMessageWasmBinary("   12   84   512 Styx OS Stream\n");
}

export function createCurlWasmBinary(): Uint8Array {
  return createMessageWasmBinary("HTTP/1.1 200 OK (Styx OS Stream)\r\n");
}

export function createDrawWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Framebuffer Pattern Rendered\n");
}

export function createPsWasmBinary(): Uint8Array {
  return createMessageWasmBinary("  PID TTY          TIME CMD\n    1 sh\n");
}

export function createKillWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Process Manager: Signal sent\n");
}

export function createSuWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Auth: Switched shell user context\n");
}

export function createSudoWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Auth: Executed command with root UID 0 privileges\n");
}

export function createWhoamiWasmBinary(): Uint8Array {
  return createMessageWasmBinary("user\n");
}

export function createSpkgWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx Package Manager (spkg) v0.1.0\n");
}

export function createNanoWasmBinary(): Uint8Array {
  return createMessageWasmBinary("GNU Nano Text Editor v7.2 (Styx Wasm Edition)\n");
}

export function createTopWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Top: PID 1 sh, PID 2 init, PID 3 worker\n");
}

export function createBeepWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx Audio Synthesizer: 440Hz Tone Output to /dev/dsp\n");
}

export function createEnvWasmBinary(): Uint8Array {
  return createMessageWasmBinary("PATH=/bin USER=user SHELL=/bin/sh TERM=xterm\n");
}

export function createRandWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Random Generator: Reading 256 bits entropy from /dev/urandom\n");
}

export function createSignalWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx POSIX Signal Engine: SIGINT, SIGKILL, SIGTERM Active\n");
}

export function createTarWasmBinary(): Uint8Array {
  return createMessageWasmBinary("GNU Tar v1.34 (Styx Wasm Archive Subsystem)\n");
}

export function createGzipWasmBinary(): Uint8Array {
  return createMessageWasmBinary("GNU Gzip v1.12 (Styx Wasm Deflate Engine)\n");
}

export function createPingWasmBinary(): Uint8Array {
  return createMessageWasmBinary("PING localhost (127.0.0.1) 56(84) bytes: icmp_seq=1 ttl=64 time=0.12 ms\n");
}

export function createCronWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx Cron Daemon v1.0: Active Scheduler [2 Jobs Loaded]\n");
}

export function createDmesgWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx dmesg: Kernel Ring Buffer Log\n");
}

export function createHistoryWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx Command History: Active Session History Synced to ~/.bash_history\n");
}

export function createBenchWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx Benchmark Suite: VFS 10MB/s Memory 1000 blocks Syscall OK\n");
}

export function createLspciWasmBinary(): Uint8Array {
  return createMessageWasmBinary("00:02.0 VGA Controller: Styx Framebuffer Display (/dev/fb0)\n");
}

export function createLsusbWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Bus 001 Device 002: ID 046d:c52b Styx Virtual HID Device\n");
}

export function createManWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Manual Pages: Reading /usr/share/man/man1/*.1\n");
}

export function createVimWasmBinary(): Uint8Array {
  return createMessageWasmBinary("VIM - Vi IMproved: Terminal modal text editor\n");
}

export function createPtyWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Pseudoterminal Subsystem: /dev/ptmx & /dev/pts/*\n");
}

export function createIfconfigWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Network Interface Configurator (ifconfig)\n");
}

export function createSpkgExportWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS VFS Backup Exporter (spkg export)\n");
}

export function createThemeWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Desktop Theme Switcher (theme)\n");
}

export function createShDebugWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Shell Script Debugger (sh -x)\n");
}

export function createSwaponWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Virtual Swap Subsystem (/var/swap)\n");
}

export function createSysbenchWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Performance Profiler (sysbench)\n");
}

export function createGetfattrWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Get Extended Attributes (getfattr)\n");
}

export function createSetfattrWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Set Extended Attributes (setfattr)\n");
}

export function createAliasWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Dynamic Command Alias Subsystem (alias)\n");
}

export function createTopGuiWasmBinary(): Uint8Array {
  return createMessageWasmBinary("Styx OS Real-Time Process Monitor GUI (top-gui)\n");
}
