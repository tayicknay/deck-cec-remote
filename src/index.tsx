import {
  ButtonItem,
  DialogButton,
  Focusable,
  ModalRoot,
  NavEntryPositionPreferences,
  Navigation,
  PanelSection,
  PanelSectionRow,
  SideMenu,
  ToggleField,
  gamepadDialogClasses,
  getGamepadNavigationTrees,
  showModal,
  staticClasses,
  useQuickAccessVisible,
  type ShowModalResult,
} from "@decky/ui";
import {
  addEventListener,
  callable,
  definePlugin,
  removeEventListener,
} from "@decky/api";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FaInfoCircle, FaPlus, FaTrash, FaTv } from "react-icons/fa";

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
  adapter_name?: string;
  logical_addr?: string;
  driver?: string;
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

const COLOR_KEYS: Record<string, string> = {
  red: "#e24b4b",
  green: "#3cb371",
  blue: "#4b8fe2",
  yellow: "#d4b43c",
};

function buttonCaption(name: string): string {
  const raw = (name || "").trim();
  if (!raw) return "?";
  if (/^\d+$/.test(raw)) return raw;
  const slash = raw.split("/")[0];
  const aliases: Record<string, string> = {
    "select": "OK",
    "back": "Back",
    "guide": "Guide",
    "blue": "Blue",
    "red": "Red",
    "green": "Green",
    "yellow": "Yellow",
  };
  if (aliases[slash]) return aliases[slash];
  return raw.replace(/-/g, " ");
}

function KeyTag({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const raw = (name || "").trim() || "?";
  const digit = /^\d+$/.test(raw);
  const colorName = raw.toLowerCase().match(/^(red|green|blue|yellow)\b/)?.[1];
  const accent = colorName ? COLOR_KEYS[colorName] : undefined;
  const large = size === "lg";
  return (
    <span
      title={raw}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        minWidth: digit ? (large ? 36 : 28) : undefined,
        padding: large ? (digit ? "6px 10px" : "6px 12px") : digit ? "2px 7px" : "2px 9px",
        borderRadius: large ? 8 : 6,
        border: `1px solid ${accent || "rgba(255,255,255,0.38)"}`,
        background: accent ? `${accent}33` : "rgba(255,255,255,0.08)",
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.1)",
        fontFamily: digit
          ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'
          : "inherit",
        fontWeight: 700,
        fontSize: large ? (digit ? 22 : 16) : digit ? 14 : 12,
        lineHeight: 1.15,
        letterSpacing: digit ? 0 : "0.02em",
        textTransform: digit ? "none" : "capitalize",
        color: accent || "inherit",
        verticalAlign: "middle",
        whiteSpace: "nowrap",
      }}
    >
      {buttonCaption(raw)}
    </span>
  );
}

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
const setMenuOpen = callable<[opened: boolean], { ok: boolean }>("set_menu_open");

/** True while CEC Remote's QAM panel is on screen. Mapped actions (including QAM) stay idle. */
let pluginMenusOpen = false;

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
  const closeKey = mappings.find((m) => m.action === "cheat_sheet");
  cheatSheetModal = showModal(
    <ModalRoot closeModal={closeCheatSheet} bAllowFullSize={false}>
      <div style={{ padding: "8px 12px 16px", minWidth: "280px" }}>
        <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>CEC mappings</div>
        <div
          style={{
            fontSize: "12px",
            opacity: 0.85,
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "6px",
            lineHeight: 1.45,
          }}
        >
          <span>Mapped buttons only.</span>
          {closeKey ? (
            <>
              <span>Press</span>
              <KeyTag name={closeKey.name} />
              <span>again to close.</span>
            </>
          ) : null}
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
                alignItems: "center",
                gap: "16px",
                fontSize: "15px",
                lineHeight: 1.45,
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <KeyTag name={m.name} />
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

function menuStore(): any {
  return focusedWindow()?.MenuStore;
}

/** Reopen QAM without selecting a tab. OpenQuickAccessMenu() with no arg sets the tab to undefined → Notifications. */
function toggleQam(): void {
  if (isQamOpen()) {
    Navigation.CloseSideMenus();
    return;
  }
  const menu = menuStore();
  if (typeof menu?.OpenSideMenu === "function") menu.OpenSideMenu(SideMenu.QuickAccess);
  else Navigation.OpenSideMenu(SideMenu.QuickAccess);
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
      toggleQam();
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

function cecStatusLabel(state: PluginState | null): string {
  const cec = state?.cec;
  if (!cec?.adapter) return "not detected";
  if (cec.cecd && cec.hdmi_link) return "working";
  return "not working";
}

function TitleRow({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <PanelSectionRow>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          minWidth: 0,
        }}
      >
        <div style={{ flex: "1 1 0", minWidth: 0 }}>{title}</div>
        {action}
      </div>
    </PanelSectionRow>
  );
}

