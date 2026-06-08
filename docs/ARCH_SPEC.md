# KIRA AI — Architecture Specification

> **Status:** Canonical. This is the single source of truth for all implementation.
> **Author role:** Senior AI Systems Architect (Claude Opus 4)
> **Audience:** Claude Sonnet (implementation), Rajaram Yadav (owner)
> **Rule:** Sonnet must not invent files, fields, or behaviors not listed here. If a need
> arises that this spec does not cover, raise it explicitly before coding.

---

## 0. Conventions & Ground Rules

These rules apply to **every** file in the project. Violations are bugs.

1. **Naming.** The assistant's name, wake word, voice id, and canned utterances live **only** in
   `config/identity.py`. No file may contain the literal string `"Kira"` outside that file.
   Every module that mentions the assistant by name imports `ASSISTANT_NAME` and interpolates it.
2. **No magic globals.** All API keys, model names, timeouts, paths, and tunables live in
   `config/settings.py`. Modules import constants; they never read `os.getenv` directly.
3. **Logging.** Every module gets a `logging.getLogger(__name__)` logger. No `print()` in
   production paths. The root logger is configured in `main.py` before any other import that
   could log.
4. **Errors are spoken.** Any exception that escapes a state handler must be caught by the
   loop and rendered as a short spoken sentence via `Speaker`. The loop never crashes silently.
5. **Threading model.** One background thread for wake-word polling. Everything else runs on
   the main loop's async-style sequential pipeline. No shared mutable state between threads
   except a thread-safe wake-event queue.
6. **Determinism in tests.** Anything network-bound (Claude, ElevenLabs, Gmail, Calendar,
   pgvector, OpenWeather) is wrapped in a small client class with an interface so tests can
   inject fakes. No direct SDK calls from agents.
7. **venv is required.** The project uses a Python virtual environment at `./.venv/`.
   `requirements.txt` is the lockfile of intent; the contract is "fresh `python -m venv .venv`,
   activate, `pip install -r requirements.txt` → runnable".
8. **Windows-first.** All paths use `pathlib.Path`. All shell calls go through
   `subprocess.run` with `shell=False` and an explicit argument list. No `os.system`.
9. **Confirm before destruction.** Any action that deletes, sends, shuts down, restarts, or
   modifies external state must pass through the CONFIRMING state with a spoken yes/no prompt.
10. **One assistant turn = one log line per state.** State transitions are observable.

---

## 1. Module Map

The complete file tree. Every file has exactly one responsibility. Imports flow downward
(higher-level modules import lower-level ones, never the reverse).

### 1.1 Tree

```
kira-ai/
├── main.py                          # Entry point. Sets up logging, starts KiraLoop.
├── requirements.txt
├── .env / .env.example
├── .gitignore
├── README.md
│
├── config/
│   ├── __init__.py
│   ├── identity.py                  # ASSISTANT_NAME and all rename-sensitive strings.
│   ├── settings.py                  # All env-driven config + tunables.
│   ├── prompts.py                   # Claude system prompt templates.
│   └── google_credentials.json      # (gitignored) OAuth client secrets.
│
├── voice/
│   ├── __init__.py
│   ├── wake.py                      # WakeWordDetector (engine-pluggable: openWakeWord | Porcupine).
│   ├── listen.py                    # VoiceListener (record-until-silence).
│   ├── transcribe.py                # Transcriber (Whisper, loaded once).
│   ├── speak.py                     # Speaker (ElevenLabs primary, pyttsx3 fallback).
│   └── audio_io.py                  # Shared audio device discovery & sample-rate consts.
│
├── core/
│   ├── __init__.py
│   ├── state.py                     # State enum + StateContext dataclass.
│   ├── loop.py                      # KiraLoop — the state machine.
│   ├── intent.py                    # IntentClassifier (Claude tool-calling).
│   ├── clarifier.py                 # Clarifier (partial-info tracking).
│   ├── confirmer.py                 # Confirmer (destructive-action gate).
│   ├── executor.py                  # CommandExecutor (dispatches Command → Agent).
│   ├── session.py                   # SessionContext (per-session memory & references).
│   ├── tools.py                     # Tool schema definitions (single source for intent).
│   ├── responder.py                 # ResponseFormatter (turns ExecutionResult → speech).
│   ├── errors.py                    # Typed exceptions: KiraError, ToolError, etc.
│   └── ws_server.py                 # (Phase 4) WebSocket bridge for Electron UI.
│
├── agents/
│   ├── __init__.py
│   ├── base.py                      # Agent ABC: execute(command) -> ExecutionResult.
│   ├── system_agent.py              # Phase 1: apps, volume, brightness, keys, power.
│   ├── browser_agent.py             # Phase 2: Playwright-driven Chrome.
│   ├── email_agent.py               # Phase 2: Gmail API.
│   ├── calendar_agent.py            # Phase 2: Google Calendar API.
│   ├── file_agent.py                # Phase 2: file CRUD + search.
│   ├── web_agent.py                 # Phase 2: web search + weather + time.
│   ├── developer_agent.py           # Phase 3: terminal, git, IDE launchers.
│   ├── whatsapp_agent.py            # Phase 3: WhatsApp Web automation.
│   ├── task_agent.py                # Phase 3: task list CRUD.
│   ├── reminder_agent.py            # Phase 3: timer + scheduled reminders.
│   └── orchestrator.py              # Phase 3: LangGraph multi-step planner.
│
├── memory/
│   ├── __init__.py
│   ├── store.py                     # MemoryStore — pgvector reads/writes.
│   ├── embedder.py                  # OpenAI embedding client (text-embedding-3-small).
│   ├── session_log.py               # SessionLog — rolling turns in-process.
│   ├── retrieval.py                 # Hybrid retrieval (semantic + recency + keyword).
│   └── schema.sql                   # DDL for memories, sessions, turns, contacts, tasks.
│
├── integrations/
│   ├── __init__.py
│   ├── claude_client.py             # Thin Anthropic wrapper, tool-call helper, retries.
│   ├── elevenlabs_client.py         # TTS streaming client.
│   ├── google_auth.py               # OAuth2 flow, token refresh.
│   ├── openweather.py               # Weather API wrapper.
│   ├── duckduckgo.py                # Web search wrapper.
│   ├── openwakeword_wrapper.py      # openWakeWord adapter (default wake engine).
│   └── porcupine_wrapper.py         # Porcupine adapter (optional fallback engine).
│
├── ui/
│   ├── __init__.py
│   ├── tray.py                      # pystray system-tray icon (Show/Hide/Quit).
│   └── electron/                    # Phase 4 — separate npm project.
│       ├── package.json
│       ├── main.js                  # Electron main process.
│       ├── preload.js
│       ├── renderer/
│       │   ├── index.html
│       │   ├── index.tsx
│       │   ├── components/
│       │   │   ├── Orb.tsx          # Three.js orb.
│       │   │   ├── Waveform.tsx
│       │   │   ├── StatusText.tsx
│       │   │   ├── TaskLog.tsx
│       │   │   └── HudOverlay.tsx
│       │   └── ws/                  # WebSocket client.
│       └── electron-builder.yml
│
├── scripts/
│   ├── startup.py                   # Register / unregister with Task Scheduler.
│   ├── setup_memory.py              # Apply schema.sql against the local DB.
│   ├── setup_google_auth.py         # Run OAuth flow, persist token.
│   ├── test_mic.py                  # Sanity check audio device.
│   └── download_whisper.py          # Pre-download Whisper model weights.
│
├── docker/
│   └── docker-compose.yml           # PostgreSQL + pgvector (port 5432).
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # Fixtures + fake clients.
│   ├── test_identity.py             # Guard: no hardcoded "Kira" outside identity.py.
│   ├── test_state_machine.py
│   ├── test_intent.py               # Uses recorded Claude responses.
│   ├── test_clarifier.py
│   ├── test_executor.py
│   ├── test_email_agent.py
│   ├── test_calendar_agent.py
│   ├── test_file_agent.py
│   ├── test_memory.py
│   ├── test_orchestrator.py
│   └── test_context.py
│
├── docs/
│   ├── ARCH_SPEC.md                 # ← this document.
│   ├── OPUS_ARCHITECTURE_PROMPT.md
│   ├── PHASE1_CURSOR_PROMPT.md … PHASE4_CURSOR_PROMPT.md
│   ├── CHECKLIST.md
│   ├── TEST_CHECKLIST.md
│   └── README_FULL.md
│
└── logs/                            # (gitignored) Runtime logs.
```

