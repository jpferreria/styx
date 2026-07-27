/**
 * @file net.ts
 * @module StyxOS/Kernel/NetworkManager
 * @description Network ICMP diagnostics, /etc/hosts, /etc/resolv.conf, /sys/class/net/eth0, and ifconfig engine.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface NetworkInterface {
  name: string;
  ip: string;
  netmask: string;
  mac: string;
  mtu: number;
  rxPackets: number;
  txPackets: number;
  rxBytes: number;
  txBytes: number;
}

export class NetworkManager {
  private hosts: Map<string, string> = new Map();
  private interfaces: Map<string, NetworkInterface> = new Map();

  constructor() {
    this.hosts.set("localhost", "127.0.0.1");
    this.hosts.set("styx", "127.0.0.1");
    this.hosts.set("dns.google", "8.8.8.8");
    this.hosts.set("google.com", "142.250.190.46");

    this.interfaces.set("lo", {
      name: "lo",
      ip: "127.0.0.1",
      netmask: "255.0.0.0",
      mac: "00:00:00:00:00:00",
      mtu: 65536,
      rxPackets: 42,
      txPackets: 42,
      rxBytes: 3528,
      txBytes: 3528,
    });

    this.interfaces.set("eth0", {
      name: "eth0",
      ip: "192.168.1.100",
      netmask: "255.255.255.0",
      mac: "52:54:00:12:34:56",
      mtu: 1500,
      rxPackets: 1284,
      txPackets: 952,
      rxBytes: 154820,
      txBytes: 98410,
    });
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

  generateResolvConf(): string {
    const lines: string[] = [
      "# Styx OS Virtual Network Resolver",
      "nameserver 8.8.8.8",
      "nameserver 1.1.1.1",
      "search localdomain",
    ];
    return lines.join("\n") + "\n";
  }

  formatIfconfig(): string {
    const lines: string[] = [];

    for (const iface of this.interfaces.values()) {
      lines.push(`${iface.name}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu ${iface.mtu}`);
      lines.push(`        inet ${iface.ip}  netmask ${iface.netmask}`);
      lines.push(`        ether ${iface.mac}  txqueuelen 1000  (Ethernet)`);
      lines.push(`        RX packets ${iface.rxPackets}  bytes ${iface.rxBytes} (${(iface.rxBytes / 1024).toFixed(1)} KB)`);
      lines.push(`        TX packets ${iface.txPackets}  bytes ${iface.txBytes} (${(iface.txBytes / 1024).toFixed(1)} KB)`);
      lines.push("");
    }

    return lines.join("\n");
  }

  async ping(target: string, count: number = 4): Promise<string> {
    const ip = this.resolveHost(target);
    const lines: string[] = [`PING ${target} (${ip}) 56(84) bytes of data.`];

    for (let i = 1; i <= count; i++) {
      const start = performance.now();
      await new Promise((r) => setTimeout(r, 12));
      const latency = (performance.now() - start).toFixed(2);
      lines.push(`64 bytes from ${ip}: icmp_seq=${i} ttl=64 time=${latency} ms`);
    }

    lines.push(`--- ${target} ping statistics ---`);
    lines.push(`${count} packets transmitted, ${count} received, 0% packet loss, time 48ms`);
    return lines.join("\n") + "\n";
  }
}
