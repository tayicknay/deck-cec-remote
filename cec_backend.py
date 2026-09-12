#!/usr/bin/env python3
"""CEC mapping store, reserved keys, and Deck-user DBus environment."""

from __future__ import annotations

import json
import os
import pwd
import re
from typing import Any

# Steam Gamepad UI already consumes these via cecd's default uinput map.
RESERVED: dict[int, str] = {
    0x00: "select/ok",
    0x01: "up",
    0x02: "down",
    0x03: "left",
    0x04: "right",
    0x0D: "back/exit",
    0x44: "play",
    0x45: "stop",
    0x46: "pause",
    0x48: "rewind",
    0x49: "fast-forward",
    0x4B: "skip-forward",
    0x4C: "skip-backward",
}

ACTIONS = ("qam", "steam_menu", "library", "downloads")

_STEAM_UID = re.compile(r"/run/user/(\d+)")


def _deck_uid() -> int | None:
    home = os.environ.get("DECKY_USER_HOME") or ""
    user = os.environ.get("DECKY_USER") or ""
    if not user and home.startswith("/home/"):
        user = os.path.basename(home.rstrip("/"))
    if user:
        try:
            return pwd.getpwnam(user).pw_uid
        except KeyError:
            pass
    for uid in (1000, 1001):
        if os.path.isdir(f"/run/user/{uid}"):
            return uid
    runtime = os.environ.get("XDG_RUNTIME_DIR", "")
    m = _STEAM_UID.match(runtime)
    if m:
        return int(m.group(1))
    return None


def session_env() -> dict[str, str]:
    """Talk to the Deck user's session bus where cecd lives."""
    env = {k: v for k, v in os.environ.items() if k != "LD_LIBRARY_PATH"}
    uid = _deck_uid()
    if uid is not None:
        runtime = f"/run/user/{uid}"
        env["XDG_RUNTIME_DIR"] = runtime
        env["DBUS_SESSION_BUS_ADDRESS"] = f"unix:path={runtime}/bus"
    return env


def session_debug() -> dict[str, Any]:
    uid = _deck_uid()
    env = session_env()
    runtime = env.get("XDG_RUNTIME_DIR", "")
    bus = f"{runtime}/bus" if runtime else ""
    return {
        "uid": uid,
        "runtime": runtime,
        "bus": bus,
        "bus_exists": bool(bus and os.path.exists(bus)),
        "python": "/usr/bin/python3",
        "python_exists": os.path.exists("/usr/bin/python3"),
    }


def settings_path() -> str:
    root = os.environ.get("DECKY_PLUGIN_SETTINGS_DIR") or "/tmp/cec-remote"
    os.makedirs(root, exist_ok=True)
    return os.path.join(root, "mappings.json")


def load_mappings() -> list[dict[str, Any]]:
    path = settings_path()
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        return []
    raw = data.get("mappings") if isinstance(data, dict) else data
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        try:
            code = int(item["code"])
        except (KeyError, TypeError, ValueError):
            continue
        action = str(item.get("action") or "")
        if action not in ACTIONS:
            continue
        if code in RESERVED:
            continue
        out.append(
            {
                "code": code,
                "name": str(item.get("name") or f"0x{code:02X}"),
                "action": action,
            }
        )
    return out


def save_mappings(mappings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    path = settings_path()
    normalized: list[dict[str, Any]] = []
    seen: set[int] = set()
    for item in mappings:
        if not isinstance(item, dict):
            continue
        try:
            code = int(item["code"])
        except (KeyError, TypeError, ValueError):
            continue
        if code in seen or code in RESERVED:
            continue
        action = str(item.get("action") or "")
        if action not in ACTIONS:
            continue
        seen.add(code)
        normalized.append(
            {
                "code": code,
                "name": str(item.get("name") or f"0x{code:02X}"),
                "action": action,
            }
        )
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump({"mappings": normalized}, f, indent=2)
        f.write("\n")
    os.replace(tmp, path)
    return normalized


def action_for_code(code: int, mappings: list[dict[str, Any]] | None = None) -> str:
    if code in RESERVED:
        return ""
    for item in mappings if mappings is not None else load_mappings():
        if int(item["code"]) == code:
            return str(item["action"])
    return ""