### 1.2 Module Responsibilities

For each non-trivial module: **purpose**, **public API**, **imports (in)**, **consumers (out)**.

#### `config/identity.py`
- **Purpose:** Single mutable surface for renaming the assistant.
- **Public:** `ASSISTANT_NAME`, `ASSISTANT_WAKE_WORD`, `ASSISTANT_VOICE_ID`,
  `ASSISTANT_GREETING`, `ASSISTANT_STANDBY`, `ASSISTANT_ERROR`, `ASSISTANT_CONFIRM`,
  `ASSISTANT_CLARIFY`, `OWNER_NAME`, `TIMEZONE`.
- **In:** none.
- **Out:** Imported by `settings.py`, `prompts.py`, `loop.py`, `responder.py`, `speak.py`,
  `tray.py`, `ws_server.py`, Electron via `/config` HTTP endpoint.
- **Rule:** All canned strings here use f-strings referencing `ASSISTANT_NAME` so renaming
  cascades. **The current file has `ASSISTANT_GREETING = f"Good morning! Kira is online and
  ready."` — this is a latent rename bug. Sonnet must fix it to reference
  `{ASSISTANT_NAME}`.**

#### `config/settings.py`
- **Purpose:** Resolve env vars and numeric tunables.
- **Public:** all constants from the current file plus:
  `WHISPER_LANGUAGE = None` (auto-detect — owner speaks English / Hinglish / Maithili /
  Nepali; explicit `"en"` would break the others),
  `WHISPER_MODEL_SIZE = "medium"` (small is unreliable for Maithili/Nepali; medium fits the
  same machine and adds ~1s latency),
  `WAKE_COOLDOWN_SEC = 1.5`, `CLARIFY_MAX_ROUNDS = 2`,
  `STATE_TIMEOUT_RECORDING = 9.0`, `STATE_TIMEOUT_TRANSCRIBING = 8.0`,
  `STATE_TIMEOUT_CLASSIFYING = 20.0`, `STATE_TIMEOUT_EXECUTING = 30.0`,
  `STATE_TIMEOUT_CLARIFYING = 12.0`, `STATE_TIMEOUT_CONFIRMING = 8.0`.
- **In:** `dotenv`, `identity.py` (re-exports `ASSISTANT_NAME` for convenience).
- **Out:** Imported by every module that needs a tunable.

#### `config/prompts.py`
- **Purpose:** All Claude prompts as Python f-strings or template functions. Centralizing
  prompts lets us version them without touching logic code.
- **Public:** `build_intent_system_prompt(session_summary, recent_turns, now_iso)`,
  `build_clarification_prompt(...)`, `build_response_prompt(...)`.
- **In:** `identity.py`.

#### `voice/wake.py`
- **Class:** `WakeWordDetector(on_wake: Callable[[], None])`.
- **API:** `start()`, `stop()`, `is_running -> bool`.
- **Engine pluggability.** The class is a thin façade that selects a backend based on
  `settings.WAKE_ENGINE`:
  - `"openwakeword"` → `_OpenWakeWordBackend` (default; no signup, on-device).
    Loads the model named by `settings.OPENWW_MODEL` (e.g. `"hey_jarvis"`) via the
    `openwakeword.Model` class with `inference_framework=settings.OPENWW_INFER_FW`
    (`"onnx"` on Windows). Polls PCM frames at 16 kHz, fires when the model's score for
    the active wake word exceeds `settings.OPENWW_THRESHOLD`.
  - `"porcupine"` → `_PorcupineBackend`. Uses `pvporcupine.create(...)` with
    `settings.PORCUPINE_ACCESS_KEY` and `settings.PORCUPINE_KEYWORD_PATH`. Only loaded if
    `WAKE_ENGINE == "porcupine"`, so a missing access key is not a startup failure when
    openWakeWord is active.
- **Behavior:** Owns one PyAudio input stream + the active backend instance. Runs in a
  daemon thread. On detection: applies `WAKE_COOLDOWN_SEC` debounce, then calls `on_wake`
  via a thread-safe queue (not directly). Re-initializes the backend on three consecutive
  errors. The `loop.py` consumer is engine-agnostic.
- **Out:** Consumed by `loop.py`.

#### `voice/listen.py`
- **Class:** `VoiceListener(sample_rate, channels, silence_sec, max_sec)`.
- **API:** `record() -> bytes`.
- **Behavior:** Opens its own input stream (the wake thread releases on detection). Uses
  RMS-based VAD: tracks rolling 200ms RMS; stops when RMS stays below
  `noise_floor + 6dB` for `silence_sec`. Hard cap at `max_sec`. Returns 16-bit PCM little-endian.

