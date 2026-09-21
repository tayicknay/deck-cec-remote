import {
  ButtonItem,
  ModalRoot,
  Navigation,
  PanelSection,
  PanelSectionRow,
  ToggleField,
  getGamepadNavigationTrees,
  showModal,
  staticClasses,
  type ShowModalResult,
} from "@decky/ui";
import {
  addEventListener,
  callable,
  definePlugin,
  removeEventListener,
} from "@decky/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaTv } from "react-icons/fa";

type Mapping = {
  code: number;
  name: string;
  action: string;
  appid?: number;
  app_name?: string;
};

type Pending = {
  code: number;
  name: string;
  action?: string;
};

type PluginState = {
  ok: boolean;
  watch_ready: boolean;
  watch_error: string;
  recording: boolean;
  pending?: Pending | null;
  mappings: Mapping[];
  override_steam_buttons?: boolean;
  reserved: { code: number; name: string }[];
  actions: string[];
  cecd_override?: boolean;
  cec?: CecStatus;
  error?: string;
};

type CecStatus = {
  adapter: boolean;
  device: string;
  phys_addr: string;
  hdmi_link: boolean;
  cecd: boolean;
  osd_name: string;
};

type Recorded = {
  ok: boolean;
  reserved: boolean;
  code: number;
  name: string;
};

type ActionPayload = {
  action: string;
  appid?: number;
  app_name?: string;
};

type LibApp = {
  appid: number;
  name: string;
  lastPlayed: number;
};

const ACTION_LABELS: Record<string, string> = {
  qam: "Quick Access Menu",
  steam_menu: "Steam Menu",
  library: "Library",
  downloads: "Downloads",
  settings: "Settings",
  power: "Power",
  friends: "Friends",
  chat: "Chat",
  screenshot: "Screenshot",
  keyboard: "Keyboard",
  controller: "Controller Settings",
  cheat_sheet: "Cheat Sheet",
  launch: "Launch …",
};

/** USB HID F12 — Steam's default screenshot key. */
const HID_F12 = 69;

const getState = callable<[], PluginState>("get_state");
const startRecord = callable<[], PluginState>("start_record");
const cancelRecord = callable<[], PluginState>("cancel_record");
const saveMapping = callable<
  [code: number, name: string, action: string, appid?: number, app_name?: string],
  PluginState
>("save_mapping");
const deleteMapping = callable<[code: number], PluginState>("delete_mapping");
const setOverrideSteamButtons = callable<[enabled: boolean], PluginState>(
  "set_override_steam_buttons"
);
const resetAll = callable<[], PluginState>("reset_all");

function navTreeVisible(match: (id: string) => boolean): boolean {
  try {
    const trees = getGamepadNavigationTrees() || [];
    return trees.some((tree: { id?: string; m_ID?: string; m_Root?: any; Root?: any }) => {
      const id = String(tree?.id || tree?.m_ID || "");
      if (!match(id)) return false;
      const win =
        tree?.m_Root?.m_element?.ownerDocument?.defaultView ||
        tree?.Root?.Element?.ownerDocument?.defaultView;
      if (!win) return true;
      return !win.document.hidden;
    });
  } catch {
    return false;
  }
}

function isQamOpen(): boolean {
  return navTreeVisible((id) => id === "QuickAccess-NA" || id.toLowerCase().includes("quickaccess"));
}

function isSteamMenuOpen(): boolean {
  if (isQamOpen()) return false;
  return navTreeVisible((id) => {
    const lower = id.toLowerCase();
    if (lower.includes("quickaccess")) return false;
    return lower.includes("mainmenu") || lower.includes("mainnav") || lower === "menu-na";
  });
}

let cheatSheetModal: ShowModalResult | null = null;

function closeCheatSheet(): void {
  try {
    cheatSheetModal?.Close();
  } catch {
    /* ignore */
  }
  cheatSheetModal = null;
}