function yn(ok: boolean): string {
  return ok ? "yes" : "no";
}

function DebugLine({ label, value }: { label: string; value: string }) {
  return (
    <PanelSectionRow>
      <div style={{ fontSize: "13px", lineHeight: 1.4 }}>
        <div style={{ opacity: 0.65, fontSize: "12px" }}>{label}</div>
        <div style={{ fontWeight: 600, marginTop: 2 }}>{value}</div>
      </div>
    </PanelSectionRow>
  );
}

function CecStatusView({
  state,
  onBack,
}: {
  state: PluginState | null;
  onBack: () => void;
}) {
  const cec = state?.cec;
  let hdmi = "unknown";
  if (!cec?.adapter) hdmi = "no adapter";
  else if (cec.hdmi_link) hdmi = "connected";
  else if (cec.phys_addr) hdmi = "no link";
  else hdmi = "adapter present";
  return (
    <PanelSection title="CEC status">
      <DebugLine label="HDMI" value={hdmi} />
      <DebugLine label="Physical address" value={cec?.phys_addr || "—"} />
      <DebugLine label="Adapter" value={cec?.adapter_name || "—"} />
      <DebugLine label="Device" value={cec?.device || "—"} />
      <DebugLine label="OSD name" value={cec?.osd_name || "—"} />
      <DebugLine label="Logical address" value={cec?.logical_addr || "—"} />
      <DebugLine label="Driver" value={cec?.driver || "—"} />
      <DebugLine label="cecd" value={yn(Boolean(cec?.cecd))} />
      <DebugLine label="Listener" value={state?.watch_ready ? "yes" : "no"} />
      {state?.watch_error ? (
        <PanelSectionRow>
          <div style={{ color: "#f88", fontSize: "12px", lineHeight: 1.35 }}>{state.watch_error}</div>
        </PanelSectionRow>
      ) : null}
      <PanelSectionRow>
        <FocusDefault>
          <ButtonItem layout="below" onClick={onBack}>
            Back
          </ButtonItem>
        </FocusDefault>
      </PanelSectionRow>
    </PanelSection>
  );
}

function RecordedButton({ name }: { name: string }) {
  return (
    <div style={{ padding: "4px 0 14px" }}>
      <KeyTag name={name} size="lg" />
    </div>
  );
}

function PluginScreen({
  children,
  onGamepadBack,
}: {
  children: ReactNode;
  onGamepadBack?: () => void;
}) {
  return (
    <Focusable
      flow-children="column"
      navEntryPreferPosition={NavEntryPositionPreferences.PREFERRED_CHILD}
      onCancelButton={
        onGamepadBack
          ? (evt) => {
              onGamepadBack();
              evt.stopPropagation();
            }
          : undefined
      }
    >
      {children}
    </Focusable>
  );
}

const ICON_BTN: CSSProperties = {
  width: 32,
  minWidth: 32,
  maxWidth: 32,
  height: 32,
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

function IconButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const className = [
    gamepadDialogClasses?.Button,
    gamepadDialogClasses?.NoMinWidth,
    gamepadDialogClasses?.HighlightOnFocus,
    gamepadDialogClasses?.["ItemFocusAnim-translucent-white-20"],
    gamepadDialogClasses?.["ItemFocusAnimBorder-darkGrey"],
    gamepadDialogClasses?.focusAnimation,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div style={{ width: 32, minWidth: 32, maxWidth: 32, flex: "0 0 32px", overflow: "visible" }}>
      <DialogButton
        disabled={disabled}
        noFocusRing={false}
        className={className}
        style={{
          ...ICON_BTN,
          opacity: disabled ? 0.4 : 1,
        }}
        onClick={() => onClick()}
      >
        {children}
      </DialogButton>
    </div>
  );
}

