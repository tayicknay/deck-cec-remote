import {
  ButtonItem,
  Navigation,
  PanelSection,
  PanelSectionRow,
  staticClasses,
} from "@decky/ui";
import {
  addEventListener,
  callable,
  definePlugin,
  removeEventListener,
  toaster,
} from "@decky/api";
import { useCallback, useEffect, useState } from "react";
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
const resetAll = callable<[], PluginState>("reset_all");

function runAction(action: string): void {
  switch (action) {
    case "qam":
      Navigation.OpenQuickAccessMenu();
      break;
    case "steam_menu":
      Navigation.OpenMainMenu();
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
    return { code: p.code, name: p.name || `0x${p.code.toString(16)}`, action: p.action };
  }
  return null;
}

function Content() {
  const [state, setState] = useState<PluginState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [resetArmed, setResetArmed] = useState(false);

  const apply = useCallback((next: PluginState) => {
    setState(next);
    setError(next.error || "");
    setPending(pendingFromState(next));
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
    const onRecorded = (payload: Recorded) => {
      if (payload.reserved) {
        toaster.toast({
          title: "CEC Remote",
          body: `${payload.name} is already used by Steam`,
        });
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

  const onPickAction = async (action: string) => {
    if (!pending) return;
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

  const onReset = async () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    setBusy(true);
    try {
      apply(await resetAll());
      setResetArmed(false);
      toaster.toast({ title: "CEC Remote", body: "Mappings cleared, cecd defaults restored" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const mappings = state?.mappings || [];
  const recording = Boolean(state?.recording);
  const actionIds = state?.actions?.length ? state.actions : Object.keys(ACTION_LABELS);

  return (
    <>
      <PanelSection title="Status">
        <PanelSectionRow>
          <div style={{ fontSize: "13px", opacity: 0.85, lineHeight: 1.35 }}>
            {state?.watch_ready
              ? state.cecd_override
                ? "Listening to SteamOS cecd (plugin override active)"
                : "Listening to SteamOS cecd"
              : state?.watch_error
                ? `Watcher: ${state.watch_error}`
                : "Starting CEC watcher…"}
          </div>
        </PanelSectionRow>
        {error ? (
          <PanelSectionRow>
            <div style={{ color: "#f88", fontSize: "12px" }}>{error}</div>
          </PanelSectionRow>
        ) : null}
      </PanelSection>

      <PanelSection title="Mappings">
        {recording && !pending ? (
          <>
            <PanelSectionRow>
              <div style={{ fontSize: "13px", lineHeight: 1.4 }}>
                Press a TV remote button. D-pad, OK, Back, Play/Pause and skip keys are ignored —
                Steam already uses those.
              </div>
            </PanelSectionRow>
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
                Recorded <b>{pending.name}</b> (0x{pending.code.toString(16).padStart(2, "0")}).
                Tap an action to save.
              </div>
            </PanelSectionRow>
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
          </>
        ) : (
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => void onAdd()} disabled={busy || !state?.watch_ready}>
              Add mapping
            </ButtonItem>
          </PanelSectionRow>
        )}

        {mappings.length === 0 && !recording && !pending ? (
          <PanelSectionRow>
            <div style={{ opacity: 0.7, fontSize: "13px" }}>No mappings yet</div>
          </PanelSectionRow>
        ) : (
          mappings.map((m) => (
            <div key={m.code}>
              <PanelSectionRow>
                <div style={{ fontSize: "13px", lineHeight: 1.35 }}>
                  <b>{m.name}</b> → {actionLabel(m.action)}
                </div>
              </PanelSectionRow>
              <PanelSectionRow>
                <ButtonItem layout="below" onClick={() => void onDelete(m.code)} disabled={busy}>
                  Remove {m.name}
                </ButtonItem>
              </PanelSectionRow>
            </div>
          ))
        )}
      </PanelSection>

      <PanelSection title="Reset">
        <PanelSectionRow>
          <div style={{ fontSize: "12px", opacity: 0.8, lineHeight: 1.35 }}>
            Clears plugin mappings and deletes our cecd fragment so SteamOS keyboard defaults come back.
            SteamOS manager files are left alone.
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => void onReset()}
            disabled={busy}
          >
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
