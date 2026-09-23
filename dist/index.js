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
}function FaTrash (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"},"child":[]}]})(props);
}function FaPlus (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"},"child":[]}]})(props);
}function FaInfoCircle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"},"child":[]}]})(props);
}

const ACTION_LABELS = {
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
const COLOR_KEYS = {
    red: "#e24b4b",
    green: "#3cb371",
    blue: "#4b8fe2",
    yellow: "#d4b43c",
};
function buttonCaption(name) {
    const raw = (name || "").trim();
    if (!raw)
        return "?";
    if (/^\d+$/.test(raw))
        return raw;
    const slash = raw.split("/")[0];
    const aliases = {
        "select": "OK",
        "back": "Back",
        "guide": "Guide",
        "blue": "Blue",
        "red": "Red",
        "green": "Green",
        "yellow": "Yellow",
    };
    if (aliases[slash])
        return aliases[slash];
    return raw.replace(/-/g, " ");
}
function KeyTag({ name, size = "sm" }) {
    const raw = (name || "").trim() || "?";
    const digit = /^\d+$/.test(raw);
    const colorName = raw.toLowerCase().match(/^(red|green|blue|yellow)\b/)?.[1];
    const accent = colorName ? COLOR_KEYS[colorName] : undefined;
    const large = size === "lg";
    return (SP_JSX.jsx("span", { title: raw, style: {
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
        }, children: buttonCaption(raw) }));
}
const getState = callable("get_state");
const startRecord = callable("start_record");
const cancelRecord = callable("cancel_record");
const saveMapping = callable("save_mapping");
const deleteMapping = callable("delete_mapping");
const setOverrideSteamButtons = callable("set_override_steam_buttons");
const resetAll = callable("reset_all");
const setMenuOpen = callable("set_menu_open");
/** True while CEC Remote's QAM panel is on screen. Mapped actions (including QAM) stay idle. */
let pluginMenusOpen = false;
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
let cheatSheetModal = null;
function closeCheatSheet() {
    try {
        cheatSheetModal?.Close();
    }
    catch {
        /* ignore */
    }
    cheatSheetModal = null;
}
async function toggleCheatSheet() {
    if (cheatSheetModal) {
        closeCheatSheet();
        return;
    }
    let mappings = [];
    try {
        mappings = (await getState()).mappings || [];
    }
    catch {
        /* still show an empty sheet */
    }
    DFL.Navigation.CloseSideMenus();
    const closeKey = mappings.find((m) => m.action === "cheat_sheet");
    cheatSheetModal = DFL.showModal(SP_JSX.jsx(DFL.ModalRoot, { closeModal: closeCheatSheet, bAllowFullSize: false, children: SP_JSX.jsxs("div", { style: { padding: "8px 12px 16px", minWidth: "280px" }, children: [SP_JSX.jsx("div", { style: { fontSize: "20px", fontWeight: 700, marginBottom: "6px" }, children: "CEC mappings" }), SP_JSX.jsxs("div", { style: {
                        fontSize: "12px",
                        opacity: 0.85,
                        marginBottom: "14px",
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "6px",
                        lineHeight: 1.45,
                    }, children: [SP_JSX.jsx("span", { children: "Mapped buttons only." }), closeKey ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx("span", { children: "Press" }), SP_JSX.jsx(KeyTag, { name: closeKey.name }), SP_JSX.jsx("span", { children: "again to close." })] })) : null] }), mappings.length === 0 ? (SP_JSX.jsx("div", { style: { fontSize: "14px", opacity: 0.75 }, children: "No custom mappings yet" })) : (mappings.map((m) => (SP_JSX.jsxs("div", { style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                        fontSize: "15px",
                        lineHeight: 1.45,
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }, children: [SP_JSX.jsx(KeyTag, { name: m.name }), SP_JSX.jsx("span", { style: { opacity: 0.85, textAlign: "right" }, children: actionLabel(m) })] }, m.code))))] }) }));
}
function steamClient() {
    return window.SteamClient;
}
function focusedWindow() {
    const store = window.SteamUIStore;
    try {
        return store?.GetFocusedWindowInstance?.();
    }
    catch {
        return store?.WindowStore?.GamepadUIMainWindowInstance;
    }
}
function takeScreenshot() {
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
    }
    catch {
        /* ignore */
    }
    try {
        sc?.Input?.ControllerKeyboardSetKeyState?.(HID_F12, true);
        sc?.Input?.ControllerKeyboardSetKeyState?.(HID_F12, false);
    }
    catch {
        /* ignore */
    }
}
function menuStore() {
    return focusedWindow()?.MenuStore;
}
/** Reopen QAM without selecting a tab. OpenQuickAccessMenu() with no arg sets the tab to undefined → Notifications. */
function toggleQam() {
    if (isQamOpen()) {
        DFL.Navigation.CloseSideMenus();
        return;
    }
    const menu = menuStore();
    if (typeof menu?.OpenSideMenu === "function")
        menu.OpenSideMenu(DFL.SideMenu.QuickAccess);
    else
        DFL.Navigation.OpenSideMenu(DFL.SideMenu.QuickAccess);
}
function showKeyboard() {
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
    }
    catch {
        /* ignore */
    }
}
function runAction(payload) {
    const action = typeof payload === "string" ? payload : payload.action;
    const appid = typeof payload === "string" ? undefined : payload.appid;
    switch (action) {
        case "qam":
            toggleQam();
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
        case "settings":
            DFL.Navigation.CloseSideMenus();
            DFL.Navigation.Navigate("/settings");
            break;
        case "power":
            DFL.Navigation.CloseSideMenus();
            DFL.Navigation.OpenPowerMenu();
            break;
        case "friends":
            DFL.Navigation.CloseSideMenus();
            DFL.Navigation.Navigate("/friends");
            break;
        case "chat":
            DFL.Navigation.CloseSideMenus();
            DFL.Navigation.NavigateToChat();
            break;
        case "screenshot":
            DFL.Navigation.CloseSideMenus();
            window.setTimeout(() => takeScreenshot(), 200);
            break;
        case "keyboard":
            showKeyboard();
            break;
        case "controller":
            DFL.Navigation.CloseSideMenus();
            try {
                steamClient()?.Input?.ShowControllerSettings?.();
            }
            catch {
                DFL.Navigation.Navigate("/settings/controller");
            }
            break;
        case "cheat_sheet":
            void toggleCheatSheet();
            break;
        case "launch":
            if (appid == null)
                break;
            DFL.Navigation.CloseSideMenus();
            try {
                steamClient()?.Apps?.RunGame(String(appid), "", -1, 200);
            }
            catch {
                /* ignore */
            }
            break;
    }
}
function actionLabel(mapping) {
    if (typeof mapping === "string")
        return ACTION_LABELS[mapping] || mapping;
    if (mapping.action === "launch") {
        return mapping.app_name ? `Launch ${mapping.app_name}` : "Launch …";
    }
    return ACTION_LABELS[mapping.action] || mapping.action;
}
function collectApps(src, out) {
    if (!src)
        return;
    let list = [];
    if (Array.isArray(src))
        list = src;
    else {
        try {
            if (typeof src.values === "function")
                list = Array.from(src.values());
            else if (typeof src[Symbol.iterator] === "function")
                list = Array.from(src);
        }
        catch {
            list = [];
        }
    }
    for (const app of list) {
        if (!app)
            continue;
        const appid = Number(app.appid);
        const name = String(app.display_name || app.displayName || app.sort_as || "").trim();
        if (!appid || !name)
            continue;
        if (app.visible_in_game_list === false)
            continue;
        const lastPlayed = Number(app.rt_last_time_played || app.rt_last_time_locally_played || 0) || 0;
        const prev = out.get(appid);
        if (!prev || lastPlayed > prev.lastPlayed)
            out.set(appid, { appid, name, lastPlayed });
    }
}
function listLibraryApps() {
    const out = new Map();
    const cs = window.collectionStore;
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
            }
            catch {
                /* ignore */
            }
        }
    }
    return [...out.values()].sort((a, b) => {
        if (a.lastPlayed !== b.lastPlayed)
            return b.lastPlayed - a.lastPlayed;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
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
function cecStatusLabel(state) {
    const cec = state?.cec;
    if (!cec?.adapter)
        return "not detected";
    if (cec.cecd && cec.hdmi_link)
        return "working";
    return "not working";
}
function TitleRow({ title, action }) {
    return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                minWidth: 0,
            }, children: [SP_JSX.jsx("div", { style: { flex: "1 1 0", minWidth: 0 }, children: title }), action] }) }));
}
function yn(ok) {
    return ok ? "yes" : "no";
}
function DebugLine({ label, value }) {
    return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: "13px", lineHeight: 1.4 }, children: [SP_JSX.jsx("div", { style: { opacity: 0.65, fontSize: "12px" }, children: label }), SP_JSX.jsx("div", { style: { fontWeight: 600, marginTop: 2 }, children: value })] }) }));
}
function CecStatusView({ state, onBack, }) {
    const cec = state?.cec;
    let hdmi = "unknown";
    if (!cec?.adapter)
        hdmi = "no adapter";
    else if (cec.hdmi_link)
        hdmi = "connected";
    else if (cec.phys_addr)
        hdmi = "no link";
    else
        hdmi = "adapter present";
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "CEC status", children: [SP_JSX.jsx(DebugLine, { label: "HDMI", value: hdmi }), SP_JSX.jsx(DebugLine, { label: "Physical address", value: cec?.phys_addr || "—" }), SP_JSX.jsx(DebugLine, { label: "Adapter", value: cec?.adapter_name || "—" }), SP_JSX.jsx(DebugLine, { label: "Device", value: cec?.device || "—" }), SP_JSX.jsx(DebugLine, { label: "OSD name", value: cec?.osd_name || "—" }), SP_JSX.jsx(DebugLine, { label: "Logical address", value: cec?.logical_addr || "—" }), SP_JSX.jsx(DebugLine, { label: "Driver", value: cec?.driver || "—" }), SP_JSX.jsx(DebugLine, { label: "cecd", value: yn(Boolean(cec?.cecd)) }), SP_JSX.jsx(DebugLine, { label: "Listener", value: state?.watch_ready ? "yes" : "no" }), state?.watch_error ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { color: "#f88", fontSize: "12px", lineHeight: 1.35 }, children: state.watch_error }) })) : null, SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(FocusDefault, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onBack, children: "Back" }) }) })] }));
}
function RecordedButton({ name }) {
    return (SP_JSX.jsx("div", { style: { padding: "4px 0 14px" }, children: SP_JSX.jsx(KeyTag, { name: name, size: "lg" }) }));
}
function PluginScreen({ children, onGamepadBack, }) {
    return (SP_JSX.jsx(DFL.Focusable, { "flow-children": "column", navEntryPreferPosition: DFL.NavEntryPositionPreferences.PREFERRED_CHILD, onCancelButton: onGamepadBack
            ? (evt) => {
                onGamepadBack();
                evt.stopPropagation();
            }
            : undefined, children: children }));
}
const ICON_BTN = {
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
function IconButton({ onClick, disabled, children, }) {
    const className = [
        DFL.gamepadDialogClasses?.Button,
        DFL.gamepadDialogClasses?.NoMinWidth,
        DFL.gamepadDialogClasses?.HighlightOnFocus,
        DFL.gamepadDialogClasses?.["ItemFocusAnim-translucent-white-20"],
        DFL.gamepadDialogClasses?.["ItemFocusAnimBorder-darkGrey"],
        DFL.gamepadDialogClasses?.focusAnimation,
    ]
        .filter(Boolean)
        .join(" ");
    return (SP_JSX.jsx("div", { style: { width: 32, minWidth: 32, maxWidth: 32, flex: "0 0 32px", overflow: "visible" }, children: SP_JSX.jsx(DFL.DialogButton, { disabled: disabled, noFocusRing: false, className: className, style: {
                ...ICON_BTN,
                opacity: disabled ? 0.4 : 1,
            }, onClick: () => onClick(), children: children }) }));
}
function MappingRow({ mapping, busy, onDelete, first = false, }) {
    return (SP_JSX.jsxs("div", { style: {
            paddingTop: first ? 6 : 4,
            paddingBottom: 4,
            overflow: "visible",
        }, children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(DFL.Focusable, { "flow-children": "row", navEntryPreferPosition: DFL.NavEntryPositionPreferences.FIRST, style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        minWidth: 0,
                        minHeight: 40,
                        overflow: "visible",
                    }, children: [SP_JSX.jsx("div", { style: {
                                flex: "1 1 0",
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: "16px",
                                fontWeight: 600,
                                lineHeight: "40px",
                            }, children: actionLabel(mapping) }), SP_JSX.jsx(IconButton, { disabled: busy, onClick: () => void onDelete(mapping.code), children: SP_JSX.jsx(FaTrash, {}) })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(KeyTag, { name: mapping.name }) })] }));
}
function FocusDefault({ children }) {
    const navRef = SP_REACT.useRef(null);
    SP_REACT.useEffect(() => {
        const id = window.setTimeout(() => {
            const node = navRef.current;
            if (typeof node?.TakeFocus === "function")
                node.TakeFocus();
            else if (typeof node?.focus === "function")
                node.focus();
        }, 30);
        return () => window.clearTimeout(id);
    }, []);
    return (SP_JSX.jsx(DFL.Focusable, { ref: navRef, preferredFocus: true, autoFocus: true, ...{ navRef }, children: children }));
}
function Content() {
    const [state, setState] = SP_REACT.useState(null);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [error, setError] = SP_REACT.useState("");
    const [pending, setPending] = SP_REACT.useState(null);
    const [reservedHint, setReservedHint] = SP_REACT.useState(null);
    const [resetArmed, setResetArmed] = SP_REACT.useState(false);
    const [pickingLaunch, setPickingLaunch] = SP_REACT.useState(false);
    const [showingCec, setShowingCec] = SP_REACT.useState(false);
    const reservedShown = SP_REACT.useRef(false);
    const qamVisible = DFL.useQuickAccessVisible();
    SP_REACT.useEffect(() => {
        pluginMenusOpen = qamVisible;
        void setMenuOpen(qamVisible).catch(() => { });
        return () => {
            pluginMenusOpen = false;
            void setMenuOpen(false).catch(() => { });
        };
    }, [qamVisible]);
    const apply = SP_REACT.useCallback((next) => {
        setState(next);
        setError(next.error || "");
        setPending(pendingFromState(next));
        if (!next.recording && !next.pending) {
            reservedShown.current = false;
            setReservedHint("");
            setPickingLaunch(false);
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
        if (pending || state?.recording)
            return;
        const id = window.setInterval(() => void refresh(), 4000);
        return () => window.clearInterval(id);
    }, [pending, state?.recording, refresh]);
    SP_REACT.useEffect(() => {
        const onRecorded = (payload) => {
            if (payload.reserved) {
                if (!reservedShown.current) {
                    reservedShown.current = true;
                    setReservedHint(SP_JSX.jsxs("span", { style: { display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 6 }, children: [SP_JSX.jsx(KeyTag, { name: payload.name }), SP_JSX.jsx("span", { children: "is used by Steam. Turn on Override Steam buttons to map it." })] }));
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
        setPickingLaunch(false);
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
        if (action === "launch") {
            setPickingLaunch(true);
            return;
        }
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
    const onPickApp = async (app) => {
        if (!pending)
            return;
        setBusy(true);
        try {
            const next = await saveMapping(pending.code, pending.name, "launch", app.appid, app.name);
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
    const screen = showingCec && !pending && !recording
        ? "cec"
        : pickingLaunch && pending
            ? "launch"
            : pending
                ? "pick"
                : recording
                    ? "record"
                    : "home";
    if (screen === "cec") {
        return (SP_JSX.jsx(PluginScreen, { onGamepadBack: () => setShowingCec(false), children: SP_JSX.jsx(CecStatusView, { state: state, onBack: () => setShowingCec(false) }) }));
    }
    if (screen === "record") {
        return (SP_JSX.jsx(PluginScreen, { onGamepadBack: () => void onCancel(), children: SP_JSX.jsxs(DFL.PanelSection, { title: "Record button", children: [SP_JSX.jsx(ErrorRows, { error: watchError }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "13px", lineHeight: 1.4 }, children: override
                                ? "Press a TV remote button."
                                : "Press a TV remote button. D-pad, OK, Back, and play keys stay with Steam unless you enable Override Steam buttons." }) }), reservedHint ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "13px", lineHeight: 1.4 }, children: reservedHint }) })) : null, SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(FocusDefault, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => void onCancel(), disabled: busy, children: "Cancel" }) }) })] }) }));
    }
    if (screen === "pick") {
        const lastAction = actionIds.length - 1;
        return (SP_JSX.jsx(PluginScreen, { onGamepadBack: () => void onCancel(), children: SP_JSX.jsxs(DFL.PanelSection, { title: "Choose action", children: [SP_JSX.jsx(ErrorRows, { error: watchError }), SP_JSX.jsx(RecordedButton, { name: pending?.name || "" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", bottomSeparator: "standard", onClick: () => void beginRecord(), disabled: busy, children: "Change" }) }), reservedHint ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "13px", lineHeight: 1.4 }, children: reservedHint }) })) : null, actionIds.map((id, i) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: i === 0 ? (SP_JSX.jsx(FocusDefault, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", bottomSeparator: i === lastAction ? "standard" : "none", onClick: () => void onPickAction(id), disabled: busy, children: actionLabel(id) }) })) : (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", bottomSeparator: i === lastAction ? "standard" : "none", onClick: () => void onPickAction(id), disabled: busy, children: actionLabel(id) })) }, id))), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", bottomSeparator: "none", onClick: () => void onCancel(), disabled: busy, children: "Cancel" }) })] }) }));
    }
    if (screen === "launch") {
        const apps = listLibraryApps();
        return (SP_JSX.jsx(PluginScreen, { onGamepadBack: () => setPickingLaunch(false), children: SP_JSX.jsxs(DFL.PanelSection, { title: "Launch", children: [SP_JSX.jsx(ErrorRows, { error: watchError }), SP_JSX.jsx(RecordedButton, { name: pending?.name || "" }), SP_JSX.jsx(DFL.PanelSectionRow, { children: apps.length === 0 ? (SP_JSX.jsx(FocusDefault, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setPickingLaunch(false), disabled: busy, children: "Back" }) })) : (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setPickingLaunch(false), disabled: busy, children: "Back" })) }), apps.length === 0 ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { opacity: 0.7, fontSize: "13px" }, children: "No games or programs found" }) })) : (apps.map((app, i) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: i === 0 ? (SP_JSX.jsx(FocusDefault, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => void onPickApp(app), disabled: busy, children: app.name }) })) : (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => void onPickApp(app), disabled: busy, children: app.name })) }, app.appid))))] }) }));
    }
    return (SP_JSX.jsxs(PluginScreen, { children: [SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "12px", opacity: 0.75, lineHeight: 1.35 }, children: "Note: bindings are disabled while this menu is open" }) }), SP_JSX.jsx(TitleRow, { title: SP_JSX.jsxs("div", { style: { fontSize: "14px", lineHeight: "32px" }, children: ["CEC status: ", cecStatusLabel(state)] }), action: SP_JSX.jsx(IconButton, { onClick: () => setShowingCec(true), children: SP_JSX.jsx(FaInfoCircle, {}) }) })] }), SP_JSX.jsx("div", { style: { marginTop: -4 }, children: SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(TitleRow, { title: SP_JSX.jsx("div", { className: DFL.staticClasses.PanelSectionTitle, style: { padding: 0, margin: 0 }, children: "Mappings" }), action: SP_JSX.jsx(FocusDefault, { children: SP_JSX.jsx(IconButton, { disabled: busy || !state?.watch_ready, onClick: () => void beginRecord(), children: SP_JSX.jsx(FaPlus, {}) }) }) }), SP_JSX.jsx(ErrorRows, { error: watchError }), mappings.length === 0 ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { opacity: 0.7, fontSize: "13px" }, children: "No mappings yet" }) })) : (SP_JSX.jsx("div", { style: { overflow: "visible" }, children: mappings.map((m, i) => (SP_JSX.jsx(MappingRow, { mapping: m, busy: busy, first: i === 0, onDelete: (code) => void onDelete(code) }, m.code))) }))] }) }), SP_JSX.jsxs(DFL.PanelSection, { title: "Settings", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "Override Steam buttons", description: "Allow mapping d-pad, Back, Play, and other keys Steam already uses.", checked: override, disabled: busy, onChange: (v) => void onOverride(v) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => void onReset(), disabled: busy, children: resetArmed ? "Tap again to confirm reset" : "Reset all" }) })] })] }));
}
var index = definePlugin(() => {
    addEventListener("cec_action", (payload) => {
        if (pluginMenusOpen)
            return;
        runAction(payload);
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