#### `voice/transcribe.py`
- **Class:** `Transcriber(model_size, language=None)`.
- **API:** `transcribe(audio_bytes) -> TranscriptionResult(text, language, confidence)`.
- **Behavior:** Loads Whisper once in `__init__` (eager). Forces `fp16=False` on CPU,
  `fp16=True` if CUDA is detected. Writes a tempfile WAV for Whisper's CLI-style path
  (it's faster than passing raw arrays for short clips).

#### `voice/speak.py`
- **Class:** `Speaker(voice_id, fallback=True)`.
- **API:** `say(text: str, *, blocking=True)`, `interrupt()`.
- **Behavior:** Streams from ElevenLabs `eleven_turbo_v2`; pipes PCM into `sounddevice`.
  Holds a `threading.Lock` so concurrent `say()` calls serialize. On any HTTP error,
  pyttsx3 fallback. `interrupt()` cancels the current stream (used when wake fires during
  speech in later phases).

#### `core/state.py`
- **Purpose:** Define `class State(Enum)` and `StateContext(BaseModel)` (the data carried
  through the pipeline).
- **States:** `IDLE`, `WAKE_DETECTED`, `RECORDING`, `TRANSCRIBING`, `CLASSIFYING`,
  `CLARIFYING`, `CONFIRMING`, `EXECUTING`, `RESPONDING`, `ERROR`.
- **StateContext fields:** `state: State`, `session_id: str`, `transcript: str | None`,
  `pending_command: Command | None`, `partial_args: dict`, `clarify_round: int`,
  `confirmation_for: Command | None`, `result: ExecutionResult | None`,
  `error_message: str | None`, `started_at: datetime`.

#### `core/loop.py`
- **Class:** `KiraLoop`.
- **API:** `start()`, `stop()`.
- **Behavior:** Owns all subsystems. Implements the state machine defined in §2.
  Publishes every state transition over the internal event bus (Phase 4 wires this to
  WebSocket).

#### `core/intent.py`
- **Class:** `IntentClassifier`.
- **API:** `classify(transcript, session_context) -> IntentResult`.
- **Behavior:** Builds messages with the system prompt from `prompts.py`, declares all
  tools from `tools.py`, calls Claude with `tool_choice={"type": "auto"}`, returns a typed
  `IntentResult`. Has a single retry on 429/5xx with exponential backoff (1s, then 3s).

#### `core/clarifier.py`
- **Class:** `Clarifier`.
- **API:** `check(command, partial_args) -> ClarificationDecision`.
- **Behavior:** For each tool, knows which params are required and which the user "usually
  means" something for. Computes the **single most important missing piece** and returns a
  question string. Caps at `CLARIFY_MAX_ROUNDS`; beyond that escalates to "I didn't quite
  catch that — let's try the whole command again."

#### `core/confirmer.py`
- **Class:** `Confirmer`.
- **API:** `requires_confirmation(command) -> bool`, `confirm(transcript) -> bool | None`.
- **Behavior:** A tool's schema declares `destructive: bool`. The confirmer's `confirm()`
  parses the user's yes/no reply via a tiny Claude call with a strict schema (yes / no /
  unclear). Returns `None` on unclear → loop re-asks once, then aborts.

#### `core/executor.py`
- **Class:** `CommandExecutor`.
- **API:** `execute(command) -> ExecutionResult`.
- **Behavior:** A tool name → agent method routing table. Owns instances of all `Agent`
  subclasses. Wraps every dispatch in a try/except → `ExecutionResult(success=False, ...)`.
  Each agent method has a hard timeout (`STATE_TIMEOUT_EXECUTING`).

#### `core/session.py`
- **Class:** `SessionContext`.
- **API:** `add_turn(transcript, command, result)`, `recent(n) -> list[Turn]`,
  `resolve_pronoun(text) -> str | None`, `set_last_recipient(...)`, etc.
- **Behavior:** In-memory rolling window of the last `SESSION_HISTORY_TURNS` turns.
  Holds last-mentioned entities (last_app, last_recipient, last_file, last_url). Resets on
  process restart **and** when 5 minutes elapse with no activity.

#### `core/tools.py`
- **Purpose:** **The single source of truth for the tool catalog.** Each tool is a
  `Tool(name, description, params, destructive, phases, agent_method)` dataclass.
  `IntentClassifier` produces the Anthropic tool schema from this list. `CommandExecutor`
  uses `agent_method` to dispatch. `Clarifier` reads `params` for required/optional flags.
- **Why:** Adding a tool means editing one file, not three.

#### `core/responder.py`
- **Class:** `ResponseFormatter`.
- **API:** `format(result, command) -> str`.
- **Behavior:** Maps an `ExecutionResult` into a short, natural-language sentence that
  mentions the assistant's voice persona only when contextually appropriate (e.g. errors
  use "I" not the name). For complex outputs (calc results, weather, calendar list) calls
  Claude with a "format this for spoken output" prompt; for simple successes returns a
  template ("Done.", "Opened Chrome.", etc.).

#### Agents — common contract (`agents/base.py`)
```python
class Agent(ABC):
    name: str
    @abstractmethod
    def can_handle(self, tool_name: str) -> bool: ...
    @abstractmethod
    def execute(self, tool_name: str, args: dict) -> ExecutionResult: ...
```
Each agent is stateless except for resources it owns (Playwright browser, Gmail service,
DB connection). Browser, Gmail, Calendar are lazy-initialized on first use.

#### `memory/store.py`
- **Class:** `MemoryStore`.
- **API:** `remember(text, tags=[], scope="long_term")`,
  `recall(query, top_k=5, scope=None) -> list[Memory]`,
  `forget(memory_id)`, `list_recent(n)`.
- **Behavior:** Writes rows into `memories` with the embedding. `recall` runs a hybrid
  query: `(0.7 * cosine_sim) + (0.2 * recency_decay) + (0.1 * tag_match)`.

#### `memory/session_log.py`
- **Class:** `SessionLog`.
- **API:** `append_turn(...)`, `summarize_and_persist()`.
- **Behavior:** Holds an in-process list; on session end (or every N turns), generates a
  one-paragraph summary via Claude and writes it to the `sessions` table.

---

## 2. State Machine

### 2.1 Diagram (canonical)