function MappingRow({
  mapping,
  busy,
  onDelete,
  first = false,
}: {
  mapping: Mapping;
  busy: boolean;
  onDelete: (code: number) => void;
  first?: boolean;
}) {
  return (
    <div
      style={{
        paddingTop: first ? 6 : 4,
        paddingBottom: 4,
        overflow: "visible",
      }}
    >
      <PanelSectionRow>
        <Focusable
          flow-children="row"
          navEntryPreferPosition={NavEntryPositionPreferences.FIRST}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            minWidth: 0,
            minHeight: 40,
            overflow: "visible",
          }}
        >
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "16px",
              fontWeight: 600,
              lineHeight: "40px",
            }}
          >
            {actionLabel(mapping)}
          </div>
          <IconButton disabled={busy} onClick={() => void onDelete(mapping.code)}>
            <FaTrash />
          </IconButton>
        </Focusable>
      </PanelSectionRow>
      <PanelSectionRow>
        <KeyTag name={mapping.name} />
      </PanelSectionRow>
    </div>
  );
}

function FocusDefault({ children }: { children: ReactNode }) {
  const navRef = useRef<any>(null);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const node = navRef.current;
      if (typeof node?.TakeFocus === "function") node.TakeFocus();
      else if (typeof node?.focus === "function") node.focus();
    }, 30);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <Focusable ref={navRef} preferredFocus={true} autoFocus={true} {...({ navRef } as object)}>
      {children}
    </Focusable>
  );
}

