# KIRA AI — Build Checklist
# Tick every box before moving to the next phase.
# This is your source of truth for "is this phase actually done?"

---

## PRE-BUILD (Before Phase 1)

- [ ] Run Opus 4 with OPUS_ARCHITECTURE_PROMPT.md — save output to docs/ARCH_SPEC.md
- [ ] Read the full arch spec — make sure you understand the state machine
- [ ] Create .env from .env.example, fill in: ANTHROPIC_API_KEY, ELEVENLABS_API_KEY
- [ ] Download Porcupine keyword file for "hey kira" from picovoice.ai console
- [ ] Test microphone works in Python: `python -c "import pyaudio; print('ok')"`
- [ ] Confirm Python 3.11 installed: `python --version`
- [ ] Create virtual environment and activate it
- [ ] Create GitHub repo: kira-ai (private for now)
- [ ] First commit: directory structure + config/identity.py only

---

## PHASE 1 CHECKLIST — Voice loop + system commands

### Setup
- [ ] Paste PHASE1_CURSOR_PROMPT.md into Cursor (with ARCH_SPEC.md as context)
- [ ] requirements.txt generated and all packages install cleanly
- [ ] main.py runs without import errors

### Wake word
- [ ] Porcupine initialises without error
- [ ] "Hey Kira" triggers callback reliably (test 10 times)
- [ ] False activations are rare (less than 1 per 10 minutes of background noise)
- [ ] CPU usage in IDLE state is under 2%

### Voice input
- [ ] Recording starts immediately after wake word
- [ ] Recording stops on silence (under 1.5s gap)
- [ ] Recording stops after 8s maximum even if no silence
- [ ] Audio quality is sufficient for Whisper

### Transcription
- [ ] Whisper model loads once at startup (not per request)
- [ ] Transcription of clear speech is 95%+ accurate
- [ ] Transcription latency under 2 seconds for a 5-word command
- [ ] Works with your accent

### Intent classification
- [ ] All 15 Phase 1 tools defined in intent.py
- [ ] Claude correctly classifies "open Chrome" → open_app(app_name="Chrome")
- [ ] Claude correctly classifies "set volume to 50" → set_volume(level=50)
- [ ] Claude correctly classifies "turn it down" → set_volume(direction="down")
- [ ] Claude correctly classifies "what is 340 times 15 percent" → calculate(expression=...)
- [ ] Unknown commands route to unknown_command() gracefully
- [ ] ASSISTANT_NAME appears in system prompt (not hardcoded "Kira")

### Command execution
- [ ] open_app: Chrome, VS Code, Spotify, Notepad all open correctly
- [ ] close_app: closes the named application
- [ ] set_volume up/down/mute/specific level all work
- [ ] set_brightness up/down/specific level works
- [ ] type_text types into the currently focused window
- [ ] press_keys: Ctrl+C, Ctrl+V, Win+D all work
- [ ] take_screenshot saves to Desktop with timestamp filename
- [ ] scroll up/down works in Chrome and VS Code
- [ ] calculate returns correct spoken result
- [ ] set_timer beeps/speaks when timer completes
- [ ] lock_pc locks immediately
- [ ] sleep_pc sleeps immediately
- [ ] shutdown_pc asks for confirmation before executing
- [ ] restart_pc asks for confirmation before executing

### Voice response
- [ ] ElevenLabs TTS plays immediately after command completes
- [ ] Response uses ASSISTANT_NAME from identity.py
- [ ] Fallback to pyttsx3 if ElevenLabs fails
- [ ] No audio overlap (new speech waits for current to finish)

### Clarification
- [ ] "open" with no app name → Kira asks "Which app should I open?"
- [ ] After clarification, command executes correctly
- [ ] Two rounds of clarification work (rare but possible)

### Startup
- [ ] scripts/startup.py --install registers with Task Scheduler
- [ ] Reboot and confirm Kira starts automatically
- [ ] System tray icon appears with correct name
- [ ] Right-click tray: Show, Hide, Quit all work

### Logging
- [ ] logs/kira.log created on first run
- [ ] Every command logged with timestamp, transcript, intent, result

### Tests
- [ ] pytest tests/test_executor.py — all pass
- [ ] No hardcoded "Kira" strings anywhere except config/identity.py