async function toggleCheatSheet(): Promise<void> {
  if (cheatSheetModal) {
    closeCheatSheet();
    return;
  }
  let mappings: Mapping[] = [];
  try {
    mappings = (await getState()).mappings || [];
  } catch {
    /* still show an empty sheet */
  }
  Navigation.CloseSideMenus();
  cheatSheetModal = showModal(
    <ModalRoot closeModal={closeCheatSheet} bAllowFullSize={false}>
      <div style={{ padding: "8px 12px 16px", minWidth: "280px" }}>
        <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>CEC mappings</div>
        <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "14px" }}>
          Mapped buttons only. Press the cheat-sheet key again to close.
        </div>
        {mappings.length === 0 ? (
          <div style={{ fontSize: "14px", opacity: 0.75 }}>No custom mappings yet</div>
        ) : (
          mappings.map((m) => (
            <div
              key={m.code}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                fontSize: "15px",
                lineHeight: 1.45,
                padding: "6px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontWeight: 600 }}>{m.name}</span>
              <span style={{ opacity: 0.85, textAlign: "right" }}>{actionLabel(m)}</span>
            </div>
          ))
        )}
      </div>
    </ModalRoot>
  );
}

function steamClient(): any {
  return (window as any).SteamClient;
}

function focusedWindow(): any {
  const store = (window as any).SteamUIStore;
  try {
    return store?.GetFocusedWindowInstance?.();
  } catch {
    return store?.WindowStore?.GamepadUIMainWindowInstance;
  }
}

function takeScreenshot(): void {
  const sc = steamClient();
  const shots = sc?.Screenshots;
  if (typeof shots?.TriggerScreenshot === "function") {
    shots.TriggerScreenshot();
    return;
  }
  if (typeof shots?.TakeScreenshot === "function") {
    shots.TakeScreenshot();
    return;
  }
  try {
    sc?.URL?.ExecuteSteamURL?.("steam://screenshot");
  } catch {
    /* ignore */
  }
  try {
    sc?.Input?.ControllerKeyboardSetKeyState?.(HID_F12, true);
    sc?.Input?.ControllerKeyboardSetKeyState?.(HID_F12, false);
  } catch {
    /* ignore */
  }
}

function showKeyboard(): void {
  const vk = focusedWindow()?.VirtualKeyboardManager;
  if (vk) {
    if (typeof vk.SetVirtualKeyboardVisible === "function") {
      vk.SetVirtualKeyboardVisible(true);
      return;
    }
    if (typeof vk.ShowVirtualKeyboard === "function") {
      vk.ShowVirtualKeyboard();
      return;
    }
    if (typeof vk.SetVirtualKeyboardHidden === "function") {
      vk.SetVirtualKeyboardHidden(false);
      return;
    }
  }
  try {
    steamClient()?.URL?.ExecuteSteamURL?.("steam://open/keyboard");
  } catch {
    /* ignore */
  }
}

function runAction(payload: ActionPayload | string): void {
  const action = typeof payload === "string" ? payload : payload.action;
  const appid = typeof payload === "string" ? undefined : payload.appid;
  switch (action) {
    case "qam":
      if (isQamOpen()) Navigation.CloseSideMenus();
      else Navigation.OpenQuickAccessMenu();
      break;
    case "steam_menu":
      if (isSteamMenuOpen()) Navigation.CloseSideMenus();
      else Navigation.OpenMainMenu();
      break;
    case "library":
      Navigation.CloseSideMenus();
      Navigation.NavigateToLibraryTab();
      break;
    case "downloads":
      Navigation.CloseSideMenus();
      Navigation.Navigate("/library/downloads");
      break;
    case "settings":
      Navigation.CloseSideMenus();
      Navigation.Navigate("/settings");
      break;
    case "power":
      Navigation.CloseSideMenus();
      Navigation.OpenPowerMenu();
      break;
    case "friends":
      Navigation.CloseSideMenus();
      Navigation.Navigate("/friends");
      break;
    case "chat":
      Navigation.CloseSideMenus();
      Navigation.NavigateToChat();
      break;
    case "screenshot":
      Navigation.CloseSideMenus();
      window.setTimeout(() => takeScreenshot(), 200);
      break;
    case "keyboard":
      showKeyboard();
      break;
    case "controller":
      Navigation.CloseSideMenus();
      try {
        steamClient()?.Input?.ShowControllerSettings?.();
      } catch {
        Navigation.Navigate("/settings/controller");
      }
      break;
    case "cheat_sheet":
      void toggleCheatSheet();
      break;
    case "launch":
      if (appid == null) break;
      Navigation.CloseSideMenus();
      try {
        steamClient()?.Apps?.RunGame(String(appid), "", -1, 200);
      } catch {
        /* ignore */
      }
      break;
    default:
      break;
  }
}