```
                  ┌──────────────────┐
                  │       IDLE       │◄────────────────────────────┐
                  └──────┬───────────┘                             │
                         │ wake-word callback                       │
                         ▼                                          │
                  ┌──────────────────┐                              │
                  │  WAKE_DETECTED   │  emits acknowledgement chime │
                  └──────┬───────────┘                              │
                         │ immediate                                │
                         ▼                                          │
                  ┌──────────────────┐                              │
                  │     RECORDING    │  silence OR max-sec elapsed  │
                  └──────┬───────────┘                              │
                         │                                          │
                         ▼                                          │
                  ┌──────────────────┐                              │
                  │   TRANSCRIBING   │                              │
                  └──────┬───────────┘                              │
                         │ Whisper returns text                     │
                         ▼                                          │
                  ┌──────────────────┐                              │
                  │   CLASSIFYING    │  Claude tool-call            │
                  └──────┬───────────┘                              │
                         │                                          │
              ┌──────────┼──────────────────┐                       │
              │          │                  │                       │
              ▼          ▼                  ▼                       │
       ┌───────────┐ ┌──────────────┐ ┌─────────────┐               │
       │CLARIFYING │ │ CONFIRMING   │ │  EXECUTING  │               │
       └─────┬─────┘ └──────┬───────┘ └──────┬──────┘               │
             │              │                │                      │
       answer│         yes/no                │                      │
             ▼              ▼                ▼                      │
        (back to        (proceed         ┌─────────────┐            │
         CLASSIFY        or abort)       │  RESPONDING │────────────┘
         w/ partial                      └─────────────┘
         merged)
```

### 2.2 State definitions

Each row: **enter**, **exit**, **timeout (s)**, **on timeout**, **on error**.

| State | Enter from | Exit to | Timeout | On timeout | On error |
|---|---|---|---|---|---|
| **IDLE** | startup, RESPONDING, ERROR | WAKE_DETECTED | ∞ | n/a | Log; stay. |
| **WAKE_DETECTED** | IDLE | RECORDING (immediate) | 0.3 | force RECORDING | Speak `ASSISTANT_ERROR`; → IDLE. |
| **RECORDING** | WAKE_DETECTED | TRANSCRIBING | `STATE_TIMEOUT_RECORDING` (9s) | Stop recording, → TRANSCRIBING with whatever was captured. | Speak "I couldn't hear you."; → IDLE. |
| **TRANSCRIBING** | RECORDING | CLASSIFYING (if text) / IDLE (if empty) | `STATE_TIMEOUT_TRANSCRIBING` (8s) | Speak "Transcription took too long."; → IDLE. | Speak `ASSISTANT_ERROR`; → IDLE. |
| **CLASSIFYING** | TRANSCRIBING, CLARIFYING | CLARIFYING / CONFIRMING / EXECUTING / RESPONDING(unknown) | `STATE_TIMEOUT_CLASSIFYING` (20s) | Speak "I'm having trouble reaching my brain."; → IDLE. | Same as timeout. |
| **CLARIFYING** | CLASSIFYING | CLASSIFYING (after user reply) / IDLE (after max rounds) | `STATE_TIMEOUT_CLARIFYING` (12s, listening for the answer) | Speak "Never mind — try again."; → IDLE. | Speak `ASSISTANT_ERROR`; → IDLE. |
| **CONFIRMING** | CLASSIFYING | EXECUTING (yes) / RESPONDING (no/abort) | `STATE_TIMEOUT_CONFIRMING` (8s) | Treat as "no"; speak "I'll skip it."; → RESPONDING. | Speak `ASSISTANT_ERROR`; → IDLE. |
| **EXECUTING** | CLASSIFYING, CONFIRMING | RESPONDING | `STATE_TIMEOUT_EXECUTING` (30s; some tools override) | Cancel agent; → RESPONDING with timeout result. | → RESPONDING with `ExecutionResult(success=False)`. |
| **RESPONDING** | EXECUTING, CONFIRMING(no) | IDLE | ∞ (bounded by TTS duration) | n/a | Log; → IDLE. |
| **ERROR** | any | IDLE | 0 | n/a | Speak short error; → IDLE. |

### 2.3 Transition rules

- **CLASSIFYING → CLARIFYING** when `IntentResult.command` is set but
  `Clarifier.check(...)` returns a `ClarificationDecision(needs_clarification=True)`.
- **CLARIFYING → CLASSIFYING** when the listener returns text. The new transcript is
  merged into `partial_args` (the loop re-asks Claude with the original command plus the
  partial answer; this keeps multi-round clarification natural).
- **CLASSIFYING → CONFIRMING** when `tools.py` marks the chosen tool `destructive=True`
  **and** the user's transcript does not already contain an unambiguous confirmation
  ("yes do it", "confirmed").
- **CONFIRMING → EXECUTING** when `Confirmer.confirm()` returns `True`.
- **CONFIRMING → RESPONDING(no)** when it returns `False`. The user gets a "Cancelled."
- **CONFIRMING re-ask** when it returns `None` (unclear): loop re-asks once; second
  unclear answer is treated as `False`.

### 2.4 Wake during speech

When `WakeWordDetector` fires while in RESPONDING:
1. `Speaker.interrupt()` is called immediately.
2. The current `StateContext` is dropped.
3. → WAKE_DETECTED.
This is the only legal cross-cutting transition. All other states ignore wake events.

### 2.5 Recovery

On any unhandled exception in the loop's dispatch:
- The exception is logged with full traceback.
- A counter `consecutive_errors` increments.
- If `consecutive_errors >= 3`, the loop pauses for 10 seconds and speaks "I need a
  moment to recover." before resuming.
- Any successful state cycle resets the counter to 0.

---

## 3. Intent Classifier Design

### 3.1 The Claude system prompt

Produced by `prompts.build_intent_system_prompt(...)`. Template:

```text
You are {ASSISTANT_NAME}, a precise voice assistant running on {OWNER_NAME}'s Windows
laptop. You convert the user's spoken request into exactly one tool call.

CRITICAL RULES
- Always call exactly one tool. Never reply in natural language.
- If the user gave you enough info, call the matching tool with all known arguments.
- If a required argument is missing, still call the matching tool, set the missing
  argument(s) to null, and the system will ask the user for it.
- If the request is ambiguous between tools, prefer the safer, less destructive one.
- If the request makes no sense or doesn't map to any tool, call `unknown_command`.
- The user may speak English, Hinglish, Maithili, or Nepali. Treat them all as input;
  return tool names in English.
- Today is {NOW_LOCAL_ISO} ({TIMEZONE}).
- Recent session memory (use only if helpful):
{SESSION_SUMMARY_OR_NONE}
- Last 3 turns:
{RECENT_TURNS_OR_NONE}

DO NOT
- Do not call multiple tools in one response.
- Do not invent arguments that the user didn't say or imply.
- Do not include extra prose. Only the tool call.
```

### 3.2 Tool catalog

