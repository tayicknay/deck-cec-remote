#!/usr/bin/env python3
"""Print JSON lines for HDMI-CEC remote keys from SteamOS cecd.

Must run as the Deck user session (XDG_RUNTIME_DIR + DBUS_SESSION_BUS_ADDRESS).
Decky's bundled Python often lacks Gio, so this is invoked via /usr/bin/python3.
"""

from __future__ import annotations

import json
import os
import sys

UI = {
    0x00: "select/ok",
    0x01: "up",
    0x02: "down",
    0x03: "left",
    0x04: "right",
    0x05: "right-up",
    0x06: "right-down",
    0x07: "left-up",
    0x08: "left-down",
    0x09: "root-menu",
    0x0A: "setup-menu",
    0x0B: "contents-menu",
    0x0C: "favorite-menu",
    0x0D: "back/exit",
    0x10: "media-top-menu",
    0x11: "media-context-menu",
    0x1D: "number-entry-mode",
    0x1E: "11",
    0x1F: "12",
    0x20: "0",
    0x21: "1",
    0x22: "2",
    0x23: "3",
    0x24: "4",
    0x25: "5",
    0x26: "6",
    0x27: "7",
    0x28: "8",
    0x29: "9",
    0x2A: "dot",
    0x2B: "enter",
    0x2C: "clear",
    0x2F: "next-favorite",
    0x30: "channel-up",
    0x31: "channel-down",
    0x32: "previous-channel",
    0x33: "sound-select",
    0x34: "input-select",
    0x35: "info",
    0x36: "help",
    0x37: "page-up",
    0x38: "page-down",
    0x40: "power",
    0x41: "volume-up",
    0x42: "volume-down",
    0x43: "mute",
    0x44: "play",
    0x45: "stop",
    0x46: "pause",
    0x47: "record",
    0x48: "rewind",
    0x49: "fast-forward",
    0x4A: "eject",
    0x4B: "skip-forward",
    0x4C: "skip-backward",
    0x50: "angle",
    0x51: "subtitles",
    0x52: "vod",
    0x53: "guide/epg",
    0x54: "timer",
    0x55: "config",
    0x58: "audio-description",
    0x59: "internet",
    0x5A: "3d-mode",
    0x6B: "power-toggle",
    0x6C: "power-off",
    0x6D: "power-on",
    0x71: "blue/F1",
    0x72: "red/F2",
    0x73: "green/F3",
    0x74: "yellow/F4",
    0x75: "F5",
    0x76: "data",
}


def _emit(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def _press_code(vals: list) -> int:
    raw = vals[0] if vals else 0
    if isinstance(raw, (bytes, bytearray, list, tuple)):
        return int(raw[0]) if raw else -1
    return int(raw)


def main() -> int:
    uid = os.getuid()
    os.environ.setdefault("XDG_RUNTIME_DIR", f"/run/user/{uid}")
    os.environ.setdefault("DBUS_SESSION_BUS_ADDRESS", f"unix:path=/run/user/{uid}/bus")

    import gi

    gi.require_version("Gio", "2.0")
    from gi.repository import Gio, GLib

    def on_signal(_conn, _sender, _path, _iface, signal, params):
        vals = list(params.unpack())
        if signal != "UserControlPressed":
            return
        code = _press_code(vals)
        _emit(
            {
                "type": "press",
                "code": code,
                "name": UI.get(code, f"unknown-0x{code:02X}"),
            }
        )

    try:
        bus = Gio.bus_get_sync(Gio.BusType.SESSION, None)
    except Exception as e:
        _emit({"type": "error", "error": str(e)})
        return 1

    bus.signal_subscribe(
        "com.steampowered.CecDaemon1",
        "com.steampowered.CecDaemon1.CecDevice1",
        None,
        None,
        None,
        Gio.DBusSignalFlags.NONE,
        on_signal,
    )
    _emit({"type": "ready"})
    GLib.MainLoop().run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
