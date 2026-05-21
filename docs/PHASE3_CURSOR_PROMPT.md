# KIRA AI — Phase 3 Cursor Prompt
# Paste after Phase 2 is complete and tested.
# Include arch doc + Phase 1 + Phase 2 code as context in Cursor.

---

## CONTEXT

Phase 1 (voice loop + system control) and Phase 2 (browser, email, calendar, files) are done.
Now add long-term memory, LangGraph multi-step agents, WhatsApp, developer tools,
and smart context tracking. KIRA goes from reactive to genuinely intelligent.

---

## PHASE 3 SCOPE — Memory, Multi-Agent, Developer Tools, Smart Context

### New files to create:

**memory/store.py**
- Class `MemoryStore` backed by PostgreSQL + pgvector (local Docker)
- Schema:
  ```
  memories(id, owner, content, embedding vector(1536), category, created_at, accessed_at)
  sessions(id, started_at, ended_at, summary)
  session_events(id, session_id, role, content, timestamp, command_type)
  preferences(key, value, updated_at)
  ```
- Methods:
  - `remember(content: str, category: str)` — embeds + stores
  - `recall(query: str, top_k: int = 5) -> list[Memory]` — semantic search
  - `get_preferences() -> dict`
  - `set_preference(key: str, value: str)`
  - `summarise_session(session_id: str)` — calls Claude to summarise, stores summary
  - `get_recent_context(n_events: int = 20) -> str` — last N events as text

**memory/context.py**
- Class `SessionContext`
- Tracks within a single session (in-memory, fast):
  - last_email_recipient, last_file_path, last_url, last_app_opened
  - conversation_history (last 10 turns for Claude context)
  - pending_clarification (partial command being built up)
- Methods:
  - `update(key, value)`
  - `get(key) -> Any`
  - `add_turn(role: str, content: str)`
  - `get_history() -> list[dict]`
  - `clear_pending()`

**agents/orchestrator.py**
- Class `Orchestrator` using LangGraph
- Handles multi-step commands that span multiple agents:
  - "Search for the cheapest flight to Delhi, open it, and add the trip to my calendar"
  - "Find the email from Priya, summarise it, draft a reply, and show it to me first"
  - "Open GitHub, find my latest repo, clone it in VS Code, and open the README"
- Defines a LangGraph StateGraph with nodes:
  - plan_node: Claude breaks the request into ordered steps
  - route_node: routes each step to the right agent
  - execute_node: runs the step
  - check_node: verifies step succeeded, decides next
  - respond_node: compiles final spoken response
- Handles failures mid-chain: KIRA says what she completed and what failed

**agents/developer_agent.py**
- Class `DeveloperAgent`
- Methods:
  - `open_terminal(path: str = None)` — opens Windows Terminal in specified folder
  - `run_command(cmd: str, path: str = None) -> str` — runs in terminal, returns output
  - `open_vscode(path: str = None)`
  - `open_cursor(path: str = None)`
  - `create_project_scaffold(name: str, template: str)` — e.g. "next.js", "python", "java"
  - `git_status(path: str) -> str`
  - `git_commit(message: str, path: str)`
  - `git_push(path: str)`
  - `open_github_repo(repo_name: str)`
  - `run_python_file(path: str) -> str`
  - `search_stackoverflow(query: str) -> str`

**agents/whatsapp_agent.py**
- Class `WhatsAppAgent` using Playwright on WhatsApp Web
- Methods:
  - `send_message(contact_name: str, message: str)`
  - `read_latest_messages(contact_name: str, count: int = 5) -> list[str]`
- Clarification rules:
  - contact_name required — if ambiguous, show matches and ask to confirm
  - message required — if missing, ask "What should I say?"
  - Always confirm before sending

**agents/task_agent.py**
- Class `TaskAgent` — simple local task list
- Stored in memory/tasks.json
- Methods:
  - `add_task(title: str, due_date: str = None, priority: str = "normal")`
  - `list_tasks(filter: str = "all") -> list[Task]`  — "all", "today", "overdue"
  - `complete_task(title_or_id: str)`
  - `delete_task(title_or_id: str)`

### Update core/intent.py — add new tools:
- run_terminal_command(command, path)
- open_vscode(path)
- open_cursor(path)
- git_commit(message, path)
- git_push(path)
- send_whatsapp(contact, message)
- read_whatsapp(contact, count)
- add_task(title, due_date, priority)
- list_tasks(filter)
- complete_task(title)
- recall_memory(query)
- multi_step_task(description)  — routes to Orchestrator

### Update core/loop.py:
- Inject SessionContext into every agent call
- After each successful command, store to MemoryStore
- Before complex commands, call memory.recall() for relevant context
- Pass conversation_history to Claude on every intent classification call
  (gives KIRA session awareness: "him" → last mentioned person)
- End of session: call memory.summarise_session()

### Update core/clarifier.py:
- Now has access to SessionContext — can resolve pronouns:
  - "send it to him" → looks up last_email_recipient from context
  - "open that file" → looks up last_file_path from context
  - "reply to her" → looks up last WhatsApp/email contact
- Only asks for clarification if context lookup also fails

### Docker setup:
- docker/docker-compose.yml — PostgreSQL + pgvector container
- scripts/setup_memory.py — creates tables, installs pgvector extension
- scripts/reset_memory.py — wipes all memories (with confirmation)

### Tests:
- tests/test_memory.py — store, recall, semantic search accuracy
- tests/test_orchestrator.py — mock agents, test multi-step chain
- tests/test_developer_agent.py — test against real temp folder
- tests/test_context.py — session context tracking, pronoun resolution

## DO NOT BUILD IN PHASE 3:
- Electron UI (Phase 4)
- Visual orb / animations (Phase 4)
- Wake word UI indicator (Phase 4)
