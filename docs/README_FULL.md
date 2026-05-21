# KIRA AI — Project README
# Personal voice-controlled AI assistant. Sanskrit-rooted. Globally named. Fully yours.
# Rename at any time: change ASSISTANT_NAME in config/identity.py — nothing else needed.

---

## Directory Structure

```
kira-ai/
│
├── config/
│   ├── identity.py          ← RENAME HERE. Single source of truth for name/voice/personality.
│   ├── settings.py          ← API keys, model names, timeouts, audio settings
│   └── google_token.json    ← Auto-generated after OAuth setup (gitignored)
│
├── core/
│   ├── loop.py              ← Main state machine. Orchestrates everything.
│   ├── intent.py            ← Claude API tool-calling intent classifier
│   ├── executor.py          ← Executes system commands (Phase 1)
│   ├── clarifier.py         ← Asks for missing info before executing
│   └── ws_server.py         ← WebSocket server for Electron UI (Phase 4)
│
├── voice/
│   ├── wake.py              ← Porcupine wake word detector ("Hey Kira")
│   ├── listen.py            ← Records audio after wake word
│   ├── transcribe.py        ← Whisper STT (local, private)
│   └── speak.py             ← ElevenLabs TTS with pyttsx3 fallback
│
├── agents/
│   ├── browser_agent.py     ← Playwright browser control (Phase 2)
│   ├── email_agent.py       ← Gmail API (Phase 2)
│   ├── calendar_agent.py    ← Google Calendar API (Phase 2)
│   ├── file_agent.py        ← File system operations (Phase 2)
│   ├── web_agent.py         ← Search + weather (Phase 2)
│   ├── orchestrator.py      ← LangGraph multi-step agent (Phase 3)
│   ├── developer_agent.py   ← Terminal, VS Code, Git (Phase 3)
│   ├── whatsapp_agent.py    ← WhatsApp Web via Playwright (Phase 3)
│   └── task_agent.py        ← Local task list (Phase 3)
│
├── memory/
│   ├── store.py             ← PostgreSQL + pgvector long-term memory (Phase 3)
│   └── context.py           ← In-session context tracker (Phase 3)
│
├── integrations/
│   └── google_auth.py       ← Shared OAuth2 helper for Gmail + Calendar
│
├── ui/
│   ├── electron/
│   │   ├── main.js          ← Electron main process (Phase 4)
│   │   └── preload.js       ← Context bridge
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── Orb.jsx      ← Three.js animated AI orb (Phase 4)
│       │   ├── Waveform.jsx ← Voice waveform visualiser
│       │   ├── StatusText.jsx
│       │   ├── TaskLog.jsx
│       │   └── HUD.jsx      ← Floating always-on-top overlay
│       └── styles/
│           └── theme.js
│
├── memory/
│   └── tasks.json           ← Local task list storage
│
├── docker/
│   └── docker-compose.yml   ← PostgreSQL + pgvector (Phase 3)
│
├── scripts/
│   ├── startup.py           ← Register/unregister Windows startup
│   ├── setup_google_auth.py ← Walk through Gmail + Calendar OAuth
│   ├── setup_memory.py      ← Create DB tables + pgvector extension
│   └── reset_memory.py      ← Wipe all memories (with confirmation)
│
├── tests/
│   ├── test_executor.py
│   ├── test_email_agent.py
│   ├── test_calendar_agent.py
│   ├── test_browser_agent.py
│   ├── test_file_agent.py
│   ├── test_memory.py
│   ├── test_orchestrator.py
│   ├── test_developer_agent.py
│   ├── test_context.py
│   └── test_ws_server.py
│
├── logs/
│   └── kira.log             ← All commands logged with timestamp
│
├── docs/
│   ├── OPUS_ARCHITECTURE_PROMPT.md   ← Paste into Opus 4 FIRST
│   ├── PHASE1_CURSOR_PROMPT.md       ← Paste into Cursor for Phase 1
│   ├── PHASE2_CURSOR_PROMPT.md       ← Paste into Cursor for Phase 2
│   ├── PHASE3_CURSOR_PROMPT.md       ← Paste into Cursor for Phase 3
│   ├── PHASE4_CURSOR_PROMPT.md       ← Paste into Cursor for Phase 4
│   ├── CHECKLIST.md                  ← Phase-by-phase build checklist
│   └── TEST_CHECKLIST.md             ← Full test checklist before each phase ships
│
├── main.py                  ← Entry point. Run this.
├── requirements.txt         ← Python dependencies
├── .env.example             ← Template for API keys
├── .gitignore
└── README.md                ← This file
```

---

## Quickstart

```bash
# 1. Clone and enter
git clone https://github.com/Yrajaram112/kira-ai
cd kira-ai

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and fill in API keys
cp .env.example .env

# 5. Set up Google OAuth (Gmail + Calendar)
python scripts/setup_google_auth.py

# 6. Register startup (optional)
python scripts/startup.py --install

# 7. Run
python main.py
```

---

## Renaming

To rename KIRA to anything else:

1. Open `config/identity.py`
2. Change `ASSISTANT_NAME = "Kira"` to your new name
3. Change `ASSISTANT_WAKE_WORD = "hey kira"` to match
4. Download the matching Porcupine keyword file for your new wake word
5. Done. Every module reads from this file.

---

## Cost

| Service           | Cost         | Notes                          |
|-------------------|--------------|-------------------------------|
| Whisper STT       | Free         | Runs locally, fully private    |
| ElevenLabs TTS    | $5/mo        | Starter plan, beautiful voice  |
| Claude Sonnet API | ~$8–15/mo    | ~50 commands/day               |
| Porcupine         | Free         | Free tier, one wake word       |
| PostgreSQL        | Free         | Local Docker                   |
| **Total**         | **$13–20/mo**|                                |
