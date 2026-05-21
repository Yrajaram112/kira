# KIRA AI — Master Architecture Prompt
# Paste this ENTIRE document into Claude Opus 4 in Cursor before writing a single line of code.
# Opus will produce the definitive spec. You then feed that spec to Sonnet for implementation.

---

## YOUR ROLE

You are a senior AI systems architect. You are designing KIRA — a personal voice-controlled AI
assistant that runs permanently on a Windows laptop. KIRA listens for a wake word, understands
natural language commands, executes actions on the computer and via APIs, speaks responses in
a warm female voice, and maintains memory of the user across sessions.

The assistant's name, voice, and personality are fully configurable from a single file:
`config/identity.py`. Every module must import from there — never hardcode the name anywhere.

The owner is Rajaram Yadav, a software engineer. He will interact in English and occasionally Hinglish, maithali and nepali as well. KIRA should understand both naturally.
I think you are going to use venv right?
---

## FULL CAPABILITY REQUIREMENT

KIRA must be able to do ALL of the following by end of Phase 4:

### System Control
- Open any application by name ("open Chrome", "open Spotify", "open VS Code")
- Close any window or application
- Shut down, restart, sleep, lock the computer
- Increase/decrease volume (specific amounts or "mute")
- Increase/decrease screen brightness
- Take a screenshot and describe what's on screen
- Control media: play, pause, next track, previous track
- Scroll up/down/left/right on current window
- Press any keyboard shortcut or key combination
- Type any text into the current active window
- Move and resize windows

### Browser Control
- Open Chrome / Edge / Firefox
- Open a new tab, close current tab, switch between tabs
- Navigate to any URL
- Search Google for any query
- Fill in any form field by field name or position
- Click any button on screen by description
- Scroll within a webpage
- Read and summarise the current page

### Communication
- Send email: compose, address, subject, body, attachments — ask for missing info
- Read and summarise latest emails
- Send WhatsApp message (via WhatsApp Web)
- Draft a message and confirm before sending

### Calendar & Reminders
- Create calendar event (asks: title, date, time, duration, attendees if missing)
- List today's / this week's events
- Set a reminder for a specific time
- Cancel or reschedule an event

### Productivity
- Create, open, read, rename, move, delete files and folders
- Search for a file by name or content
- Open a file in the right application
- Start a timer ("set 25-minute timer")
- Do any calculation ("what is 15% of 340")
- Convert units ("convert 5km to miles")
- Look up real-time information via web search
- Weather for any location
- Add tasks to a task list, mark as complete, list all tasks

### Developer Actions
- Open a terminal and run a command
- Open VS Code / Cursor in a specific folder
- Create a new file with specified content
- Run a Python script
- Open GitHub in browser and navigate to a repo

### Smart Clarification
- When user gives incomplete info (e.g. "send email to John" but no subject/body), KIRA must ask
  for exactly the missing pieces — one at a time — before executing
- KIRA never assumes — she confirms destructive actions (shutdown, delete, send)
- KIRA remembers context within a session ("email him again" refers to the last recipient)

---

## TECHNICAL CONSTRAINTS

- Python 3.11 on Windows 11
- Wake word: Porcupine (picovoice) — keyword file for "Hey Kira"
- STT: OpenAI Whisper (local, "small" model) — transcription only, never cloud
- TTS: ElevenLabs API — voice ID in config/identity.py
- Intent + reasoning: Claude API (claude-sonnet-4-5 by default, configurable)
- Browser automation: Playwright (Chromium)
- Screen/keyboard control: PyAutoGUI + pygetwindow
- Email: Gmail API (OAuth2)
- Calendar: Google Calendar API (OAuth2)
- Memory: PostgreSQL + pgvector (local Docker)
- Agent orchestration: LangGraph for multi-step tasks
- Desktop app: Electron + React (Phase 4)
- Startup: Windows Task Scheduler entry, runs on login

---

## STATE MACHINE

Design the core state machine. KIRA is always in exactly one state:

IDLE → WAKE_DETECTED → RECORDING → TRANSCRIBING → CLASSIFYING →
CLARIFYING (conditional) → CONFIRMING (for destructive actions) →
EXECUTING → RESPONDING → IDLE

Define: what triggers each transition, what happens if it times out, what
happens on error in each state, and how KIRA recovers gracefully.

---

## WHAT TO PRODUCE

Generate a complete architecture specification document with:

1. **Module map** — every file in the project, its responsibility, its imports/exports
2. **State machine spec** — full definition of every state, transition, timeout, and error path
3. **Intent classifier design** — the exact Claude system prompt for tool-calling, all tools
   defined with names, descriptions, required params, optional params, and clarification rules
4. **Clarification engine** — how KIRA decides when to ask, what to ask, and how to track
   partial info across multiple turns in a single command session
5. **Memory architecture** — what gets stored, schema, retrieval strategy, session vs long-term
6. **Startup sequence** — exact boot order, what loads in which order, failure handling
7. **Configuration system** — how identity.py propagates to all modules
8. **Phase boundaries** — what is in scope for Phase 1, 2, 3, 4 respectively
9. **Integration contracts** — API interfaces between every module pair
10. **Risk list** — top 10 things most likely to break and how to handle them

Format as a structured technical document. This will be given to Claude Sonnet
as the system context for all implementation work.