Every tool listed below appears in `core/tools.py` as a `Tool(...)` entry. Fields:
`name`, `description`, `params` (with `required`/`type`/`description`), `destructive`,
`phases`, `agent_method`.

**Phase 1 tools** (15) — must work end of Phase 1:

| Name | Required | Optional | Destructive | Notes |
|---|---|---|---|---|
| `open_app` | `app_name` | — | no | |
| `close_app` | `app_name` | — | no | |
| `set_volume` | one of `{level, direction}` | — | no | level 0–100; direction up/down/mute |
| `set_brightness` | one of `{level, direction}` | — | no | |
| `type_text` | `text` | — | no | |
| `press_keys` | `keys` (list[str]) | — | no | e.g. `["ctrl","c"]` |
| `take_screenshot` | — | `target_dir` | no | defaults to Desktop |
| `scroll` | `direction` | `amount` | no | up/down/left/right; amount in "clicks" |
| `shutdown_pc` | — | — | **yes** | |
| `restart_pc` | — | — | **yes** | |
| `sleep_pc` | — | — | no | |
| `lock_pc` | — | — | no | |
| `calculate` | `expression` | — | no | safe-eval only |
| `set_timer` | `duration_seconds` | `label` | no | |
| `unknown_command` | — | `reason` | no | |

**Phase 2 tools** (added):

| Name | Required | Optional | Destructive |
|---|---|---|---|
| `browser_open_url` | `url` | `browser` | no |
| `browser_new_tab` | — | `url` | no |
| `browser_close_tab` | — | — | no |
| `browser_search_google` | `query` | — | no |
| `browser_fill_field` | `field_description, value` | — | no |
| `browser_click` | `element_description` | — | no |
| `browser_scroll` | `direction` | `amount` | no |
| `browser_summarise_page` | — | — | no |
| `email_send` | `to, subject, body` | `cc, bcc, attachments` | **yes** |
| `email_read_latest` | — | `count, from_filter, unread_only` | no |
| `calendar_create_event` | `title, start_iso` | `duration_min, attendees, location, description` | **yes** |
| `calendar_list_events` | `range` (today/week/range) | `range_start, range_end` | no |
| `calendar_delete_event` | `event_id_or_title` | — | **yes** |
| `file_find` | `query` | `root_dir` | no |
| `file_open` | `path_or_name` | — | no |
| `file_create` | `path, content` | — | no |
| `file_delete` | `path` | — | **yes** |
| `file_move` | `src, dst` | — | **yes** |
| `file_list` | `dir` | `pattern` | no |
| `web_search` | `query` | `top_k` | no |
| `weather_for` | `location` | `when` | no |
| `time_in` | `location` | — | no |

**Phase 3 tools** (added):

| Name | Required | Optional | Destructive |
|---|---|---|---|
| `memory_remember` | `text` | `tags` | no |
| `memory_recall` | `query` | `top_k` | no |
| `memory_forget` | `memory_id_or_text` | — | **yes** |
| `terminal_run` | `command` | `cwd` | **yes** |
| `terminal_open` | — | `cwd` | no |
| `ide_open` | `ide` (vscode/cursor) | `path` | no |
| `project_scaffold` | `kind, name` | `path` | no |
| `git_commit_push` | `message` | `path` | **yes** |
| `github_open_repo` | `repo` (owner/name or "this") | — | no |
| `whatsapp_send` | `contact, message` | — | **yes** |
| `whatsapp_read_latest` | `contact` | `count` | no |
| `task_add` | `text` | `due` | no |
| `task_list` | — | `filter` (all/today/overdue) | no |
| `task_complete` | `text_or_id` | — | no |
| `multi_step` | `steps` (list[str]) | — | (per step) |

`multi_step` is the entry point to LangGraph: the planner agent will replan and execute
each step as its own internal tool call, but at the Claude classification layer it is one
tool.

### 3.3 IntentResult

```python
@dataclass
class IntentResult:
    command: Command | None       # None only when Claude failed catastrophically
    raw_tool_name: str
    raw_args: dict
    confidence: float             # heuristic: 1.0 if all required present, else 0.5
    needs_clarification: bool     # set by Clarifier later, not by Claude
```

### 3.4 Retry / fallback

- Network/timeout error → retry once with 1s backoff, then 3s.
- HTTP 4xx that is not 429 → no retry; return `unknown_command(reason="api_error")`.
- Claude returns no tool call (rare with `tool_choice=auto`) → fall through to
  `unknown_command(reason="no_tool_match")`.

---

## 4. Clarification Engine

### 4.1 Decision logic

```
ClarifierDecision = (needs_clarification, missing_field, question_text)
```

For each tool the clarifier knows the **priority order** of required params. Example:

| Tool | Priority order |
|---|---|
| `open_app` | `app_name` |
| `email_send` | `to`, `subject`, `body` |
| `calendar_create_event` | `title`, `start_iso`, `duration_min` |
| `file_create` | `path`, `content` |

The clarifier walks the order, finds the first missing field, and produces a question
using the per-field question templates from `prompts.py`:

```python
QUESTIONS = {
  ("email_send", "to"):       "Who should I send the email to?",
  ("email_send", "subject"):  "What's the subject?",
  ("email_send", "body"):     "What should the email say?",
  ("calendar_create_event", "start_iso"): "When should I schedule it?",
  ...
}
```

### 4.2 Partial info tracking

`StateContext.partial_args` is a `dict[str, Any]` that accumulates across CLARIFYING
rounds. The merged dict is fed back into the next `IntentClassifier.classify()` call as
a synthetic user message:

```
USER (original): "send email to Priya"
KIRA: "What's the subject?"
USER: "Project update"
→ classifier is re-called with both: classify(
      transcript="(original) send email to Priya\n(answer to: subject) Project update",
      session_context=...,
      partial_args={"to": "Priya"}
   )
```

Claude is instructed in the system prompt to merge `partial_args` into its tool call.

### 4.3 Bounds

- `CLARIFY_MAX_ROUNDS = 2` (configurable).
- On round 3, the loop speaks "Let's start over — what would you like me to do?" and
  resets to IDLE without executing anything.
- Per-round listening uses `STATE_TIMEOUT_CLARIFYING`; on listening timeout, abort.

### 4.4 Special clarifications

- **Pronoun resolution.** If the transcript contains `it / him / her / them / that` and
  `SessionContext` has the corresponding last entity, the clarifier substitutes silently
  (no question asked). If not, it asks the canonical question.
- **Ambiguous app name.** `open_app("notes")` could mean Notepad or OneNote. Clarifier
  consults a small built-in synonym table; if still ambiguous, asks: "Did you mean
  Notepad or OneNote?"

