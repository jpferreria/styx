/**
 * @file swap.ts
 * @module StyxOS/Kernel/SwapManager
 * @description Virtual swap file subsystem managing /var/swap page-based VFS memory swapping.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface SwapPage {
  pageId: string;
  data: Uint8Array;
}

export class SwapManager {
  private kernel: UnixKernel;
  private pages: Map<string, Uint8Array> = new Map();
  private isEnabled: boolean = true;
  private totalMB: number = 256;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  getKernel(): UnixKernel {
    return this.kernel;
  }

  swapon(): void {
    this.isEnabled = true;
  }

  swapoff(): void {
    this.isEnabled = false;
  }

  isSwapEnabled(): boolean {
    return this.isEnabled;
  }

  swapOut(pageId: string, data: Uint8Array): void {
    if (!this.isEnabled) return;
    this.pages.set(pageId, new Uint8Array(data));
  }

  swapIn(pageId: string): Uint8Array | null {
    if (!this.isEnabled) return null;
    return this.pages.get(pageId) || null;
  }

  getUsedBytes(): number {
    let used = 0;
    for (const p of this.pages.values()) {
      used += p.length;
    }
    return used;
  }

  formatSwapon(): string {
    const usedBytes = this.getUsedBytes();
    const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
    const freeMB = (this.totalMB - parseFloat(usedMB)).toFixed(1);
    const status = this.isEnabled ? "ACTIVE" : "INACTIVE";

    const lines: string[] = [];
    lines.push(`Filename                Type        Size (MB)   Used (MB)   Priority   Status`);
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`/var/swap               file        ${this.totalMB.toString().padEnd(11)} ${usedMB.padEnd(11)} -2         ${status}`);
    lines.push("");
    lines.push(`Total Swap: ${this.totalMB} MB | Used: ${usedMB} MB | Free: ${freeMB} MB`);
    return lines.join("\n") + "\n";
  }
}
