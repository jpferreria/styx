/**
 * @file net.ts
 * @module StyxOS/Kernel/NetworkManager
 * @description Network ICMP diagnostics, /etc/hosts resolution, and latency ping measurement.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export class NetworkManager {
  private hosts: Map<string, string> = new Map();

  constructor() {
    this.hosts.set("localhost", "127.0.0.1");
    this.hosts.set("styx", "127.0.0.1");
    this.hosts.set("dns.google", "8.8.8.8");
    this.hosts.set("google.com", "142.250.190.46");
  }

  resolveHost(hostname: string): string {
    return this.hosts.get(hostname) || hostname;
  }

  generateEtcHosts(): string {
    const lines: string[] = [];
    for (const [name, ip] of this.hosts.entries()) {
      lines.push(`${ip.padEnd(16)} ${name}`);
    }
    return lines.join("\n") + "\n";
  }

  async ping(target: string, count: number = 4): Promise<string> {
    const ip = this.resolveHost(target);
    const lines: string[] = [`PING ${target} (${ip}) 56(84) bytes of data.`];

    for (let i = 1; i <= count; i++) {
      const start = performance.now();
      // Simulate socket ICMP latency round-trip
      await new Promise((r) => setTimeout(r, 12));
      const latency = (performance.now() - start).toFixed(2);
      lines.push(`64 bytes from ${ip}: icmp_seq=${i} ttl=64 time=${latency} ms`);
    }

    lines.push(`--- ${target} ping statistics ---`);
    lines.push(`${count} packets transmitted, ${count} received, 0% packet loss, time 48ms`);
    return lines.join("\n") + "\n";
  }
}
