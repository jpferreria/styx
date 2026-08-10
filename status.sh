#!/usr/bin/env bash
#
# status.sh - Check Styx OS Server and System Status
#
# Copyright (C) 2026 Styx OS Project Authors
# Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.dev-server.pid"
LOG_FILE="$SCRIPT_DIR/dev-server.log"

echo "=== Styx OS v0.20 'Rivendell' System Status ==="

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Status:    RUNNING (PID: $PID)"
        echo "Local URL: http://localhost:5173/"
        echo "Log File:  $LOG_FILE"
        echo ""
        echo "Recent Log Tail:"
        tail -n 5 "$LOG_FILE"
        exit 0
    else
        echo "Status:    STOPPED (stale PID file removed)"
        rm -f "$PID_FILE"
        exit 1
    fi
else
    # Fallback check if vite is running on 5173
    VITE_PID=$(pgrep -f "vite")
    if [ -n "$VITE_PID" ]; then
        echo "Status:    RUNNING (Vite PID: $VITE_PID)"
        echo "Local URL: http://localhost:5173/"
        exit 0
    else
        echo "Status:    STOPPED (No server process found)"
        exit 1
    fi
fi
