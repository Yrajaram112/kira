# KIRA AI — Phase 2 Cursor Prompt
# Paste after Phase 1 is complete and tested.
# Include the Opus architecture doc + Phase 1 code as context in Cursor.

---

## CONTEXT

Phase 1 is complete. KIRA can hear, understand, and control the system.
Now add browser control, email, and calendar. All existing modules stay untouched.
Import identity config from config/identity.py everywhere.

## PHASE 2 SCOPE — Browser, Email, Calendar, File System

### New files to create:

**agents/browser_agent.py**
- Class `BrowserAgent` using Playwright (Chromium)
- Methods:
  - `open_url(url: str)`
  - `open_new_tab()`
  - `close_tab()`
  - `switch_tab(direction: str | index: int)`
  - `search_google(query: str)`
  - `fill_field(field_description: str, value: str)` — uses vision to find field
  - `click_element(description: str)` — uses vision + coordinates
  - `scroll_page(direction: str, amount: int)`
  - `get_page_text() -> str` — returns visible text for summarisation
  - `read_page() -> str` — sends page text to Claude, returns summary

**agents/email_agent.py**
- Class `EmailAgent` using Gmail API (OAuth2)
- Methods:
  - `compose(to: str, subject: str, body: str, cc: str = None) -> draft`
  - `send(draft) -> bool`
  - `read_latest(count: int = 5) -> list[EmailSummary]`
  - `search_emails(query: str) -> list[EmailSummary]`
- Clarification rules (enforced by Clarifier before EmailAgent is called):
  - `to` required — if missing, ask "Who should I send this to?"
  - `subject` required — if missing, ask "What's the subject?"
  - `body` required — if missing, ask "What should the email say?"
  - Always confirm before sending: "Send email to [name] with subject [subject]? Say yes to confirm."

**agents/calendar_agent.py**
- Class `CalendarAgent` using Google Calendar API (OAuth2)
- Methods:
  - `create_event(title, start_dt, end_dt, attendees=None, description=None)`
  - `list_events(date: str) -> list[Event]`  — "today", "tomorrow", "this week"
  - `delete_event(event_id: str)`
  - `find_event(search_term: str) -> Event`
- Clarification rules:
  - title required — if missing ask "What's the event called?"
  - date required — if missing ask "When is it?"
  - time required — if missing ask "What time does it start?"
  - duration optional — default 1 hour if not given
  - Always confirm deletes

**agents/file_agent.py**
- Class `FileAgent`
- Methods:
  - `search_file(name: str, location: str = None) -> list[Path]`
  - `open_file(path: str)`
  - `create_file(path: str, content: str = "")`
  - `rename_file(old_path: str, new_name: str)`
  - `delete_file(path: str)` — always confirm before deleting
  - `move_file(src: str, dest: str)`
  - `list_folder(path: str) -> list[str]`

**agents/web_agent.py**
- Class `WebAgent`
- Methods:
  - `search(query: str) -> str` — DuckDuckGo search, returns top 3 results summarised
  - `get_weather(location: str) -> str` — OpenWeatherMap API
  - `get_current_time(timezone: str = None) -> str`

### Update core/intent.py:
Add new tools to the intent classifier:
- open_url(url)
- open_new_tab()
- close_tab()
- switch_tab(direction)
- search_google(query)
- fill_form_field(field_name, value)
- click_element(description)
- read_current_page()
- send_email(to, subject, body, cc)
- read_emails(count)
- create_calendar_event(title, date, time, duration, attendees)
- list_calendar_events(date)
- delete_calendar_event(title)
- search_file(name)
- open_file(name_or_path)
- create_file(name, content)
- delete_file(name_or_path)
- web_search(query)
- get_weather(location)

### Update core/loop.py:
- Route browser/email/calendar/file commands to correct agent
- Handle multi-step flows (e.g. "find the email from John and reply to it")
- Session context: remember last email recipient, last file opened, etc.

### OAuth Setup:
- scripts/setup_google_auth.py — walks through Gmail + Calendar OAuth2 setup
- Stores token in config/google_token.json (gitignored)

### Tests:
- tests/test_email_agent.py — mock Gmail API, test compose/send/clarification flow
- tests/test_calendar_agent.py — mock Calendar API, test create/list/delete
- tests/test_browser_agent.py — Playwright test against a local test page
- tests/test_file_agent.py — use temp directory

## DO NOT BUILD IN PHASE 2:
- LangGraph multi-step agent chaining (Phase 3)
- Long-term memory (Phase 3)
- Electron UI (Phase 4)
- WhatsApp (Phase 3)