function Content() {
  const [state, setState] = useState<PluginState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [reservedHint, setReservedHint] = useState<ReactNode>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [pickingLaunch, setPickingLaunch] = useState(false);
  const [showingCec, setShowingCec] = useState(false);
  const reservedShown = useRef(false);
  const qamVisible = useQuickAccessVisible();

  useEffect(() => {
    pluginMenusOpen = qamVisible;
    void setMenuOpen(qamVisible).catch(() => {});
    return () => {
      pluginMenusOpen = false;
      void setMenuOpen(false).catch(() => {});
    };
  }, [qamVisible]);

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
            <span style={{ display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <KeyTag name={payload.name} />
              <span>is used by Steam. Turn on Override Steam buttons to map it.</span>
            </span>
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

  const beginRecord = async () => {
    setBusy(true);
    setError("");
    reservedShown.current = false;
    setReservedHint("");
    setPickingLaunch(false);
    setShowingCec(false);
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
  const screen =
    showingCec && !pending && !recording
      ? "cec"
      : pickingLaunch && pending
        ? "launch"
        : pending
          ? "pick"
          : recording
            ? "record"
            : "home";

  if (screen === "cec") {
    return (
      <PluginScreen onGamepadBack={() => setShowingCec(false)}>
        <CecStatusView state={state} onBack={() => setShowingCec(false)} />
      </PluginScreen>
    );
  }

  if (screen === "record") {
    return (
      <PluginScreen onGamepadBack={() => void onCancel()}>
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
            <FocusDefault>
              <ButtonItem layout="below" onClick={() => void onCancel()} disabled={busy}>
                Cancel
              </ButtonItem>
            </FocusDefault>
          </PanelSectionRow>
        </PanelSection>
      </PluginScreen>
    );
  }

  if (screen === "pick") {
    const lastAction = actionIds.length - 1;
    return (
      <PluginScreen onGamepadBack={() => void onCancel()}>
        <PanelSection title="Choose action">
          <ErrorRows error={watchError} />
          <RecordedButton name={pending?.name || ""} />
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              bottomSeparator="standard"
              onClick={() => void beginRecord()}
              disabled={busy}
            >
              Change
            </ButtonItem>
          </PanelSectionRow>
          {reservedHint ? (
            <PanelSectionRow>
              <div style={{ fontSize: "13px", lineHeight: 1.4 }}>{reservedHint}</div>
            </PanelSectionRow>
          ) : null}
          {actionIds.map((id, i) => (
            <PanelSectionRow key={id}>
              {i === 0 ? (
                <FocusDefault>
                  <ButtonItem
                    layout="below"
                    bottomSeparator={i === lastAction ? "standard" : "none"}
                    onClick={() => void onPickAction(id)}
                    disabled={busy}
                  >
                    {actionLabel(id)}
                  </ButtonItem>
                </FocusDefault>
              ) : (
                <ButtonItem
                  layout="below"
                  bottomSeparator={i === lastAction ? "standard" : "none"}
                  onClick={() => void onPickAction(id)}
                  disabled={busy}
                >
                  {actionLabel(id)}
                </ButtonItem>
              )}
            </PanelSectionRow>
          ))}
          <PanelSectionRow>
            <ButtonItem layout="below" bottomSeparator="none" onClick={() => void onCancel()} disabled={busy}>
              Cancel
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      </PluginScreen>
    );
  }

  if (screen === "launch") {
    const apps = listLibraryApps();
    return (
      <PluginScreen onGamepadBack={() => setPickingLaunch(false)}>
        <PanelSection title="Launch">
          <ErrorRows error={watchError} />
          <RecordedButton name={pending?.name || ""} />
          <PanelSectionRow>
            {apps.length === 0 ? (
              <FocusDefault>
                <ButtonItem layout="below" onClick={() => setPickingLaunch(false)} disabled={busy}>
                  Back
                </ButtonItem>
              </FocusDefault>
            ) : (
              <ButtonItem layout="below" onClick={() => setPickingLaunch(false)} disabled={busy}>
                Back
              </ButtonItem>
            )}
          </PanelSectionRow>
          {apps.length === 0 ? (
            <PanelSectionRow>
              <div style={{ opacity: 0.7, fontSize: "13px" }}>No games or programs found</div>
            </PanelSectionRow>
          ) : (
            apps.map((app, i) => (
              <PanelSectionRow key={app.appid}>
                {i === 0 ? (
                  <FocusDefault>
                    <ButtonItem layout="below" onClick={() => void onPickApp(app)} disabled={busy}>
                      {app.name}
                    </ButtonItem>
                  </FocusDefault>
                ) : (
                  <ButtonItem layout="below" onClick={() => void onPickApp(app)} disabled={busy}>
                    {app.name}
                  </ButtonItem>
                )}
              </PanelSectionRow>
            ))
          )}
        </PanelSection>
      </PluginScreen>
    );
  }

  return (
    <PluginScreen>
      <PanelSection>
        <PanelSectionRow>
          <div style={{ fontSize: "12px", opacity: 0.75, lineHeight: 1.35 }}>
            Note: bindings are disabled while this menu is open
          </div>
        </PanelSectionRow>
        <TitleRow
          title={
            <div style={{ fontSize: "14px", lineHeight: "32px" }}>
              CEC status: {cecStatusLabel(state)}
            </div>
          }
          action={
            <IconButton onClick={() => setShowingCec(true)}>
              <FaInfoCircle />
            </IconButton>
          }
        />
      </PanelSection>
      <div style={{ marginTop: -4 }}>
        <PanelSection>
        <TitleRow
          title={
            <div className={staticClasses.PanelSectionTitle} style={{ padding: 0, margin: 0 }}>
              Mappings
            </div>
          }
          action={
            <FocusDefault>
              <IconButton
                disabled={busy || !state?.watch_ready}
                onClick={() => void beginRecord()}
              >
                <FaPlus />
              </IconButton>
            </FocusDefault>
          }
        />
        <ErrorRows error={watchError} />
        {mappings.length === 0 ? (
          <PanelSectionRow>
            <div style={{ opacity: 0.7, fontSize: "13px" }}>No mappings yet</div>
          </PanelSectionRow>
        ) : (
          <div style={{ overflow: "visible" }}>
            {mappings.map((m, i) => (
              <MappingRow
                key={m.code}
                mapping={m}
                busy={busy}
                first={i === 0}
                onDelete={(code) => void onDelete(code)}
              />
            ))}
          </div>
        )}
        </PanelSection>
      </div>
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
    </PluginScreen>
  );
}

export default definePlugin(() => {
  addEventListener("cec_action", (payload: ActionPayload | string) => {
    if (pluginMenusOpen) return;
    runAction(payload);
  });

  return {
    name: "CEC Remote",
    titleView: <div className={staticClasses.Title}>CEC Remote</div>,
    content: <Content />,
    icon: <FaTv />,
  };
});