---

## PHASE 2 CHECKLIST — Browser, Email, Calendar, Files

### Browser
- [ ] "Open chrome and go to youtube.com" — opens Chrome, navigates
- [ ] "Search Google for best Python tutorials" — opens Google search
- [ ] "Open a new tab" — new tab opens
- [ ] "Close this tab" — current tab closes
- [ ] "Scroll down" — page scrolls
- [ ] "Fill in the email field with test@example.com" — fills form
- [ ] "Click the submit button" — clicks correct element
- [ ] "Read this page to me" — summarises visible text

### Email (Gmail)
- [ ] OAuth setup completes first time without errors
- [ ] Token refreshes automatically when expired
- [ ] "Send email to priya@example.com subject Test body Hello" — sends correctly
- [ ] "Send email to Priya" → asks for subject → asks for body → confirms → sends
- [ ] "Read my latest emails" — reads and summarises top 5
- [ ] Confirmation required before send — "yes" confirms, "no" cancels
- [ ] "CC someone" works when specified

### Calendar (Google Calendar)
- [ ] "Create event called Team standup tomorrow at 10am" — creates correctly
- [ ] "Create event" with no details → asks title → asks date → asks time → creates
- [ ] "What's on my calendar today?" — lists events
- [ ] "What do I have this week?" — lists week's events
- [ ] "Delete the standup event" — confirms then deletes
- [ ] Events appear correctly in Google Calendar app

### Files
- [ ] "Find the file called budget.xlsx" — finds and reports location
- [ ] "Open budget.xlsx" — opens in Excel
- [ ] "Create a file called notes.txt on the Desktop" — creates
- [ ] "Delete notes.txt" → confirms → deletes
- [ ] "Move resume.pdf to Documents" — moves correctly
- [ ] "List files in Downloads" — speaks count and top files

### Web Search + Weather
- [ ] "Search for LangGraph documentation" — returns summarised results
- [ ] "What's the weather in Kathmandu?" — speaks current weather
- [ ] "What time is it in New York?" — correct timezone

### Session Context
- [ ] "Send email to Priya. Now send her another one." — second email uses same recipient
- [ ] "Open notes.txt. Now delete it." — "it" resolves to notes.txt
- [ ] Context resets between sessions (on restart)

### Tests
- [ ] pytest tests/test_email_agent.py — all pass (mocked)
- [ ] pytest tests/test_calendar_agent.py — all pass (mocked)
- [ ] pytest tests/test_file_agent.py — all pass

---

## PHASE 3 CHECKLIST — Memory, Multi-Agent, Developer Tools

### Memory
- [ ] Docker starts PostgreSQL + pgvector with `docker compose up -d`
- [ ] scripts/setup_memory.py creates all tables without error
- [ ] `memory.remember("Priya's number is 9800000000")` stores and retrieves
- [ ] `memory.recall("Priya contact")` returns the relevant memory
- [ ] Session summary stored after each session
- [ ] "Do you remember Priya's number?" — Kira retrieves and speaks it

### Context + pronoun resolution
- [ ] "Send email to Priya. Reply to her tomorrow." — "her" = Priya
- [ ] "Open budget.xlsx. Now close it." — "it" = budget.xlsx
- [ ] "Call him" with no prior contact → Kira asks who
- [ ] Context window limited to last 10 turns (no context explosion)

### Multi-step orchestrator
- [ ] "Search Google for the Claude API docs, open the first result, and summarise it"
      — completes all 3 steps in sequence, reports result
- [ ] "Find the email from Priya and reply saying I'll call tomorrow"
      — finds email, drafts reply, confirms, sends
- [ ] If step 2 of 3 fails, Kira says "I completed steps 1 and 2 but couldn't do step 3 because..."
- [ ] LangGraph state visible in logs

### Developer tools
- [ ] "Open terminal in my projects folder" — opens Windows Terminal at that path
- [ ] "Run git status" — runs and speaks output summary
- [ ] "Open this project in VS Code" — opens VS Code at current path
- [ ] "Open Cursor in Downloads" — opens Cursor
- [ ] "Create a new Python project called data-scraper" — scaffolds folder + files
- [ ] "Push my changes with message 'fix bug'" — git add, commit, push
- [ ] "Open my kira-ai repo on GitHub" — opens in browser