---

## 5. Memory Architecture

### 5.1 Two-tier model

- **Session memory** — in-process, ephemeral. Lives in `SessionContext`. Holds the last
  `SESSION_HISTORY_TURNS` turns and recently-mentioned entities. Resets on restart or
  after 5 idle minutes.
- **Long-term memory** — persistent in PostgreSQL + pgvector. Survives restarts. Reasoned
  over via the `memory_remember` / `memory_recall` tools and via background retrieval
  injected into the intent prompt.

### 5.2 Schema (`memory/schema.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memories (
    id            BIGSERIAL PRIMARY KEY,
    text          TEXT NOT NULL,
    embedding     VECTOR(1536) NOT NULL,           -- text-embedding-3-small
    tags          TEXT[]       NOT NULL DEFAULT '{}',
    scope         TEXT         NOT NULL DEFAULT 'long_term',  -- long_term | fact | preference
    source        TEXT         NOT NULL DEFAULT 'user',       -- user | inferred | summary
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_used_at  TIMESTAMPTZ,
    use_count     INTEGER      NOT NULL DEFAULT 0
);
CREATE INDEX memories_embedding_idx ON memories
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX memories_tags_idx ON memories USING GIN (tags);

CREATE TABLE IF NOT EXISTS sessions (
    id            UUID PRIMARY KEY,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at      TIMESTAMPTZ,
    summary       TEXT
);

