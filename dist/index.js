const manifest = {"name":"CEC Remote"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const addEventListener = api.addEventListener;
const removeEventListener = api.removeEventListener;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaTv (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M592 0H48A48 48 0 0 0 0 48v320a48 48 0 0 0 48 48h240v32H112a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H352v-32h240a48 48 0 0 0 48-48V48a48 48 0 0 0-48-48zm-16 352H64V64h512z"},"child":[]}]})(props);
}

const ACTION_LABELS = {
    qam: "Open Quick Access Menu",
    steam_menu: "Open Steam menu",
    library: "Open Library",
    downloads: "Open Downloads",
};
const getState = callable("get_state");
const startRecord = callable("start_record");
const cancelRecord = callable("cancel_record");
const saveMapping = callable("save_mapping");
const deleteMapping = callable("delete_mapping");
const setOverrideSteamButtons = callable("set_override_steam_buttons");
const resetAll = callable("reset_all");
function navTreeVisible(match) {
    try {
        const trees = DFL.getGamepadNavigationTrees() || [];
        return trees.some((tree) => {
            const id = String(tree?.id || tree?.m_ID || "");
            if (!match(id))
                return false;
            const win = tree?.m_Root?.m_element?.ownerDocument?.defaultView ||
                tree?.Root?.Element?.ownerDocument?.defaultView;
            if (!win)
                return true;
            return !win.document.hidden;
        });
    }
    catch {
        return false;
    }
}
function isQamOpen() {
    return navTreeVisible((id) => id === "QuickAccess-NA" || id.toLowerCase().includes("quickaccess"));
}
function isSteamMenuOpen() {
    if (isQamOpen())
        return false;
    return navTreeVisible((id) => {
        const lower = id.toLowerCase();
        if (lower.includes("quickaccess"))
            return false;
        return lower.includes("mainmenu") || lower.includes("mainnav") || lower === "menu-na";
    });
}
function runAction(action) {
    switch (action) {
        case "qam":
            if (isQamOpen())
                DFL.Navigation.CloseSideMenus();
            else
                DFL.Navigation.OpenQuickAccessMenu();
            break;
        case "steam_menu":
            if (isSteamMenuOpen())
                DFL.Navigation.CloseSideMenus();
            else
                DFL.Navigation.OpenMainMenu();
            break;
        case "library":
            DFL.Navigation.CloseSideMenus();
            DFL.Navigation.NavigateToLibraryTab();
            break;
        case "downloads":
            DFL.Navigation.CloseSideMenus();
            DFL.Navigation.Navigate("/library/downloads");
            break;
    }
}
function actionLabel(action) {
    return ACTION_LABELS[action] || action;
}
function pendingFromState(next) {
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
function ErrorRows({ error }) {
    if (!error)
        return null;
    return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { color: "#f88", fontSize: "12px", lineHeight: 1.35 }, children: error }) }));
}
function Content() {
    const [state, setState] = SP_REACT.useState(null);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [error, setError] = SP_REACT.useState("");
    const [pending, setPending] = SP_REACT.useState(null);
    const [reservedHint, setReservedHint] = SP_REACT.useState("");
    const [resetArmed, setResetArmed] = SP_REACT.useState(false);
    const reservedShown = SP_REACT.useRef(false);
    const apply = SP_REACT.useCallback((next) => {
        setState(next);
        setError(next.error || "");
        setPending(pendingFromState(next));
        if (!next.recording && !next.pending) {
            reservedShown.current = false;
            setReservedHint("");
        }
    }, []);
    const refresh = SP_REACT.useCallback(async () => {
        try {
            apply(await getState());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, [apply]);
    SP_REACT.useEffect(() => {
        void refresh();
    }, [refresh]);
    SP_REACT.useEffect(() => {
        const onRecorded = (payload) => {
            if (payload.reserved) {
                if (!reservedShown.current) {
                    reservedShown.current = true;
                    setReservedHint(`${payload.name} is used by Steam. Turn on Override Steam buttons to map it.`);
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
        try {
            apply(await startRecord());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    };
    const onCancel = async () => {
        setBusy(true);
        try {
            apply(await cancelRecord());
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    };
    const onPickAction = async (action) => {
        if (!pending)
            return;
        setBusy(true);
        try {
            const next = await saveMapping(pending.code, pending.name, action);
            apply(next);
            if (!next.ok && next.error)
                setError(next.error);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    };
    const onDelete = async (code) => {
        setBusy(true);
        try {
            apply(await deleteMapping(code));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    };
    const onOverride = async (enabled) => {
        setBusy(true);
        try {
            apply(await setOverrideSteamButtons(enabled));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
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
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    };
    const mappings = state?.mappings || [];
    const recording = Boolean(state?.recording);
    const override = Boolean(state?.override_steam_buttons);
    const actionIds = state?.actions?.length ? state.actions : Object.keys(ACTION_LABELS);
    const watchError = !state?.watch_ready ? state?.watch_error || error : error;
    const screen = pending ? "pick" : recording ? "record" : "home";
    if (screen === "record") {
        return (SP_JSX.jsxs(DFL.PanelSection, { title: "Record button", children: [SP_JSX.jsx(ErrorRows, { error: watchError }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "13px", lineHeight: 1.4 }, children: override
                            ? "Press a TV remote button."
                            : "Press a TV remote button. D-pad, OK, Back, and play keys stay with Steam unless you enable Override Steam buttons." }) }), reservedHint ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "13px", lineHeight: 1.4 }, children: reservedHint }) })) : null, SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => void onCancel(), disabled: busy, children: "Cancel" }) })] }));
    }
    if (screen === "pick") {
        return (SP_JSX.jsxs(DFL.PanelSection, { title: "Choose action", children: [SP_JSX.jsx(ErrorRows, { error: watchError }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: "13px", lineHeight: 1.4 }, children: ["Last button: ", SP_JSX.jsx("b", { children: pending?.name })] }) }), reservedHint ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "13px", lineHeight: 1.4 }, children: reservedHint }) })) : null, actionIds.map((id) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => void onPickAction(id), disabled: busy, children: actionLabel(id) }) }, id))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => void onCancel(), disabled: busy, children: "Cancel" }) })] }));
    }
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Mappings", children: [SP_JSX.jsx(ErrorRows, { error: watchError }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => void onAdd(), disabled: busy || !state?.watch_ready, children: "Add mapping" }) }), mappings.length === 0 ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { opacity: 0.7, fontSize: "13px" }, children: "No mappings yet" }) })) : (mappings.map((m) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { label: `${m.name} → ${actionLabel(m.action)}`, layout: "below", onClick: () => void onDelete(m.code), disabled: busy, children: "Remove" }) }, m.code))))] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Settings", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Override Steam buttons", description: "Allow mapping d-pad, Back, Play, and other keys Steam already uses.", checked: override, disabled: busy, onChange: (v) => void onOverride(v) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => void onReset(), disabled: busy, children: resetArmed ? "Tap again to confirm reset" : "Reset all" }) })] })] }));
}
var index = definePlugin(() => {
    addEventListener("cec_action", (action) => {
        runAction(action);
    });
    return {
        name: "CEC Remote",
        titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "CEC Remote" }),
        content: SP_JSX.jsx(Content, {}),
        icon: SP_JSX.jsx(FaTv, {}),
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
