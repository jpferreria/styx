#!/usr/bin/env bash
#
# stop.sh - Stop Styx OS Local Development Server
#
# Copyright (C) 2026 Styx OS Project Authors
# Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.dev-server.pid"

echo "🛑 Stopping Styx OS Server..."

STOPPED=0

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID" 2>/dev/null
        echo "Stopped server process (PID: $PID)"
        STOPPED=1
    fi
    rm -f "$PID_FILE"
fi

# Kill any remaining vite processes matching our workspace
VITE_PIDS=$(pgrep -f "vite")
if [ -n "$VITE_PIDS" ]; then
    for p in $VITE_PIDS; do
        kill "$p" 2>/dev/null
        echo "Killed active Vite process (PID: $p)"
        STOPPED=1
    done
fi

if [ $STOPPED -eq 1 ]; then
    echo "✅ Styx OS server stopped successfully."
else
    echo "ℹ️  No running Styx OS server was found."
fi
