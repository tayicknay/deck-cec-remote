import {
  ButtonItem,
  Dropdown,
  Navigation,
  PanelSection,
  PanelSectionRow,
  ToggleField,
  getGamepadNavigationTrees,
  staticClasses,
} from "@decky/ui";
import {
  addEventListener,
  callable,
  definePlugin,
  removeEventListener,
} from "@decky/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaTv } from "react-icons/fa";

type Mapping = {
  code: number;
  name: string;
  action: string;
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
  error?: string;
};

type Recorded = {
  ok: boolean;
  reserved: boolean;
  code: number;
  name: string;
};

const ACTION_LABELS: Record<string, string> = {
  qam: "Open Quick Access Menu",
  steam_menu: "Open Steam menu",
  library: "Open Library",
  downloads: "Open Downloads",
};

const getState = callable<[], PluginState>("get_state");
const startRecord = callable<[], PluginState>("start_record");
const cancelRecord = callable<[], PluginState>("cancel_record");
const saveMapping = callable<[code: number, name: string, action: string], PluginState>(
  "save_mapping"
);
const deleteMapping = callable<[code: number], PluginState>("delete_mapping");
const setPendingAction = callable<[action: string], PluginState>("set_pending_action");
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

function runAction(action: string): void {
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
    default:
      break;
  }
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

function pendingFromState(next: PluginState): Pending | null {
  const p = next.pending;
  if (p && typeof p.code === "number") {
    return {
      code: p.code,
      name: p.name || `0x${p.code.toString(16)}`,
      action: p.action || "qam",
    };
  }
  return null;
}

function Content() {
  const [state, setState] = useState<PluginState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [reservedHint, setReservedHint] = useState("");
  const [resetArmed, setResetArmed] = useState(false);
  const reservedShown = useRef(false);
  const pickTimers = useRef<number[]>([]);

  const afterMenuClose = useCallback((fn: () => void) => {
    const id = window.setTimeout(fn, 80);
    pickTimers.current.push(id);
  }, []);

  const apply = useCallback((next: PluginState) => {
    setState(next);
    setError(next.error || "");
    setPending(pendingFromState(next));
    if (!next.recording) {
      reservedShown.current = false;
      setReservedHint("");
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
    return () => {
      for (const id of pickTimers.current) window.clearTimeout(id);
      pickTimers.current = [];
    };
  }, [refresh]);

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
    try {
      apply(await cancelRecord());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onActionChange = (action: string) => {
    afterMenuClose(() => {
      void setPendingAction(action)
        .then(apply)
        .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    });
  };

  const onSave = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const next = await saveMapping(pending.code, pending.name, pending.action || "qam");
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
  const actionOptions = useMemo(
    () =>
      (state?.actions?.length ? state.actions : Object.keys(ACTION_LABELS)).map((id) => ({
        data: id,
        label: actionLabel(id),
      })),
    [state]
  );
  const watchError = !state?.watch_ready && (state?.watch_error || error);
  const showStatus = Boolean(recording || pending || watchError || error);

  return (
    <>
      {showStatus ? (
        <PanelSection title={recording || pending ? "Recording" : "Status"}>
          {watchError ? (
            <PanelSectionRow>
              <div style={{ color: "#f88", fontSize: "12px", lineHeight: 1.35 }}>
                {state?.watch_error || error}
              </div>
            </PanelSectionRow>
          ) : error ? (
            <PanelSectionRow>
              <div style={{ color: "#f88", fontSize: "12px" }}>{error}</div>
            </PanelSectionRow>
          ) : null}
          {recording && !pending ? (
            <>
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
            </>
          ) : pending ? (
            <>
              <PanelSectionRow>
                <div style={{ fontSize: "13px", lineHeight: 1.4 }}>
                  Recorded <b>{pending.name}</b>
                </div>
              </PanelSectionRow>
              <PanelSectionRow>
                <Dropdown
                  rgOptions={actionOptions}
                  selectedOption={pending.action || "qam"}
                  menuLabel="Action"
                  onChange={(opt) => onActionChange(String(opt.data))}
                />
              </PanelSectionRow>
              <PanelSectionRow>
                <ButtonItem layout="below" onClick={() => void onSave()} disabled={busy}>
                  Save mapping
                </ButtonItem>
              </PanelSectionRow>
              <PanelSectionRow>
                <ButtonItem layout="below" onClick={() => void onCancel()} disabled={busy}>
                  Cancel
                </ButtonItem>
              </PanelSectionRow>
            </>
          ) : null}
        </PanelSection>
      ) : null}

      <PanelSection title="Mappings">
        {!recording && !pending ? (
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => void onAdd()} disabled={busy || !state?.watch_ready}>
              Add mapping
            </ButtonItem>
          </PanelSectionRow>
        ) : null}

        {mappings.length === 0 && !recording && !pending ? (
          <PanelSectionRow>
            <div style={{ opacity: 0.7, fontSize: "13px" }}>No mappings yet</div>
          </PanelSectionRow>
        ) : (
          mappings.map((m) => (
            <PanelSectionRow key={m.code}>
              <ButtonItem
                label={`${m.name} → ${actionLabel(m.action)}`}
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
  addEventListener("cec_action", (action: string) => {
    runAction(action);
  });

  return {
    name: "CEC Remote",
    titleView: <div className={staticClasses.Title}>CEC Remote</div>,
    content: <Content />,
    icon: <FaTv />,
  };
});