function actionLabel(mapping: Mapping | string): string {
  if (typeof mapping === "string") return ACTION_LABELS[mapping] || mapping;
  if (mapping.action === "launch") {
    return mapping.app_name ? `Launch ${mapping.app_name}` : "Launch …";
  }
  return ACTION_LABELS[mapping.action] || mapping.action;
}

function collectApps(src: unknown, out: Map<number, LibApp>): void {
  if (!src) return;
  let list: any[] = [];
  if (Array.isArray(src)) list = src;
  else {
    try {
      if (typeof (src as any).values === "function") list = Array.from((src as any).values());
      else if (typeof (src as any)[Symbol.iterator] === "function") list = Array.from(src as any);
    } catch {
      list = [];
    }
  }
  for (const app of list) {
    if (!app) continue;
    const appid = Number(app.appid);
    const name = String(app.display_name || app.displayName || app.sort_as || "").trim();
    if (!appid || !name) continue;
    if (app.visible_in_game_list === false) continue;
    const lastPlayed = Number(app.rt_last_time_played || app.rt_last_time_locally_played || 0) || 0;
    const prev = out.get(appid);
    if (!prev || lastPlayed > prev.lastPlayed) out.set(appid, { appid, name, lastPlayed });
  }
}

function listLibraryApps(): LibApp[] {
  const out = new Map<number, LibApp>();
  const cs = (window as any).collectionStore;
  if (cs) {
    for (const col of [
      cs.allGamesCollection,
      cs.allAppsCollection,
      cs.localGamesCollection,
      cs.deckDesktopApps,
    ]) {
      collectApps(col?.allApps, out);
      collectApps(col?.apps, out);
    }
    const map = cs.appTypeCollectionMap;
    if (map && typeof map.values === "function") {
      try {
        for (const col of map.values()) {
          collectApps(col?.allApps, out);
          collectApps(col?.apps, out);
        }
      } catch {
        /* ignore */
      }
    }
  }
  return [...out.values()].sort((a, b) => {
    if (a.lastPlayed !== b.lastPlayed) return b.lastPlayed - a.lastPlayed;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function pendingFromState(next: PluginState): Pending | null {
  const p = next.pending;
  if (p && typeof p.code === "number") {
    return {
      code: p.code,
      name: p.name || `0x${p.code.toString(16)}`,
      action: p.action,
    };
  }
  return null;
}

function ErrorRows({ error }: { error: string }) {
  if (!error) return null;
  return (
    <PanelSectionRow>
      <div style={{ color: "#f88", fontSize: "12px", lineHeight: 1.35 }}>{error}</div>
    </PanelSectionRow>
  );
}

function yn(ok: boolean): string {
  return ok ? "yes" : "no";
}

function CecDebug({ state }: { state: PluginState | null }) {
  const cec = state?.cec;
  const listening = Boolean(state?.watch_ready);
  let hdmi = "unknown";
  if (!cec?.adapter) hdmi = "no adapter";
  else if (cec.hdmi_link) hdmi = `connected (${cec.phys_addr || "?"})`;
  else if (cec.phys_addr) hdmi = `no link (${cec.phys_addr})`;
  else hdmi = "adapter, no phys addr";
  const line = [
    `HDMI ${hdmi}`,
    `cecd ${yn(Boolean(cec?.cecd))}`,
    `listener ${listening ? "yes" : "no"}`,
  ].join("  ·  ");
  return (
    <PanelSectionRow>
      <div style={{ fontSize: "12px", opacity: 0.8, lineHeight: 1.45 }}>
        {line}
        {cec?.device ? (
          <>
            <br />
            {cec.device}
            {cec.osd_name ? `  ·  ${cec.osd_name}` : ""}
          </>
        ) : null}
        {state?.watch_error ? (
          <>
            <br />
            {state.watch_error}
          </>
        ) : null}
      </div>
    </PanelSectionRow>
  );
}

function RecordedButton({ name }: { name: string }) {
  return (
    <PanelSectionRow>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 600,
          lineHeight: 1.3,
          padding: "4px 0 18px",
        }}
      >
        {name}
      </div>
    </PanelSectionRow>
  );
}

function Content() {
  const [state, setState] = useState<PluginState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [reservedHint, setReservedHint] = useState("");
  const [resetArmed, setResetArmed] = useState(false);
  const [pickingLaunch, setPickingLaunch] = useState(false);
  const reservedShown = useRef(false);

  const apply = useCallback((next: PluginState) => {
    setState(next);
    setError(next.error || "");
    setPending(pendingFromState(next));
    if (!next.recording && !next.pending) {
      reservedShown.current = false;
      setReservedHint("");
      setPickingLaunch(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      apply(await getState());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [apply]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (pending || state?.recording) return;
    const id = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(id);
  }, [pending, state?.recording, refresh]);

  useEffect(() => {
    const onRecorded = (payload: Recorded) => {
      if (payload.reserved) {
        if (!reservedShown.current) {
          reservedShown.current = true;
          setReservedHint(
            `${payload.name} is used by Steam. Turn on Override Steam buttons to map it.`
          );
        }
        return;
      }
      reservedShown.current = false;
      setReservedHint("");
      void refresh();
    };
    addEventListener("cec_recorded", onRecorded);
    return () => removeEventListener("cec_recorded", onRecorded);
  }, [refresh]);

  const onAdd = async () => {
    setBusy(true);
    setError("");
    reservedShown.current = false;
    setReservedHint("");
    setPickingLaunch(false);
    try {
      apply(await startRecord());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    setBusy(true);
    setPickingLaunch(false);
    try {
      apply(await cancelRecord());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onPickAction = async (action: string) => {
    if (!pending) return;
    if (action === "launch") {
      setPickingLaunch(true);
      return;
    }
    setBusy(true);
    try {
      const next = await saveMapping(pending.code, pending.name, action);
      apply(next);
      if (!next.ok && next.error) setError(next.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onPickApp = async (app: LibApp) => {
    if (!pending) return;
    setBusy(true);
    try {
      const next = await saveMapping(pending.code, pending.name, "launch", app.appid, app.name);
      apply(next);
      if (!next.ok && next.error) setError(next.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (code: number) => {
    setBusy(true);
    try {
      apply(await deleteMapping(code));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onOverride = async (enabled: boolean) => {
    setBusy(true);
    try {
      apply(await setOverrideSteamButtons(enabled));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    setBusy(true);
    try {
      apply(await resetAll());
      setResetArmed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const mappings = state?.mappings || [];
  const recording = Boolean(state?.recording);
  const override = Boolean(state?.override_steam_buttons);
  const actionIds = state?.actions?.length ? state.actions : Object.keys(ACTION_LABELS);
  const watchError = !state?.watch_ready ? state?.watch_error || error : error;
  const screen = pickingLaunch && pending ? "launch" : pending ? "pick" : recording ? "record" : "home";

  if (screen === "record") {
    return (
      <PanelSection title="Record button">
        <ErrorRows error={watchError} />
        <PanelSectionRow>
          <div style={{ fontSize: "13px", lineHeight: 1.4 }}>
            {override
              ? "Press a TV remote button."
              : "Press a TV remote button. D-pad, OK, Back, and play keys stay with Steam unless you enable Override Steam buttons."}
          </div>
        </PanelSectionRow>
        {reservedHint ? (
          <PanelSectionRow>
            <div style={{ fontSize: "13px", lineHeight: 1.4 }}>{reservedHint}</div>
          </PanelSectionRow>
        ) : null}
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => void onCancel()} disabled={busy}>
            Cancel
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  if (screen === "pick") {
    return (
      <PanelSection title="Choose action">
        <ErrorRows error={watchError} />
        <RecordedButton name={pending?.name || ""} />
        {reservedHint ? (
          <PanelSectionRow>
            <div style={{ fontSize: "13px", lineHeight: 1.4 }}>{reservedHint}</div>
          </PanelSectionRow>
        ) : null}
        {actionIds.map((id) => (
          <PanelSectionRow key={id}>
            <ButtonItem layout="below" onClick={() => void onPickAction(id)} disabled={busy}>
              {actionLabel(id)}
            </ButtonItem>
          </PanelSectionRow>
        ))}
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => void onCancel()} disabled={busy}>
            Cancel
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  if (screen === "launch") {
    const apps = listLibraryApps();
    return (
      <PanelSection title="Launch">
        <ErrorRows error={watchError} />
        <RecordedButton name={pending?.name || ""} />
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => setPickingLaunch(false)} disabled={busy}>
            Back
          </ButtonItem>
        </PanelSectionRow>
        {apps.length === 0 ? (
          <PanelSectionRow>
            <div style={{ opacity: 0.7, fontSize: "13px" }}>No games or programs found</div>
          </PanelSectionRow>
        ) : (
          apps.map((app) => (
            <PanelSectionRow key={app.appid}>
              <ButtonItem layout="below" onClick={() => void onPickApp(app)} disabled={busy}>
                {app.name}
              </ButtonItem>
            </PanelSectionRow>
          ))
        )}
      </PanelSection>
    );
  }

  return (
    <>
      <PanelSection title="CEC">
        <CecDebug state={state} />
      </PanelSection>
      <PanelSection title="Mappings">
        <ErrorRows error={watchError} />
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => void onAdd()} disabled={busy || !state?.watch_ready}>
            Add mapping
          </ButtonItem>
        </PanelSectionRow>
        {mappings.length === 0 ? (
          <PanelSectionRow>
            <div style={{ opacity: 0.7, fontSize: "13px" }}>No mappings yet</div>
          </PanelSectionRow>
        ) : (
          mappings.map((m) => (
            <PanelSectionRow key={m.code}>
              <ButtonItem
                label={`${m.name} → ${actionLabel(m)}`}
                layout="below"
                onClick={() => void onDelete(m.code)}
                disabled={busy}
              >
                Remove
              </ButtonItem>
            </PanelSectionRow>
          ))
        )}
      </PanelSection>
      <PanelSection title="Settings">
        <PanelSectionRow>
          <ToggleField
            label="Override Steam buttons"
            description="Allow mapping d-pad, Back, Play, and other keys Steam already uses."
            checked={override}
            disabled={busy}
            onChange={(v) => void onOverride(v)}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => void onReset()} disabled={busy}>
            {resetArmed ? "Tap again to confirm reset" : "Reset all"}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
}

export default definePlugin(() => {
  addEventListener("cec_action", (payload: ActionPayload | string) => {
    runAction(payload);
  });

  return {
    name: "CEC Remote",
    titleView: <div className={staticClasses.Title}>CEC Remote</div>,
    content: <Content />,
    icon: <FaTv />,
  };
});
