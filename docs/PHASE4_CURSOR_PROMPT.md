# KIRA AI — Phase 4 Cursor Prompt
# The visual layer. This is the demo that gets clipped and goes viral.
# Paste after Phase 3 is complete and tested.

---

## CONTEXT

The full backend is working. KIRA hears, thinks, remembers, and acts.
Now build the visual layer: an Electron desktop app with a cinematic dark UI,
animated AI orb, voice waveform, live task feed, and a floating HUD.
The name throughout comes from config/identity.py — never hardcoded.

---

## PHASE 4 SCOPE — Electron App + Visual UI + HUD Overlay

### Architecture:

The Electron app runs alongside the Python backend.
Python exposes a local WebSocket server on localhost:8765.
Electron connects and receives real-time state events to drive animations.

Python sends these WebSocket events:
```json
{ "event": "state_change", "state": "LISTENING" }
{ "event": "state_change", "state": "PROCESSING" }
{ "event": "state_change", "state": "EXECUTING", "command": "Opening Chrome" }
{ "event": "state_change", "state": "SPEAKING", "text": "Done." }
{ "event": "state_change", "state": "IDLE" }
{ "event": "waveform", "data": [0.1, 0.4, 0.8, 0.5, ...] }  // amplitude array
{ "event": "task_log", "text": "Sent email to Priya" }
{ "event": "memory", "text": "Remembered: Priya's email is priya@example.com" }
```

### Files to create:

**ui/electron/main.js**
- Main Electron process
- Creates two windows:
  1. Main window: 400x600, frameless, always-on-top optional, draggable
  2. HUD overlay: 280x80, frameless, always-on-top, bottom-right corner, click-through
- Connects to Python WebSocket backend
- System tray integration (icon + right-click menu: Show, Hide, Quit)
- Auto-launches with Windows via electron-builder startup config

**ui/electron/preload.js**
- Exposes safe WebSocket bridge to renderer via contextBridge

**ui/src/App.jsx**
- Root React component
- State: current KIRA state, waveform data, task log array, last spoken text
- Routes between: OrbView (main) and LogView (task history)

**ui/src/components/Orb.jsx**
- The centrepiece. A Three.js animated sphere that reacts to KIRA's state:
  - IDLE: slow dark pulse, dim cyan glow, barely moving
  - LISTENING: bright cyan, fast particle orbit, listening ripple rings
  - PROCESSING: purple swirl, internal glow rotating, thinking shimmer
  - EXECUTING: amber/orange, directional energy beams outward
  - SPEAKING: green waveform wraps the sphere surface, pulses with audio amplitude
- Built with Three.js + custom GLSL shaders for the surface texture
- Smooth lerp transitions between states (no hard cuts)
- Particle system: 400 particles orbiting at varying speeds and radii

**ui/src/components/Waveform.jsx**
- Horizontal voice waveform bar below the orb
- Shows amplitude data from the "waveform" WebSocket event
- Appears only in LISTENING and SPEAKING states
- Animated with canvas, 60fps
- Bars: thin vertical lines, coloured by state (cyan listen, green speak)

**ui/src/components/StatusText.jsx**
- Shows current state label below waveform
- "Listening..." / "Thinking..." / "Executing: Opening Chrome" / "Done."
- Uses ASSISTANT_NAME from a config endpoint
- Subtle fade-in/out on each change

**ui/src/components/TaskLog.jsx**
- Scrolling list of recent KIRA actions (last 20)
- Each entry: timestamp + icon + text
- Icons: 🌐 browser, 📧 email, 📅 calendar, 💻 system, 🧠 memory
- Appears as a slide-up panel when user clicks the orb
- Dismiss by clicking outside

**ui/src/components/HUD.jsx**
- Tiny always-on-top floating window, bottom-right corner
- Shows: pulsing dot (state colour) + KIRA name + last action text
- Click to show/hide main window
- 80% opacity, blurred background
- Never steals focus

**ui/src/styles/theme.js**
- All colours as constants pulled from a config endpoint
- Dark theme only (Phase 4 — light theme optional later):
  ```
  bg: #0D1117
  surface: #161B22
  border: rgba(255,255,255,0.08)
  idle: #30363D
  listening: #00D9F5
  processing: #A78BFA
  executing: #F59E0B
  speaking: #3FB950
  text1: #E6EDF3
  text2: #8B949E
  ```

### Python additions:

**core/ws_server.py**
- Class `WebSocketServer`
- asyncio WebSocket server on localhost:8765
- Receives state change events from KiraLoop and broadcasts to connected Electron clients
- Thread-safe queue between sync Python loop and async WebSocket server

### Update core/loop.py:
- On every state transition, push event to WebSocketServer
- On every TTS word, push waveform amplitude data

### Build & Distribution:
- ui/package.json with electron-builder config
- `npm run build` produces a single .exe
- .exe auto-starts with Windows
- Python backend bundled as subprocess launched by Electron main process
  (so user just double-clicks the .exe — no separate Python needed)

### Design rules:
- Font: Inter for UI text, JetBrains Mono for log entries and code
- No borders that look like windows — everything feels like a floating hologram
- All animations use requestAnimationFrame — never CSS transitions for the orb
- The orb must look EXACTLY like something from a sci-fi film. Reference: Iron Man JARVIS,
  Westworld, Ex Machina. Dark background. Glowing particle core. Responsive to voice.

### Tests:
- tests/test_ws_server.py — WebSocket event delivery
- Manual test checklist in docs/PHASE4_TEST_CHECKLIST.md
