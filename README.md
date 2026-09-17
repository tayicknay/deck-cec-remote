# CEC Remote (Decky)

Map HDMI-CEC TV remote buttons to SteamOS actions from the Decky Quick Access Menu.

First actions:

- Open Quick Access Menu
- Open Steam menu (left `STEAM` menu)
- Open Library
- Open Downloads

More actions can be added later as we find use cases.

## How it works

SteamOS already owns the CEC adapter through Valve’s **`cecd`** (`com.steampowered.CecDaemon1`). This plugin does **not** open `/dev/cec0`. It listens on the Deck user’s session bus for `UserControlPressed`, same as the `cec-listen` helper.

That means:

- Buttons the TV never puts on the CEC bus (often **INFO**, **CH±**, **VOL±** on many TVs) will never appear here.
- D-pad, OK, Back/Return, Play/Pause/Stop, Rewind/FF, Skip are left to Steam. The plugin ignores them while recording.

`cecd` is Steam-made, not a generic Linux CEC stack. Other Linux tools (`libCEC` / `cec-client`, `cec-ctl`) talk to the same kernel device. On SteamOS they fight `cecd` for `/dev/cec0` and **cannot see extra keys** the TV never sends. Staying on `cecd`’s DBus is the right surface.

## Install (Steam Deck)

Needs [Decky Loader](https://decky.xyz).

### Option A — ZIP from Actions / Releases

Every push to `main` builds a Decky ZIP. The Actions artifact is named **`cec-remote`** — download that file and install it as-is (GitHub already wrapped the plugin folder). Releases attach `cec-remote.zip` the same way.

- Decky → gear → Developer → **Install from ZIP**, or
- On the Deck (with `gh` logged in):

```bash
git clone https://github.com/tayicknay/deck-cec-remote.git
cd deck-cec-remote
./scripts/install.sh --download
```

### Option B — from a git checkout

As user `deck` — **not** with `sudo` on the script:

```bash
git clone https://github.com/tayicknay/deck-cec-remote.git
cd deck-cec-remote
./scripts/install.sh
```

Installs to `~/homebrew/plugins/cec-remote/`.

Override path: `DECKY_HOME=/home/deck/homebrew ./scripts/install.sh`  
Skip restart: `./scripts/install.sh --no-restart`

Local ZIP without CI: `./scripts/package-zip.sh`

## Use

1. Gaming Mode → QAM → Decky → **CEC Remote**
2. **Add mapping**
3. Press a TV remote button that Steam does not already use (colors, numbers, Clear, …)
4. Pick an action and save

Mappings are stored under Decky’s plugin settings dir (`mappings.json`). The watcher keeps running when QAM is closed, so mapped buttons still fire.

Saving a **number or color** mapping writes `~/.config/cecd/config.d/80-deck-cec-remote.toml`: the full factory `cecd` table with only those bound number/color keys omitted, so they stop typing. D-pad, OK, Back, play/pause, and the rest stay. SteamOS files (`00-` / `99-steamos-manager.toml`) are never touched. **Reset all** deletes our fragment and `mappings.json`, then reloads `cecd`.

**Downloads** uses `Navigation.Navigate("/library/downloads")`. If that path is wrong on your Steam build, say so and we will change it.

## Develop

```bash
pnpm i && pnpm build
./scripts/install.sh
# or: DECK_HOST=deck@ip ./scripts/deploy.sh
```
