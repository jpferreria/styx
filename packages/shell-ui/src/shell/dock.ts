/**
 * @file dock.ts
 * @module StyxOS/ShellHost/DockManager
 * @description Desktop Application Launcher Dock & Start Menu GUI widget.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface DockApp {
  id: string;
  title: string;
  icon: string;
  command: string;
}

export class DockManager {
  private apps: DockApp[] = [
    { id: "terminal", title: "Terminal Shell", icon: "🐚", command: "clear" },
    { id: "vim", title: "Vim Editor", icon: "📝", command: "vim" },
    { id: "nano", title: "Nano Editor", icon: "📄", command: "nano" },
    { id: "top-gui", title: "Process Monitor", icon: "📊", command: "top-gui" },
    { id: "sysbench", title: "System Profiler", icon: "⚡", command: "sysbench" },
    { id: "theme", title: "Desktop Themes", icon: "🎨", command: "theme" },
  ];

  getRegisteredApps(): DockApp[] {
    return [...this.apps];
  }

  createDockElement(onLaunchApp: (app: DockApp) => void): HTMLElement {
    const dock = document.createElement("div");
    dock.id = "styx-desktop-dock";
    dock.className = "styx-dock";
    dock.style.position = "fixed";
    dock.style.bottom = "12px";
    dock.style.left = "50%";
    dock.style.transform = "translateX(-50%)";
    dock.style.display = "flex";
    dock.style.alignItems = "center";
    dock.style.gap = "12px";
    dock.style.padding = "8px 16px";
    dock.style.background = "rgba(15, 23, 42, 0.75)";
    dock.style.backdropFilter = "blur(12px)";
    (dock.style as any).webkitBackdropFilter = "blur(12px)";
    dock.style.borderRadius = "16px";
    dock.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    dock.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.4)";
    dock.style.zIndex = "9999";

    for (const app of this.apps) {
      const btn = document.createElement("button");
      btn.className = "dock-item";
      btn.title = app.title;
      btn.dataset.appid = app.id;
      btn.style.background = "transparent";
      btn.style.border = "none";
      btn.style.fontSize = "1.5rem";
      btn.style.cursor = "pointer";
      btn.style.padding = "6px";
      btn.style.borderRadius = "10px";
      btn.style.transition = "transform 0.2s ease, background 0.2s ease";
      btn.textContent = app.icon;

      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "scale(1.25) translateY(-4px)";
        btn.style.background = "rgba(255, 255, 255, 0.15)";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "scale(1) translateY(0)";
        btn.style.background = "transparent";
      });

      btn.addEventListener("click", () => {
        onLaunchApp(app);
      });

      dock.appendChild(btn);
    }

    return dock;
  }
}
