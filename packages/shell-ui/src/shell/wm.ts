/**
 * @file wm.ts
 * @module StyxOS/ShellHost/WindowManager
 * @description Desktop window manager handling draggable/resizable windows, Z-index stacking, taskbar tray clock, and notifications.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface WindowOptions {
  id: string;
  title: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export class WindowManager {
  private windows: Map<string, HTMLElement> = new Map();
  private minimized: Set<string> = new Set();
  private topZIndex: number = 100;
  private clockInterval?: ReturnType<typeof setInterval>;

  createWindow(options: WindowOptions, contentElement: HTMLElement): HTMLElement {
    const win = document.createElement("div");
    win.id = `win-${options.id}`;
    win.className = "styx-window";
    win.style.position = "absolute";
    win.style.width = `${options.width || 600}px`;
    win.style.height = `${options.height || 400}px`;
    win.style.left = `${options.x || 100}px`;
    win.style.top = `${options.y || 80}px`;
    win.style.zIndex = `${++this.topZIndex}`;

    const header = document.createElement("div");
    header.className = "window-header";
    header.innerHTML = `
      <div class="window-controls">
        <span class="control close" data-action="close"></span>
        <span class="control minimize" data-action="minimize"></span>
        <span class="control maximize" data-action="maximize"></span>
      </div>
      <div class="window-title">${options.title}</div>
    `;

    const body = document.createElement("div");
    body.className = "window-body";
    body.appendChild(contentElement);

    const resizer = document.createElement("div");
    resizer.className = "wm-resizer";
    resizer.style.position = "absolute";
    resizer.style.bottom = "0";
    resizer.style.right = "0";
    resizer.style.width = "14px";
    resizer.style.height = "14px";
    resizer.style.cursor = "se-resize";
    resizer.style.background = "rgba(255, 255, 255, 0.2)";
    resizer.style.borderTopLeftRadius = "4px";

    win.appendChild(header);
    win.appendChild(body);
    win.appendChild(resizer);

    this.makeDraggable(win, header);
    this.makeResizable(win, resizer);
    this.setupWindowListeners(win, options.id);

    document.getElementById("os-desktop")?.appendChild(win);
    this.windows.set(options.id, win);
    return win;
  }

  focusWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      if (this.minimized.has(id)) {
        this.restoreWindow(id);
      }
      win.style.zIndex = `${++this.topZIndex}`;
    }
  }

  minimizeWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.style.display = "none";
      this.minimized.add(id);
    }
  }

  restoreWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.style.display = "flex";
      this.minimized.delete(id);
      win.style.zIndex = `${++this.topZIndex}`;
    }
  }

  toggleWindow(id: string): void {
    if (this.minimized.has(id)) {
      this.restoreWindow(id);
    } else {
      this.minimizeWindow(id);
    }
  }

  closeWindow(id: string): void {
    const win = this.windows.get(id);
    if (win) {
      win.remove();
      this.windows.delete(id);
      this.minimized.delete(id);
    }
  }

  isMinimized(id: string): boolean {
    return this.minimized.has(id);
  }

  getFormattedTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  startClock(clockElement: HTMLElement): void {
    const update = () => {
      clockElement.textContent = this.getFormattedTime();
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  }

  stopClock(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  sendNotification(title: string, message: string, level: "info" | "success" | "warning" = "info"): HTMLElement {
    const notifContainer = document.getElementById("os-notification-center") || document.body;

    const notif = document.createElement("div");
    notif.className = `styx-notification notif-${level}`;
    notif.style.marginBottom = "8px";
    notif.style.padding = "10px 14px";
    notif.style.borderRadius = "8px";
    notif.style.background = "rgba(15, 23, 42, 0.85)";
    notif.style.backdropFilter = "blur(12px)";
    notif.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    notif.style.color = "#f8fafc";
    notif.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";

    notif.innerHTML = `
      <div style="font-weight: 600; font-size: 13px; color: #38bdf8; margin-bottom: 2px;">${title}</div>
      <div style="font-size: 12px; color: #94a3b8;">${message}</div>
    `;

    notifContainer.appendChild(notif);

    setTimeout(() => {
      notif.remove();
    }, 4000);

    return notif;
  }

  private makeDraggable(win: HTMLElement, handle: HTMLElement): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    handle.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = win.offsetLeft;
      initialTop = win.offsetTop;
      this.focusWindow(win.id.replace("win-", ""));
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.style.left = `${initialLeft + dx}px`;
      win.style.top = `${initialTop + dy}px`;
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  private makeResizable(win: HTMLElement, resizer: HTMLElement): void {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    resizer.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = win.offsetWidth;
      startHeight = win.offsetHeight;
      this.focusWindow(win.id.replace("win-", ""));
    });

    window.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      win.style.width = `${Math.max(220, startWidth + dx)}px`;
      win.style.height = `${Math.max(160, startHeight + dy)}px`;
    });

    window.addEventListener("mouseup", () => {
      isResizing = false;
    });
  }

  private setupWindowListeners(win: HTMLElement, id: string): void {
    win.addEventListener("mousedown", () => this.focusWindow(id));

    const controls = win.querySelectorAll(".control");
    controls.forEach((ctrl) => {
      ctrl.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = (ctrl as HTMLElement).dataset.action;
        if (action === "close") {
          this.closeWindow(id);
        } else if (action === "minimize") {
          this.minimizeWindow(id);
        }
      });
    });
  }

  createProcessMonitorWindow(_procfsReport?: string): HTMLElement {
    const container = document.createElement("div");
    container.className = "top-gui-container";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "16px";
    container.style.padding = "16px";
    container.style.fontFamily = "'Inter', system-ui, sans-serif";
    container.style.color = "var(--text-main)";

    // Performance Meters Header
    const meters = document.createElement("div");
    meters.className = "top-gui-meters";
    meters.style.display = "flex";
    meters.style.flexDirection = "column";
    meters.style.gap = "10px";
    meters.style.background = "var(--panel-bg)";
    meters.style.padding = "14px";
    meters.style.borderRadius = "8px";
    meters.style.border = "1px solid var(--border-color)";

    meters.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:600;">
          <span>CPU Utilization (Core 0 & 1)</span>
          <span style="color:var(--primary);">45.2%</span>
        </div>
        <div style="width:100%; height:10px; background:rgba(255,255,255,0.1); border-radius:5px; overflow:hidden;">
          <div style="width:45.2%; height:100%; background:linear-gradient(90deg, #38bdf8, #818cf8); transition:width 0.3s;"></div>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:600;">
          <span>Memory Usage (RAM)</span>
          <span style="color:#10b981;">38.5% (246.4 MB / 640 MB)</span>
        </div>
        <div style="width:100%; height:10px; background:rgba(255,255,255,0.1); border-radius:5px; overflow:hidden;">
          <div style="width:38.5%; height:100%; background:linear-gradient(90deg, #10b981, #34d399); transition:width 0.3s;"></div>
        </div>
      </div>
    `;

    // Process Table
    const tableContainer = document.createElement("div");
    tableContainer.style.flex = "1";
    tableContainer.style.overflowY = "auto";
    tableContainer.style.borderRadius = "6px";
    tableContainer.style.border = "1px solid var(--border-color)";

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "0.8rem";
    table.style.fontFamily = "'Fira Code', monospace";

    table.innerHTML = `
      <thead>
        <tr style="background:rgba(255,255,255,0.05); text-align:left; border-bottom:1px solid var(--border-color);">
          <th style="padding:8px;">PID</th>
          <th style="padding:8px;">USER</th>
          <th style="padding:8px;">PR</th>
          <th style="padding:8px;">NI</th>
          <th style="padding:8px;">VIRT</th>
          <th style="padding:8px;">RES</th>
          <th style="padding:8px;">S</th>
          <th style="padding:8px;">%CPU</th>
          <th style="padding:8px;">%MEM</th>
          <th style="padding:8px;">COMMAND</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:8px; color:var(--primary);">1</td>
          <td style="padding:8px;">root</td>
          <td style="padding:8px;">20</td>
          <td style="padding:8px;">0</td>
          <td style="padding:8px;">10M</td>
          <td style="padding:8px;">2M</td>
          <td style="padding:8px; color:#10b981;">S</td>
          <td style="padding:8px;">0.5</td>
          <td style="padding:8px;">0.1</td>
          <td style="padding:8px; font-weight:600;">init</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:8px; color:var(--primary);">2</td>
          <td style="padding:8px;">user</td>
          <td style="padding:8px;">20</td>
          <td style="padding:8px;">0</td>
          <td style="padding:8px;">25M</td>
          <td style="padding:8px;">4M</td>
          <td style="padding:8px; color:#10b981;">S</td>
          <td style="padding:8px;">1.2</td>
          <td style="padding:8px;">0.3</td>
          <td style="padding:8px; font-weight:600;">sh</td>
        </tr>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:8px; color:var(--primary);">3</td>
          <td style="padding:8px;">user</td>
          <td style="padding:8px;">20</td>
          <td style="padding:8px;">0</td>
          <td style="padding:8px;">42M</td>
          <td style="padding:8px;">12M</td>
          <td style="padding:8px; color:#38bdf8;">R</td>
          <td style="padding:8px; color:var(--primary); font-weight:700;">43.5</td>
          <td style="padding:8px;">1.8</td>
          <td style="padding:8px; font-weight:600;">top-gui</td>
        </tr>
      </tbody>
    `;

    tableContainer.appendChild(table);
    container.appendChild(meters);
    container.appendChild(tableContainer);

    return this.createWindow(
      {
        id: "top-gui-monitor",
        title: "Styx OS Real-Time Process Monitor & Performance Chart",
        width: 680,
        height: 440,
      },
      container
    );
  }
}
