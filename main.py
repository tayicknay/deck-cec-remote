import asyncio
import json
import os
import sys
import time

_here = os.path.dirname(os.path.realpath(__file__))
if _here not in sys.path:
    sys.path.insert(0, _here)

import decky

_decky_dir = getattr(decky, "DECKY_PLUGIN_DIR", None) or os.environ.get("DECKY_PLUGIN_DIR")
if _decky_dir and _decky_dir not in sys.path:
    sys.path.insert(0, _decky_dir)

from cec_backend import (
    ACTIONS,
    RESERVED,
    action_for_code,
    cecd_fragment_path,
    load_mappings,
    restore_cecd_defaults,
    save_mappings,
    session_debug,
    session_env,
    sync_cecd_uinput,
)

_DEBOUNCE_S = 0.35


class Plugin:
    _watch_task: asyncio.Task | None = None
    _stop: asyncio.Event | None = None
    _recording = False
    _watch_ready = False
    _watch_error = ""
    _last_code: int | None = None
    _last_ts = 0.0
    _pending: dict | None = None

    def _state(self):
        return {
            "ok": True,
            "watch_ready": self._watch_ready,
            "watch_error": self._watch_error,
            "recording": self._recording,
            "pending": self._pending,
            "mappings": load_mappings(),
            "reserved": [{"code": code, "name": name} for code, name in RESERVED.items()],
            "actions": list(ACTIONS),
            "cecd_override": os.path.exists(cecd_fragment_path()),
            "debug": session_debug(),
        }

    def _sync_uinput(self) -> None:
        try:
            result = sync_cecd_uinput(load_mappings())
            if not result.get("reloaded"):
                decky.logger.warning("cecd reload: %s", result.get("reload_error"))
        except Exception as e:
            decky.logger.error("sync cecd uinput: %s", e)

    async def ping(self):
        return {"ok": True, "debug": session_debug(), "watch_ready": self._watch_ready}

    async def get_state(self):
        return self._state()

    async def start_record(self):
        self._recording = True
        self._pending = None
        return self._state()

    async def cancel_record(self):
        self._recording = False
        self._pending = None
        return self._state()

    async def save_mapping(self, code: int, name: str, action: str):
        try:
            code_i = int(code)
        except (TypeError, ValueError):
            return {**self._state(), "ok": False, "error": "invalid code"}
        if code_i in RESERVED:
            return {**self._state(), "ok": False, "error": "button is reserved for Steam"}
        if action not in ACTIONS:
            return {**self._state(), "ok": False, "error": "unknown action"}
        mappings = [m for m in load_mappings() if int(m["code"]) != code_i]
        mappings.append({"code": code_i, "name": name or f"0x{code_i:02X}", "action": action})
        save_mappings(mappings)
        self._recording = False
        self._pending = None
        await asyncio.get_running_loop().run_in_executor(None, self._sync_uinput)
        return self._state()

    async def delete_mapping(self, code: int):
        try:
            code_i = int(code)
        except (TypeError, ValueError):
            return {**self._state(), "ok": False, "error": "invalid code"}
        save_mappings([m for m in load_mappings() if int(m["code"]) != code_i])
        await asyncio.get_running_loop().run_in_executor(None, self._sync_uinput)
        return self._state()

    async def reset_all(self):
        self._recording = False
        self._pending = None
        save_mappings([])

        def _restore():
            restore_cecd_defaults()
            return sync_cecd_uinput([])

        try:
            await asyncio.get_running_loop().run_in_executor(None, _restore)
        except Exception as e:
            return {**self._state(), "ok": False, "error": str(e)}
        return self._state()

    async def _handle_press(self, code: int, name: str):
        now = time.monotonic()
        if self._last_code == code and (now - self._last_ts) < _DEBOUNCE_S:
            return
        self._last_code = code
        self._last_ts = now

        reserved = code in RESERVED
        if self._recording:
            if reserved:
                await decky.emit(
                    "cec_recorded",
                    {"ok": False, "reserved": True, "code": code, "name": name},
                )
                return
            self._recording = False
            self._pending = {"code": code, "name": name, "action": "qam"}
            await decky.emit(
                "cec_recorded",
                {"ok": True, "reserved": False, "code": code, "name": name},
            )
            return

        action = action_for_code(code)
        if action:
            await decky.emit("cec_action", action)

    async def _watch_loop(self):
        assert self._stop is not None
        watch = os.path.join(_here, "cec_watch.py")
        python = "/usr/bin/python3"
        env = session_env()

        while not self._stop.is_set():
            proc = None
            self._watch_ready = False
            try:
                if not os.path.exists(python):
                    self._watch_error = "missing /usr/bin/python3"
                    decky.logger.error(self._watch_error)
                    await asyncio.wait_for(self._stop.wait(), timeout=10.0)
                    continue
                if not os.path.exists(watch):
                    self._watch_error = f"missing {watch}"
                    decky.logger.error(self._watch_error)
                    await asyncio.wait_for(self._stop.wait(), timeout=10.0)
                    continue

                proc = await asyncio.create_subprocess_exec(
                    python,
                    watch,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=env,
                )
                decky.logger.info("cec_watch started pid=%s", proc.pid)
                assert proc.stdout is not None
                while not self._stop.is_set():
                    try:
                        line_b = await asyncio.wait_for(proc.stdout.readline(), timeout=1.0)
                    except asyncio.TimeoutError:
                        if proc.returncode is not None:
                            break
                        continue
                    if not line_b:
                        break
                    line = line_b.decode("utf-8", errors="replace").strip()
                    if not line:
                        continue
                    try:
                        msg = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    kind = msg.get("type")
                    if kind == "ready":
                        self._watch_ready = True
                        self._watch_error = ""
                        continue
                    if kind == "error":
                        self._watch_error = str(msg.get("error") or "cec watch error")
                        continue
                    if kind == "press":
                        try:
                            code = int(msg.get("code"))
                        except (TypeError, ValueError):
                            continue
                        name = str(msg.get("name") or f"0x{code:02X}")
                        try:
                            await self._handle_press(code, name)
                        except Exception as e:
                            decky.logger.error("handle press: %s", e)

                err = ""
                if proc.stderr is not None:
                    try:
                        err_b = await asyncio.wait_for(proc.stderr.read(), timeout=0.2)
                        err = err_b.decode("utf-8", errors="replace").strip()
                    except Exception:
                        pass
                if proc.returncode not in (None, 0):
                    self._watch_ready = False
                    self._watch_error = err or f"cec_watch exited {proc.returncode}"
                    decky.logger.error(self._watch_error)
                if proc.returncode is None:
                    proc.terminate()
                    try:
                        await asyncio.wait_for(proc.wait(), timeout=2)
                    except asyncio.TimeoutError:
                        proc.kill()
            except asyncio.CancelledError:
                if proc and proc.returncode is None:
                    proc.kill()
                raise
            except Exception as e:
                self._watch_ready = False
                self._watch_error = str(e)
                decky.logger.error("cec_watch error: %s", e)
                if proc and proc.returncode is None:
                    try:
                        proc.kill()
                    except Exception:
                        pass
            if not self._stop.is_set():
                try:
                    await asyncio.wait_for(self._stop.wait(), timeout=3.0)
                except asyncio.TimeoutError:
                    pass

    async def _main(self):
        decky.logger.info("CEC Remote loaded debug=%s", session_debug())
        self._stop = asyncio.Event()
        self._watch_task = asyncio.create_task(self._watch_loop())

    async def _unload(self):
        decky.logger.info("CEC Remote unloaded")
        if self._stop:
            self._stop.set()
        if self._watch_task:
            self._watch_task.cancel()
            try:
                await self._watch_task
            except asyncio.CancelledError:
                pass
            self._watch_task = None