### WhatsApp
- [ ] WhatsApp Web opens and stays logged in after first auth
- [ ] "Send WhatsApp to Priya saying I'm on my way" — sends correctly
- [ ] Confirmation required before sending
- [ ] "Send WhatsApp to John" → no message → asks "What should I say?"
- [ ] "Read my latest WhatsApp from Priya" — reads last 5 messages

### Tasks
- [ ] "Add task: review PR by end of day" — adds to task list
- [ ] "What are my tasks?" — reads all incomplete tasks
- [ ] "Mark review PR as done" — marks complete
- [ ] "What's overdue?" — lists overdue tasks

### Tests
- [ ] pytest tests/test_memory.py — semantic recall accuracy > 90% on test set
- [ ] pytest tests/test_orchestrator.py — all pass
- [ ] pytest tests/test_context.py — pronoun resolution tests pass

---

## PHASE 4 CHECKLIST — Electron UI + Visual Layer

### WebSocket bridge
- [ ] core/ws_server.py starts without error
- [ ] Electron connects to ws://localhost:8765 on startup
- [ ] State change events received and logged in Electron console
- [ ] Waveform amplitude data received at 30fps+

### Orb visual
- [ ] Three.js orb renders at 60fps
- [ ] IDLE state: dim, slow pulse — looks good
- [ ] LISTENING state: bright cyan, particle orbit, ripple rings — looks amazing
- [ ] PROCESSING state: purple swirl, internal glow — clearly "thinking"
- [ ] EXECUTING state: amber, outward energy beams — clearly "doing something"
- [ ] SPEAKING state: green waveform wraps sphere, pulses with voice
- [ ] Transitions between states are smooth (no hard cuts, lerp animation)
- [ ] Particles look like a sci-fi AI — reference: Iron Man JARVIS

### Waveform
- [ ] Voice waveform appears during LISTENING and SPEAKING
- [ ] Bars animate in real time with audio amplitude
- [ ] Disappears cleanly in other states

### Status text
- [ ] State label updates instantly on each transition
- [ ] Shows command description during EXECUTING ("Opening Chrome...")
- [ ] Shows spoken text during SPEAKING ("Done.")
- [ ] Uses ASSISTANT_NAME from config endpoint (not hardcoded)

### Task log
- [ ] Click orb → task log slides up
- [ ] Shows last 20 actions with timestamp and icon
- [ ] Click outside → dismisses
- [ ] Scrollable

### HUD overlay
- [ ] Appears in bottom-right corner, always on top
- [ ] Shows pulsing dot + name + last action
- [ ] Click → shows/hides main window
- [ ] Never steals focus
- [ ] Semi-transparent, blurred background

### Electron app
- [ ] Frameless window, draggable by title bar area
- [ ] System tray icon, right-click: Show, Hide, Quit
- [ ] App name in tray matches ASSISTANT_NAME
- [ ] `npm run build` produces working .exe
- [ ] .exe starts Python backend automatically as subprocess
- [ ] Registers as Windows startup app via electron-builder config
- [ ] Starts correctly after fresh reboot (tray + HUD visible, Python running)

### Full integration test
- [ ] Say "Hey Kira" — orb lights up cyan immediately
- [ ] Speak command — waveform animates, orb shifts to purple
- [ ] Command executes — orb goes amber, status shows action
- [ ] Response spoken — orb goes green, waveform pulses with voice
- [ ] Returns to idle — orb dims

---

## FINAL RELEASE CHECKLIST

- [ ] All Phase 1–4 checklists complete
- [ ] No hardcoded "Kira" strings outside config/identity.py
- [ ] .env.example updated with all required keys documented
- [ ] .gitignore excludes: .env, google_token.json, logs/, __pycache__, venv/
- [ ] README.md has clear setup instructions
- [ ] Rename test: change ASSISTANT_NAME to "Aria", restart — all spoken text says "Aria"
- [ ] Record a 60-second demo video: wake word → multi-step command → visual response
- [ ] Push to GitHub (public)
- [ ] Post demo on X/Twitter and LinkedIn
