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


# Compiled-in cecd defaults (linux-cec), with number keys matching the live
# SteamOS "cecd DP-1" keyboard (KEY_1..KEY_0), not KEY_NUMERIC_*.
# names = cecd TOML keys; codes = HDMI-CEC User Control codes.
FACTORY_UINPUT: list[tuple[int, tuple[str, ...], tuple[int, ...]]] = [
    (28, ("select", "ok"), (0x00,)),
    (103, ("up",), (0x01,)),
    (108, ("down",), (0x02,)),
    (105, ("left",), (0x03,)),
    (106, ("right",), (0x04,)),
    (614, ("right-up",), (0x05,)),
    (615, ("right-down",), (0x06,)),
    (616, ("left-up",), (0x07,)),
    (617, ("left-down",), (0x08,)),
    (618, ("device-root-menu",), (0x09,)),
    (141, ("device-setup-menu",), (0x0A,)),
    (139, ("contents-menu",), (0x0B,)),
    (364, ("favorite-menu",), (0x0C,)),
    (1, ("back", "exit"), (0x0D,)),
    (619, ("media-top-menu",), (0x10,)),
    (438, ("media-context-sensitive-menu",), (0x11,)),
    (413, ("number-entry-mode",), (0x1D,)),
    (620, ("11",), (0x1E,)),
    (621, ("12",), (0x1F,)),
    (11, ("0", "10"), (0x20,)),
    (2, ("1",), (0x21,)),
    (3, ("2",), (0x22,)),
    (4, ("3",), (0x23,)),
    (5, ("4",), (0x24,)),
    (6, ("5",), (0x25,)),
    (7, ("6",), (0x26,)),
    (8, ("7",), (0x27,)),
    (9, ("8",), (0x28,)),
    (10, ("9",), (0x29,)),
    (52, ("dot",), (0x2A,)),
    (28, ("enter",), (0x2B,)),
    (355, ("clear",), (0x2C,)),
    (624, ("next-favorite",), (0x2F,)),
    (402, ("channel-up",), (0x30,)),
    (403, ("channel-down",), (0x31,)),
    (412, ("previous-channel",), (0x32,)),
    (213, ("sound-select",), (0x33,)),
    (358, ("display-information",), (0x35,)),
    (138, ("help",), (0x36,)),
    (104, ("page-up",), (0x37,)),
    (109, ("page-down",), (0x38,)),
    (116, ("power",), (0x40,)),
    (115, ("volume-up",), (0x41,)),
    (114, ("volume-down",), (0x42,)),
    (113, ("mute",), (0x43,)),
    (200, ("play",), (0x44,)),
    (166, ("stop",), (0x45,)),
    (201, ("pause",), (0x46,)),
    (167, ("record",), (0x47,)),
    (168, ("rewind",), (0x48,)),
    (208, ("fast-forward",), (0x49,)),
    (161, ("eject",), (0x4A,)),
    (163, ("skip-forward",), (0x4B,)),
    (165, ("skip-backward",), (0x4C,)),
    (625, ("stop-record",), (0x4D,)),
    (626, ("pause-record",), (0x4E,)),
    (371, ("angle",), (0x50,)),
    (627, ("video-on-demand",), (0x52,)),
    (365, ("electronic-program-guide",), (0x53,)),
    (359, ("timer-programming",), (0x54,)),
    (171, ("initial-configuration",), (0x55,)),
    (622, ("audio-description",), (0x58,)),
    (150, ("internet",), (0x59,)),
    (623, ("3d-mode",), (0x5A,)),
    (628, ("restore-volume-function",), (0x66,)),
    (116, ("power-toggle-function",), (0x6B,)),
    (142, ("power-off-function",), (0x6C,)),
    (143, ("power-on-function",), (0x6D,)),
    (401, ("blue", "f1"), (0x71,)),
    (398, ("red", "f2"), (0x72,)),
    (399, ("green", "f3"), (0x73,)),
    (400, ("yellow", "f4"), (0x74,)),
    (63, ("f5",), (0x75,)),
    (631, ("data",), (0x76,)),
]

