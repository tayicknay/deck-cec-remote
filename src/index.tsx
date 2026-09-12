import {
  ButtonItem,
  Dropdown,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaTv } from "react-icons/fa";

type Mapping = {
  code: number;
  name: string;
  action: string;
};

type PluginState = {
  ok: boolean;
  watch_ready: boolean;
  watch_error: string;
  recording: boolean;
  mappings: Mapping[];
  reserved: { code: number; name: string }[];
  actions: string[];
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

function Content() {
  const [state, setState] = useState<PluginState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Recorded | null>(null);
  const [pickedAction, setPickedAction] = useState("qam");

  const refresh = useCallback(async () => {
    try {
      const next = await getState();
      setState(next);
      setError(next.error || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

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
      setPending(payload);
      setPickedAction("qam");
      void refresh();
    };
    addEventListener("cec_recorded", onRecorded);
    return () => removeEventListener("cec_recorded", onRecorded);
  }, [refresh]);

  const actionOptions = useMemo(
    () =>
      (state?.actions?.length ? state.actions : Object.keys(ACTION_LABELS)).map((id) => ({
        data: id,
        label: actionLabel(id),
      })),
    [state]
  );

  const onAdd = async () => {
    setBusy(true);
    setError("");
    setPending(null);
    try {
      const next = await startRecord();
      setState(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    setBusy(true);
    try {
      const next = await cancelRecord();
      setState(next);
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const next = await saveMapping(pending.code, pending.name, pickedAction);
      setState(next);
      if (!next.ok && next.error) setError(next.error);
      else setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (code: number) => {
    setBusy(true);
    try {
      setState(await deleteMapping(code));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const mappings = state?.mappings || [];
  const recording = Boolean(state?.recording);

  return (
    <>
      <PanelSection title="Status">
        <PanelSectionRow>
          <div style={{ fontSize: "13px", opacity: 0.85, lineHeight: 1.35 }}>
            {state?.watch_ready
              ? "Listening to SteamOS cecd"
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
              <div style={{ fontSize: "13px" }}>
                Recorded <b>{pending.name}</b> (0x{pending.code.toString(16).padStart(2, "0")})
              </div>
            </PanelSectionRow>
            <PanelSectionRow>
              <Dropdown
                rgOptions={actionOptions}
                selectedOption={pickedAction}
                onChange={(opt) => setPickedAction(String(opt.data))}
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
