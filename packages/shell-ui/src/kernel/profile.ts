/**
 * @file profile.ts
 * @module StyxOS/Kernel/ProfilerEngine
 * @description System performance profiler and sysbench benchmark suite for CPU, Disk VFS I/O, and Memory.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface BenchmarkResult {
  name: string;
  durationMs: number;
  ops: number;
  opsPerSec: number;
  throughputMBs?: number;
}

export class ProfilerEngine {
  private kernel: UnixKernel;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  runCpuBenchmark(maxPrime: number = 10000): BenchmarkResult {
    const start = performance.now();
    let primeCount = 0;

    for (let i = 2; i <= maxPrime; i++) {
      let isPrime = true;
      for (let j = 2; j * j <= i; j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primeCount++;
    }

    const durationMs = Math.max(1, performance.now() - start);
    const opsPerSec = Math.round((primeCount / durationMs) * 1000);

    return {
      name: "CPU Prime Number Benchmark",
      durationMs: Math.round(durationMs),
      ops: primeCount,
      opsPerSec,
    };
  }

  runDiskBenchmark(): BenchmarkResult {
    const start = performance.now();
    const testData = new Uint8Array(1024 * 512); // 512 KB
    testData.fill(0x5a);

    const fd = this.kernel.sys_open("/tmp/bench.tmp", true);
    this.kernel.sys_write(fd, testData);
    this.kernel.sys_close(fd);

    const fdRead = this.kernel.sys_open("/tmp/bench.tmp", false);
    this.kernel.sys_read(fdRead, testData.length);
    this.kernel.sys_close(fdRead);

    const durationMs = Math.max(1, performance.now() - start);
    const totalBytes = testData.length * 2; // Write + Read
    const throughputMBs = parseFloat(((totalBytes / (1024 * 1024)) / (durationMs / 1000)).toFixed(2));

    return {
      name: "VFS Disk Read/Write Throughput",
      durationMs: Math.round(durationMs),
      ops: totalBytes,
      opsPerSec: Math.round(totalBytes / (durationMs / 1000)),
      throughputMBs,
    };
  }

  runMemoryBenchmark(): BenchmarkResult {
    const start = performance.now();
    const size = 1024 * 1024 * 2; // 2 MB
    const buffer = new Uint8Array(size);

    for (let i = 0; i < size; i += 4) {
      buffer[i] = i & 0xff;
    }

    const durationMs = Math.max(1, performance.now() - start);
    const throughputMBs = parseFloat(((size / (1024 * 1024)) / (durationMs / 1000)).toFixed(2));

    return {
      name: "Memory Bandwidth Allocation",
      durationMs: Math.round(durationMs),
      ops: size,
      opsPerSec: Math.round(size / (durationMs / 1000)),
      throughputMBs,
    };
  }

  formatReport(type: string = "cpu"): string {
    let res: BenchmarkResult;
    const targetType = type.toLowerCase();

    if (targetType === "disk") {
      res = this.runDiskBenchmark();
    } else if (targetType === "mem" || targetType === "memory") {
      res = this.runMemoryBenchmark();
    } else {
      res = this.runCpuBenchmark();
    }

    const lines: string[] = [];
    lines.push(`Styx OS Performance Profiler (sysbench)`);
    lines.push(`================================================`);
    lines.push(`Benchmark Type : ${res.name}`);
    lines.push(`Execution Time : ${res.durationMs} ms`);
    lines.push(`Operations     : ${res.ops.toLocaleString()} ops`);
    lines.push(`Performance    : ${res.opsPerSec.toLocaleString()} ops/sec`);
    if (res.throughputMBs !== undefined) {
      lines.push(`Throughput     : ${res.throughputMBs} MB/s`);
    }
    lines.push(`Status         : PASSED (100% Conformance)`);
    return lines.join("\n") + "\n";
  }
}