# Only these may be removed from the cecd keyboard. D-pad / OK / Back / transport
# always stay in the factory table, even if someone later maps something else.
NUMBER_CODES = frozenset({0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29})
COLOR_CODES = frozenset({0x71, 0x72, 0x73, 0x74})
WIPEABLE_CODES = NUMBER_CODES | COLOR_CODES

FRAGMENT_NAME = "80-deck-cec-remote.toml"


def uinput_stolen(mappings: list[dict[str, Any]] | None = None) -> set[int]:
    items = mappings if mappings is not None else load_mappings()
    stolen: set[int] = set()
    for item in items:
        try:
            code = int(item["code"])
        except (KeyError, TypeError, ValueError):
            continue
        if code in WIPEABLE_CODES:
            stolen.add(code)
    return stolen


def _deck_home() -> str:
    home = os.environ.get("DECKY_USER_HOME") or ""
    if home:
        return home
    uid = _deck_uid()
    if uid is not None:
        try:
            return pwd.getpwuid(uid).pw_dir
        except KeyError:
            pass
    if os.path.isdir("/home/deck"):
        return "/home/deck"
    return os.path.expanduser("~")


def cecd_fragment_path() -> str:
    return os.path.join(_deck_home(), ".config", "cecd", "config.d", FRAGMENT_NAME)


def render_cecd_mappings(stolen: set[int]) -> str:
    lines = [
        "# Written by deck-cec-remote. Do not edit SteamOS 00-/99- files.",
        "# Full mappings table (cecd replaces compiled defaults if present).",
        "# Only mapped number and color keys are omitted. Everything else stays.",
        "# Delete this file to restore defaults.",
        "mappings = {",
    ]
    for keycode, names, codes in FACTORY_UINPUT:
        if any(code in stolen for code in codes):
            continue
        for name in names:
            lines.append(f'  "{name}" = {keycode}')
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def write_cecd_fragment(mappings: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Write or remove our cecd fragment. Never touches SteamOS manager files."""
    items = mappings if mappings is not None else load_mappings()
    stolen = uinput_stolen(items)
    path = cecd_fragment_path()
    parent = os.path.dirname(path)
    if not stolen:
        if os.path.exists(path):
            os.remove(path)
        return {"ok": True, "path": path, "removed": True, "stolen": []}
    os.makedirs(parent, exist_ok=True)
    body = render_cecd_mappings(stolen)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(body)
    os.replace(tmp, path)
    try:
        uid = _deck_uid()
        if uid is not None:
            os.chown(path, uid, pwd.getpwuid(uid).pw_gid)
    except (KeyError, OSError, PermissionError):
        pass
    return {"ok": True, "path": path, "removed": False, "stolen": sorted(stolen)}


def restore_cecd_defaults() -> dict[str, Any]:
    path = cecd_fragment_path()
    if os.path.exists(path):
        os.remove(path)
    return {"ok": True, "path": path, "removed": True}


def reload_cecd() -> dict[str, Any]:
    import subprocess

    env = session_env()
    try:
        proc = subprocess.run(
            [
                "busctl",
                "--user",
                "call",
                "com.steampowered.CecDaemon1",
                "/com/steampowered/CecDaemon1/Daemon",
                "com.steampowered.CecDaemon1.Config1",
                "Reload",
            ],
            env=env,
            capture_output=True,
            text=True,
            timeout=4,
        )
        if proc.returncode == 0:
            return {"ok": True, "error": ""}
        return {
            "ok": False,
            "error": (proc.stderr or proc.stdout or f"busctl exit {proc.returncode}").strip(),
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


def sync_cecd_uinput(mappings: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    written = write_cecd_fragment(mappings)
    reloaded = reload_cecd()
    return {**written, "reloaded": reloaded.get("ok"), "reload_error": reloaded.get("error", "")}
