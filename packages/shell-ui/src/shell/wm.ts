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

  createProcessMonitorWindow(procfsReport: string): HTMLElement {
    const container = document.createElement("div");
    container.className = "top-gui-container";
    container.style.fontFamily = "monospace";
    container.style.fontSize = "0.85rem";
    container.style.color = "var(--text-main)";
    container.style.whiteSpace = "pre-wrap";
    container.textContent = procfsReport;

    return this.createWindow(
      {
        id: "top-gui-monitor",
        title: "Styx OS Real-Time Process Monitor & Performance Chart",
        width: 640,
        height: 420,
      },
      container
    );
  }
}
