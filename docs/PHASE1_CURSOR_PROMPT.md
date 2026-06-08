# KIRA AI — Phase 1 Cursor Prompt
# After Opus gives you the architecture doc, paste THIS into Cursor (with the arch doc as context).
# This drives Sonnet to implement Phase 1 completely.

---

## CONTEXT

You have the KIRA AI architecture document (produced by Opus). You are now implementing Phase 1.
Always import the assistant name and config from `config/identity.py` — never hardcode "Kira".

## PHASE 1 SCOPE — Core voice loop + basic system commands

Build exactly these files, nothing more:

### Files to create:

**config/identity.py** — already exists, do not modify
**config/settings.py** — all API keys, model names, audio settings, timeouts as constants

**voice/wake.py**
- Class `WakeWordDetector(on_wake: Callable[[], None])`
- Engine-pluggable façade. Reads `settings.WAKE_ENGINE` and instantiates one of:
  - `_OpenWakeWordBackend` (default; uses `openwakeword.Model` with
    `inference_framework=settings.OPENWW_INFER_FW`, model name = `settings.OPENWW_MODEL`,
    detection threshold = `settings.OPENWW_THRESHOLD`). No API key required.
  - `_PorcupineBackend` (only constructed when `WAKE_ENGINE == "porcupine"`; uses
    `pvporcupine.create(access_key=settings.PORCUPINE_ACCESS_KEY,
    keyword_paths=[settings.PORCUPINE_KEYWORD_PATH], sensitivities=[WAKE_SENSITIVITY])`).
    Missing access key is NOT a startup failure unless this engine is active.
- Both backends share the same internal contract: `frame_length` (samples per inference),
  `process(pcm: np.ndarray) -> bool`. The façade owns the PyAudio input stream and feeds
  frames of the right size to the active backend.
- Runs in a daemon thread.
- Emits the `on_wake` callback via a thread-safe queue (not directly from the audio thread).
- Applies `WAKE_COOLDOWN_SEC` debounce after each detection.
- Re-initializes the backend on three consecutive errors; logs and survives.
- Graceful `start()` / `stop()`.
- For Phase 1, the default `WAKE_ENGINE="openwakeword"` and `OPENWW_MODEL="hey_jarvis"`
  are sufficient — no model download or training required, the openWakeWord package
  ships the weights.

**voice/listen.py**
- Class `VoiceListener`
- Records audio after wake word for up to 8 seconds or until silence detected
- Returns raw audio bytes

**voice/transcribe.py**
- Class `Transcriber`
- Loads Whisper "small" model once on startup (not per-request)
- `transcribe(audio_bytes) -> str`

**voice/speak.py**
- Class `Speaker`
- ElevenLabs TTS using voice ID from identity.py
- `say(text: str)` — streams audio, plays immediately
- Falls back to pyttsx3 if ElevenLabs fails

**core/intent.py**
- Class `IntentClassifier`
- Calls Claude API with tool-calling
- System prompt uses ASSISTANT_NAME from identity.py
- Tools defined for Phase 1 commands (see list below)
- Returns structured `Command` dataclass

**core/executor.py**
- Class `CommandExecutor`
- Executes the `Command` returned by IntentClassifier
- Each command is a method: `open_app`, `close_app`, `set_volume`, `set_brightness`,
  `type_text`, `press_keys`, `take_screenshot`, `shutdown`, `restart`, `sleep`, `lock`
- Returns `ExecutionResult(success: bool, message: str)`

**core/clarifier.py**
- Class `Clarifier`
- Checks if a command has all required params
- If not, returns the single most important missing field as a question
- Tracks partial info within a session

**core/loop.py**
- Class `KiraLoop`
- Orchestrates: WakeWordDetector → VoiceListener → Transcriber → IntentClassifier →
  Clarifier (if needed) → CommandExecutor → Speaker
- Implements the full state machine from the architecture doc
- Handles all error cases with spoken error messages

**scripts/startup.py**
- Registers KIRA as a Windows startup application via Task Scheduler
- Can also remove from startup

**main.py**
- Entry point
- Loads all components
- Starts KiraLoop
- System tray icon using pystray (shows name from identity.py)

### Phase 1 commands (tools for intent classifier):

1. open_app(app_name: str)
2. close_app(app_name: str)
3. set_volume(level: int | direction: str)  — level 0-100 or "up"/"down"/"mute"
4. set_brightness(level: int | direction: str)
5. type_text(text: str)
6. press_keys(keys: list[str])  — e.g. ["ctrl", "c"]
7. take_screenshot()
8. scroll(direction: str, amount: int)
9. shutdown_pc(confirmed: bool)
10. restart_pc(confirmed: bool)
11. sleep_pc()
12. lock_pc()
13. calculate(expression: str)
14. set_timer(duration_seconds: int, label: str)
15. unknown_command()  — when KIRA doesn't understand

### Requirements:
- All spoken text uses ASSISTANT_NAME from identity.py
- Confirmation required before shutdown/restart (KIRA asks "Are you sure you want to shut down?")
- If `calculate` result is clean, KIRA speaks it naturally ("That's 127 dollars and 50 cents")
- Log every command to `logs/kira.log` with timestamp
- Unit test every executor method in `tests/test_executor.py`

### Do not build in Phase 1:
- Browser control (Phase 2)
- Email / Calendar (Phase 2)
- Memory / pgvector (Phase 3)
- LangGraph agents (Phase 3)
- Electron UI (Phase 4)

## DELIVERABLE

Complete, runnable Python code for all files above.
Include a `requirements.txt` with exact versions.
Include inline comments explaining non-obvious decisions.
The loop must run on `python main.py` with no errors.