CREATE TABLE IF NOT EXISTS session_turns (
    id            BIGSERIAL PRIMARY KEY,
    session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    turn_index    INTEGER NOT NULL,
    transcript    TEXT,
    tool_name     TEXT,
    tool_args     JSONB,
    result_ok     BOOLEAN,
    result_msg    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT,
    phone         TEXT,
    relation      TEXT,                              -- "friend", "colleague"
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS tasks (
    id            BIGSERIAL PRIMARY KEY,
    text          TEXT NOT NULL,
    due_at        TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminders (
    id            BIGSERIAL PRIMARY KEY,
    text          TEXT NOT NULL,
    fire_at       TIMESTAMPTZ NOT NULL,
    fired         BOOLEAN NOT NULL DEFAULT false
);
```

### 5.3 Retrieval strategy

`MemoryStore.recall(query, top_k=5)`:

1. Embed the query.
2. Top-50 candidates by cosine similarity.
3. Re-rank with `score = 0.7·cosine + 0.2·recency + 0.1·tag_overlap`, where `recency` is
   `exp(-Δdays / 30)` against `last_used_at` (fallback `created_at`).
4. Return top `MEMORY_TOP_K`. Update `last_used_at` and increment `use_count` on each
   returned row.

### 5.4 What gets stored automatically

Without an explicit `memory_remember`:
- Per-session **summary** (one paragraph generated at session end).
- **Inferred facts** flagged by Claude in the tool args (Phase 3+: a hidden
  `memory_hint` field on every tool call that the intent classifier may populate, e.g.
  "Priya is Rajaram's sister").

### 5.5 Injection into the intent prompt

At the start of each CLASSIFYING turn the loop calls
`MemoryStore.recall(transcript, top_k=3)` and injects the resulting bullet points into
the `{SESSION_SUMMARY_OR_NONE}` slot of the intent system prompt. This is the path by
which "Do you remember Priya's number?" works without an explicit recall tool call.

---

## 6. Startup Sequence

Exact order. Each step that can fail has a fallback. Steps marked **fatal** abort startup
with a spoken (pyttsx3 if needed) error message.

```
1.  Process start (main.py)
2.  Ensure ./logs exists. Configure root logger → file + stdout.        [fatal on FS error]
3.  Import config.identity, config.settings, config.prompts.            [fatal]
4.  Validate required env vars for the active phase (Phase N).          [fatal if missing]
       Phase 1: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, PORCUPINE_ACCESS_KEY
       Phase 2: + GOOGLE_CREDS file, OPENWEATHER_API_KEY
       Phase 3: + OPENAI_API_KEY, DATABASE_URL reachable
5.  Probe audio input device (sounddevice.query_devices).               [fatal]
6.  Initialise voice.transcribe.Transcriber (loads Whisper model).      [warn; offer retry]
7.  Initialise voice.speak.Speaker. Health-check ElevenLabs with a
    1-token dummy call; on failure mark fallback active.                [warn]
8.  Initialise integrations.claude_client.ClaudeClient.
    Ping with a no-op message (≤5 tokens).                              [fatal]
9.  Phase 2+: initialise integrations.google_auth (refresh token).      [warn]
10. Phase 3+: connect to Postgres; SELECT 1; if fail, skip memory but
    warn. Run schema migration check.                                   [warn]
11. Initialise core.session.SessionContext (new session row).
12. Initialise agents (lazy where possible — Playwright not started
    until first browser command).
13. Initialise core.executor.CommandExecutor.
14. Initialise voice.wake.WakeWordDetector (does NOT start yet).        [fatal]
15. Start ui.tray.SystemTray (icon + name from identity.py).
16. Phase 4: start core.ws_server.WebSocketServer on WS_PORT.
17. Speak ASSISTANT_GREETING.
18. KiraLoop.start() → enters IDLE, starts wake detector thread.
```

The whole sequence is wrapped in a `try/except` that, on fatal failure, writes the error
to `logs/startup.log` and speaks one of three short canned errors via pyttsx3
("I can't reach my brain.", "I can't hear anything.", "I can't speak right now.") then
exits with code 1.

---

## 7. Configuration System

### 7.1 Propagation rules

- `config/identity.py` is the **only** mutable name surface.
- `config/settings.py` imports from `identity.py` for `ASSISTANT_NAME` and re-exports it
  for convenience. **It must not redeclare names.**
- All canned strings in `identity.py` use f-strings against `ASSISTANT_NAME` so that
  changing the name updates greetings and confirmations atomically.
- No other file may contain the literal substring `Kira` (case-insensitive). Enforced by
  `tests/test_identity.py`:
  ```python
  def test_no_hardcoded_name(repo_root):
      offenders = grep_repo(r"\bkira\b", ignore_paths=[
          "config/identity.py", "docs/", ".git/", "logs/", "tests/", "docker/"
      ])
      assert not offenders, f"Hardcoded name in: {offenders}"
  ```
- Phase 4 Electron reads the name from a tiny HTTP endpoint exposed by `core/ws_server.py`:
  `GET /config` → `{"name": "...", "version": "..."}`. The renderer references it from
  React state; **no hardcoded strings in JSX.**

### 7.2 Renaming procedure

1. Open `config/identity.py`.
2. Change `ASSISTANT_NAME = "Aria"` (and the `.ppn` keyword path on disk).
3. Update `ASSISTANT_WAKE_WORD = "hey aria"` (must match the keyword file).
4. Restart KIRA.
5. `tests/test_identity.py` continues to pass (the test ignores `identity.py`).

### 7.3 Sensitive values

- `.env` is gitignored; `.env.example` documents the required keys.
- `config/google_token.json` and `config/google_credentials.json` are gitignored.
- `logs/` is gitignored.

---

## 8. Phase Boundaries

### Phase 1 — Voice loop + system commands
- All of §1.1 except `agents/{browser,email,calendar,file,web,developer,whatsapp,task,
  reminder,orchestrator}_agent.py`.
- All Phase 1 tools (15).
- State machine fully functional.
- Clarifier and Confirmer fully functional.
- ElevenLabs + pyttsx3 fallback.
- System tray.
- `scripts/startup.py` registers with Task Scheduler.
- Tests: `test_identity.py`, `test_state_machine.py`, `test_intent.py`,
  `test_clarifier.py`, `test_executor.py`.

### Phase 2 — Browser, Email, Calendar, Files, Web Search, Weather
- Adds: `browser_agent`, `email_agent`, `calendar_agent`, `file_agent`, `web_agent`.
- Phase 2 tools.
- `setup_google_auth.py` script flow.
- Playwright `chromium install` step documented in README.
- Tests: `test_email_agent.py`, `test_calendar_agent.py`, `test_file_agent.py`.

### Phase 3 — Memory, Multi-step, Developer, WhatsApp, Tasks
- Adds Postgres + pgvector via docker-compose.
- Adds: `memory/*`, `developer_agent`, `whatsapp_agent`, `task_agent`, `reminder_agent`,
  `orchestrator.py` (LangGraph).
- Phase 3 tools.
- SessionContext now persists summaries via `SessionLog.summarize_and_persist()`.
- Tests: `test_memory.py`, `test_orchestrator.py`, `test_context.py`.

### Phase 4 — Electron + Visual Layer
- Adds: `core/ws_server.py`, `ui/electron/*`.
- Loop emits state-change + waveform events over WebSocket.
- Three.js orb, Waveform, StatusText, TaskLog, HUD overlay components.
- `electron-builder` produces a Windows `.exe` that spawns Python as a subprocess and
  registers itself for startup (replacing the Task Scheduler hook from Phase 1, which is
  uninstalled on Electron install).

**Phase guard rule:** No file outside a phase's scope may be created. Sonnet must reject
prompts that ask for cross-phase work and request a phase-boundary review first.

---

## 9. Integration Contracts

The exact shapes that flow between modules. These are the **types Sonnet must use**.

### 9.1 Command / ExecutionResult

```python
# core/state.py
@dataclass
class Command:
    tool_name: str
    args: dict                          # validated against tools.py schema
    destructive: bool                   # cached from Tool definition
    requires_confirmation: bool         # destructive AND not pre-confirmed in transcript

@dataclass
class ExecutionResult:
    success: bool
    message: str                        # short, spoken-friendly
    data: dict | None = None            # tool-specific structured payload
    error_kind: str | None = None       # "timeout" | "permission" | "not_found" | ...
```

### 9.2 IntentClassifier ↔ Clarifier ↔ Loop

```python
@dataclass
class IntentResult:
    command: Command | None
    raw_tool_name: str
    raw_args: dict

@dataclass
class ClarificationDecision:
    needs_clarification: bool
    missing_field: str | None
    question: str | None                # spoken question
```

### 9.3 WakeWordDetector → Loop

```python
class WakeWordDetector:
    def __init__(self, on_wake: Callable[[], None], keyword_path: str, access_key: str): ...
    def start(self) -> None: ...
    def stop(self) -> None: ...
```
`on_wake` is invoked from a non-audio thread (the detector marshals it via an
`queue.Queue` that the loop polls).

### 9.4 Loop → Speaker

```python
class Speaker:
    def say(self, text: str, *, blocking: bool = True) -> None: ...
    def interrupt(self) -> None: ...
```

### 9.5 Executor → Agent (base)

```python
class Agent(ABC):
    name: ClassVar[str]
    def can_handle(self, tool_name: str) -> bool: ...
    def execute(self, tool_name: str, args: dict) -> ExecutionResult: ...
```
`CommandExecutor` holds `agents: list[Agent]` and dispatches to the first one whose
`can_handle` returns True. If none match → `ExecutionResult(success=False,
error_kind="no_agent")`.

### 9.6 Memory contracts

```python
@dataclass
class Memory:
    id: int
    text: str
    tags: list[str]
    score: float                        # populated by recall()
    created_at: datetime

class MemoryStore:
    def remember(self, text: str, *, tags: list[str] = (), scope: str = "long_term") -> int: ...
    def recall(self, query: str, *, top_k: int = 5) -> list[Memory]: ...
    def forget(self, memory_id: int) -> bool: ...
```

### 9.7 WebSocket protocol (Phase 4)

`core/ws_server.py` broadcasts JSON messages on a single channel:

```json
{ "type": "state",    "state": "LISTENING",          "ts": 169... }
{ "type": "wave",     "amplitude": 0.34,             "ts": 169... }
{ "type": "status",   "text": "Opening Chrome...",   "ts": 169... }
{ "type": "tool",     "name": "open_app", "args": { "app_name": "Chrome" } }
{ "type": "result",   "success": true, "message": "Opened Chrome." }
{ "type": "config",   "name": "Kira", "version": "0.4.0" }    // on connect
```

Renderer drives all visuals from these events. Electron does not call Python; it only
listens.

---

## 10. Risk List — Top 10

Ranked by likelihood × impact. Each risk has a **detection signal** and a **mitigation**.

1. **Wake word false negatives in noisy environments.**
   *Signal:* User says the wake phrase repeatedly. *Mitigation:* Tune the active engine's
   threshold — `OPENWW_THRESHOLD` (default 0.5) for openWakeWord, `WAKE_SENSITIVITY` for
   Porcupine. Ship `scripts/test_wake.py` to print live detection scores so the owner can
   calibrate. If openWakeWord's `hey_jarvis` model proves unreliable for the owner's
   accent, train a custom "hey kira" openWakeWord model in Colab (~45 min) and point
   `OPENWW_MODEL` at the resulting `.tflite` path.

2. **Whisper picks the wrong language for Hinglish.**
   *Signal:* Transcript is gibberish or pure Devanagari for a clearly English-leaning
   sentence. *Mitigation:* `WHISPER_LANGUAGE = None` (auto-detect) **and** force model
   size `medium`. For known-Hinglish commands ("WhatsApp pe message bhejo"), the intent
   prompt is bilingual so Claude can still understand even if Whisper returns
   transliterated text.

3. **ElevenLabs rate-limit or outage.**
   *Signal:* `Speaker` hits HTTP 429 or 5xx. *Mitigation:* Automatic pyttsx3 fallback,
   triggered on first failure of the session; reset every 5 minutes so we re-try
   ElevenLabs. Log fallback events; alert in tray icon tooltip.

4. **Claude tool-call returns invalid args.**
   *Signal:* `args` missing required fields not declared in `tools.py`, or has extra
   keys. *Mitigation:* `IntentClassifier` validates args against the tool's pydantic
   model; on failure, treat as `unknown_command(reason="schema_violation")` and speak a
   "I didn't quite get that" response. Capture the bad payload in logs.

5. **Confirmation parsing is ambiguous ("yeah no", "uhh sure").**
   *Signal:* `Confirmer.confirm()` returns `None` twice. *Mitigation:* Treat as
   cancellation; speak "I'll skip it to be safe."

6. **PyAutoGUI typing into the wrong window.**
   *Signal:* User reports "Kira typed into my game / sensitive app." *Mitigation:*
   `type_text` and `press_keys` require the active window to be checked via
   `pygetwindow.getActiveWindow()`; if its title matches a denylist (`["lsass",
   "windows security", ...]`), refuse and speak "I can't type into that window."

7. **Google OAuth token expiration without refresh.**
   *Signal:* Email/Calendar requests fail with `invalid_grant`. *Mitigation:* All API
   wrappers run `creds.refresh()` on `RefreshError` automatically; if refresh fails,
   speak "I need to reconnect to Google — please run setup again." and disable the
   affected tools for the session.

8. **Playwright headed browser captures focus mid-conversation.**
   *Signal:* User's keyboard input goes to the browser instead of the listener.
   *Mitigation:* Browser starts with `--no-startup-window` and `bring_to_front=False`;
   only foregrounds when explicitly told via `browser_focus` (not exposed as a tool —
   internal only). After a browser command finishes, restore prior foreground window via
   `pygetwindow.getActiveWindow()` snapshot taken before launch.

9. **Postgres unreachable on Phase 3+ startup.**
   *Signal:* `SELECT 1` fails. *Mitigation:* Startup proceeds in **degraded mode** —
   memory tools speak "I can't reach my memory right now"; all other tools work.
   Detected via a one-time probe; not re-tried during the session.

10. **Multi-step orchestrator infinite loops.**
    *Signal:* LangGraph step count exceeds 8 without completion. *Mitigation:* Hard cap
    of 8 steps per `multi_step` invocation; on cap, speak "I made some progress but
    couldn't finish — here's what I did:" followed by the partial result. Log full
    LangGraph trace.

---

## 11. Appendices

### 11.1 Answer to the question on line 18 of the prompt

> "I think you are going to use venv right?"

Yes. The project uses `python -m venv .venv` at the repository root. `.venv/` is in
`.gitignore`. The Phase 1 prompt for Sonnet must include:
```
python -m venv .venv
.venv\Scripts\activate           # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
playwright install chromium      # Phase 2 only
```
Conda is not used; uv/poetry are not used. Plain venv keeps the Task Scheduler hook in
Phase 1 trivial (one absolute path to `.venv\Scripts\python.exe`).

### 11.2 Scaffolding adjustments (applied — historical record)

These corrections were made to the repo before Phase 1 began. Sonnet should treat them
as already in place; do not "fix" them again.

1. **`config/identity.py`** — `ASSISTANT_GREETING` and `ASSISTANT_STANDBY` now reference
   `{ASSISTANT_NAME}` via f-strings (previously contained a hardcoded `"Kira"`). Added
   `ASSISTANT_OFFLINE`. `ASSISTANT_WAKE_WORD` set to `"hey jarvis"` to match the active
   openWakeWord model; an inline comment explains how to swap to a custom "hey kira"
   model later.
2. **`config/settings.py`** — `WHISPER_MODEL_SIZE = "medium"` (was `"small"`),
   `WHISPER_LANGUAGE = None` (was `"en"`), state-machine timeout constants added,
   `WAKE_SENSITIVITY` / `WAKE_COOLDOWN_SEC` added.
3. **`config/settings.py` — wake-engine selector.** Added `WAKE_ENGINE` (default
   `"openwakeword"`, also accepts `"porcupine"`) plus `OPENWW_MODEL`,
   `OPENWW_THRESHOLD`, `OPENWW_INFER_FW`. `PORCUPINE_ACCESS_KEY` and
   `PORCUPINE_KEYWORD_PATH` retained as optional fallback constants.
4. **`requirements.txt`** — added `openwakeword>=0.6.0` and `onnxruntime>=1.17.0`
   (primary engine); kept `pvporcupine>=3.0.0` (optional fallback). Added
   `pydantic-settings>=2.0` (tool-arg validation) and `tenacity>=8.0` (retry decorators).
5. **`.env.example` / `.env`** — `PORCUPINE_ACCESS_KEY` commented out and labelled
   optional; only `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` are required to start
   Phase 1.
6. **`.gitignore`** — extended to cover `.venv/`, `ui/electron/node_modules/`,
   `ui/electron/dist/`, `ui/electron/out/` in addition to the pre-existing entries.

### 11.3 Non-goals (Phase 1–4)

- **Mobile.** No iOS/Android client.
- **Cloud sync of memory.** Memory stays local.
- **Voice cloning / custom training.** Use ElevenLabs preset voice.
- **Always-on cloud STT.** Whisper stays local.
- **Multi-user.** Single-owner assistant tied to `OWNER_NAME`.

---

## 12. Implementation directive for Sonnet

When Sonnet receives a phase prompt + this spec:

1. **Read this spec entirely before writing any code.** If anything in the phase prompt
   contradicts this spec, this spec wins.
2. **Do not create files outside §1.1.** If you think you need a new file, say so and
   wait.
3. **Use the types in §9 verbatim.** Do not rename `Command`, `ExecutionResult`,
   `IntentResult`, `ClarificationDecision`, `Memory`.
4. **Use `config/tools.py` as the single source for tool definitions.** Adding a tool =
   adding one entry there; the intent prompt and executor pick it up automatically.
5. **Every spoken sentence references `ASSISTANT_NAME` only via import.**
6. **Every PR-sized change must pass `tests/test_identity.py`.**

End of specification.
