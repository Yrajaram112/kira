# Assistant UI

Electron + React + Three.js front-end. Talks to the Python backend over
`ws://localhost:8765` (configurable via `ASSISTANT_WS_URL`).

## Quick start

```powershell
cd ui
npm install                    # one-time
npm run dev                    # spawns Vite dev server + Electron
```

In another terminal you can run the backend on its own:

```powershell
.venv\Scripts\python.exe main.py
```

If you'd rather have Electron spawn the backend automatically (using the
project's `.venv`), just run `npm run dev` — the Electron main process spawns
`python main.py` by default. Skip that with `ASSISTANT_NO_SPAWN_PY=1`.

## Layout

```
ui/
├── electron/
│   ├── main.js          Electron main process (windows + tray + py spawn)
│   └── preload.js       contextBridge: exposes window.assistant.*
├── index.html           Main 400×600 window entry
├── hud.html             280×80 HUD overlay entry
├── src/
│   ├── App.jsx          Main window root
│   ├── main.jsx, hud.jsx  Vite mount points
│   ├── components/
│   │   ├── Orb.jsx          Three.js sphere + 400-particle halo + GLSL shader
│   │   ├── Waveform.jsx     Canvas bar visualiser
│   │   ├── StatusText.jsx   Fading status label
│   │   ├── TaskLog.jsx      Slide-up action log
│   │   └── HUD.jsx          Tiny floating overlay
│   ├── store/
│   │   └── useAssistantStore.js   Single WS connection, fan-out hook
│   └── styles/
│       ├── theme.js     Colour palette + fonts
│       └── global.css   Layout + animations
├── package.json
└── vite.config.js       Builds index.html + hud.html together
```

## Build a single .exe

```powershell
cd ui
npm run build              # produces ui/out/Assistant Setup *.exe
```

The .exe still relies on a working `.venv` next to it (the Electron process
launches `..\.venv\Scripts\python.exe main.py`). If you want a *truly* one-file
distributable, freeze the Python backend with PyInstaller first and update
`electron/main.js` to spawn that .exe instead.

## Events the UI listens for

| `event`        | Fields                                       | When                            |
| -------------- | -------------------------------------------- | ------------------------------- |
| `state_change` | `state`, optional `command`, optional `text` | Every loop transition           |
| `waveform`     | `data: number[]`                             | While listening / speaking      |
| `task_log`     | `text`, `kind`, `ts`                         | After every executed command    |
| `memory`       | `text`, `ts`                                 | When a long-term memory is hit  |
| `hello`        | `ts`                                         | Greeting on new WS connection   |
