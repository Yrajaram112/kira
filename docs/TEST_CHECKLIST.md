# KIRA AI — Test Checklist
# Manual QA tests to run before declaring each phase "done".
# These are real-world spoken command tests — not unit tests.
# Sit down, say each command, and mark pass/fail honestly.

---

## HOW TO USE THIS

For each test:
1. Say the exact command (or a natural variation)
2. Mark: ✅ Pass | ❌ Fail | ⚠️ Partial
3. If fail — note what actually happened
4. Fix and re-test before moving to next phase

A phase is DONE only when every test in it is ✅

---

## PHASE 1 TESTS — Voice + System Control

### Wake word reliability
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 1 | "Hey Kira" (normal voice) | Kira activates, plays listening sound | |
| 2 | "Hey Kira" (quiet voice) | Activates within 1 second | |
| 3 | Silence for 5 minutes | No false activations | |
| 4 | TV/music playing in background | No false activations | |
| 5 | "Hey Kira" mid-sentence of other speech | Should NOT activate | |

### App control
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 6 | "Open Chrome" | Chrome opens | |
| 7 | "Open Spotify" | Spotify opens | |
| 8 | "Open VS Code" | VS Code opens | |
| 9 | "Open Notepad" | Notepad opens | |
| 10 | "Close Chrome" | Chrome closes | |
| 11 | "Open" (nothing else) | Kira asks "Which app should I open?" | |

### Volume
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 12 | "Turn up the volume" | Volume increases | |
| 13 | "Turn down the volume" | Volume decreases | |
| 14 | "Set volume to 50" | Volume set to 50% | |
| 15 | "Mute" | Audio muted | |
| 16 | "Unmute" | Audio unmuted | |

### Brightness
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 17 | "Increase brightness" | Screen brighter | |
| 18 | "Decrease brightness" | Screen dimmer | |
| 19 | "Set brightness to 70 percent" | Brightness at 70% | |

### Keyboard and typing
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 20 | "Type hello world" (Notepad open) | "hello world" typed | |
| 21 | "Press Control C" | Ctrl+C fired | |
| 22 | "Press Control Z" | Ctrl+Z fired | |
| 23 | "Press Windows D" | Desktop shown | |
| 24 | "Scroll down" (Chrome open) | Page scrolls down | |
| 25 | "Scroll up" | Page scrolls up | |

### System power
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 26 | "Lock my computer" | Screen locks immediately | |
| 27 | "Put it to sleep" | PC sleeps immediately | |
| 28 | "Shut down" | Kira asks "Are you sure you want to shut down?" | |
| 29 | After confirmation "yes" | PC shuts down | |
| 30 | "Shut down" then say "no" | PC does NOT shut down | |
| 31 | "Restart" | Kira asks for confirmation | |

### Calculations
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 32 | "What is 340 times 15 percent" | "That's 51" spoken | |
| 33 | "What is 1250 divided by 4" | "That's 312.5" spoken | |
| 34 | "Convert 5 kilometers to miles" | "5 kilometers is about 3.1 miles" | |
| 35 | "What is the square root of 144" | "That's 12" | |

### Timers
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 36 | "Set a 5 minute timer" | Timer set, Kira confirms | |
| 37 | (Wait 5 minutes) | Kira speaks "Timer done" | |
| 38 | "Set a timer for 30 seconds called pasta" | Timer set with label | |

### Screenshot
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 39 | "Take a screenshot" | Screenshot saved to Desktop | |
| 40 | Kira's response | Speaks filename and confirms saved | |

### Startup
| # | Action | Expected | Result |
|---|--------|----------|--------|
| 41 | Run `python scripts/startup.py --install` | "Kira registered to start on login" | |
| 42 | Reboot computer | Kira starts automatically | |
| 43 | Tray icon visible | Correct name shown | |
| 44 | Right-click tray → Quit | Kira shuts down cleanly | |

### Name portability
| # | Action | Expected | Result |
|---|--------|----------|--------|
| 45 | Change ASSISTANT_NAME to "Aria" in identity.py | | |
| 46 | Restart | All spoken responses say "Aria" | |
| 47 | Tray icon shows "Aria" | ✓ | |
| 48 | Change back to "Kira" | All responses say "Kira" again | |

---

## PHASE 2 TESTS — Browser, Email, Calendar, Files

### Browser
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 49 | "Open YouTube" | Chrome opens YouTube | |
| 50 | "Go to github.com" | Navigates to GitHub | |
| 51 | "Search Google for LangGraph tutorial" | Google search opens | |
| 52 | "Open a new tab" | New tab opens | |
| 53 | "Close this tab" | Current tab closes | |
| 54 | "Scroll down" (on a webpage) | Page scrolls | |
| 55 | "Read this page to me" | Kira summarises visible text | |
| 56 | "Click the sign in button" | Correct button clicked | |
| 57 | "Fill in the search field with Python tutorials" | Field filled | |

### Email — happy path
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 58 | "Send email to test@example.com subject Hello body This is a test" | Kira confirms → sends | |
| 59 | Confirmation: "yes" | Email sent, Kira confirms | |
| 60 | Confirmation: "no" | Email NOT sent | |

### Email — clarification flow
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 61 | "Send an email to Priya" | Kira asks "What's the subject?" | |
| 62 | Say "Project update" | Kira asks "What should the email say?" | |
| 63 | Say the body text | Kira reads it back and asks to confirm | |
| 64 | "Yes" | Email sent | |
| 65 | "Read my emails" | Latest 5 emails summarised | |

### Calendar — happy path
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 66 | "Create event called Team standup tomorrow at 10am" | Created, Kira confirms | |
| 67 | "What's on my calendar tomorrow?" | Events listed | |
| 68 | "What do I have this week?" | Week's events spoken | |
| 69 | "Delete the standup event" | Kira confirms → deletes | |

### Calendar — clarification flow
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 70 | "Create a calendar event" | Asks "What should I call it?" | |
| 71 | Say a name | Asks "When is it?" | |
| 72 | Say a date | Asks "What time does it start?" | |
| 73 | Say a time | Creates event | |

### Files
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 74 | "Find a file called resume.pdf" | Reports where it is | |
| 75 | "Open it" | Opens the file | |
| 76 | "Create a file called notes.txt on the Desktop" | File created | |
| 77 | "Rename it to old-notes.txt" | File renamed | |
| 78 | "Delete old-notes.txt" | Kira confirms → deletes | |
| 79 | "List files in my Downloads folder" | Speaks count and recent files | |

### Weather and search
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 80 | "What's the weather in Kathmandu?" | Current weather spoken | |
| 81 | "What's the weather here?" | Local weather spoken | |
| 82 | "Search for OpenAI API documentation" | Top result summarised | |
| 83 | "What time is it in San Francisco?" | Correct time spoken | |

---

## PHASE 3 TESTS — Memory, Agents, Developer

### Memory
| # | Action / Say | Expected | Result |
|---|-------------|----------|--------|
| 84 | "Remember that my GitHub username is Yrajaram112" | "Got it." | |
| 85 | (New session) "What's my GitHub username?" | "It's Yrajaram112" | |
| 86 | "Remember that I prefer dark mode everywhere" | Stored | |
| 87 | "What are my preferences?" | Recalls stored preferences | |
| 88 | Complete a session, restart | Session summary stored | |

### Pronoun resolution
| # | Say this sequence | Expected | Result |
|---|------------------|----------|--------|
| 89 | "Send email to Priya saying hello" then "Send her another one saying bye" | Second email to Priya | |
| 90 | "Open notes.txt" then "Delete it" | Deletes notes.txt | |
| 91 | "Call him" with no prior contact | Kira asks "Who should I call?" | |

### Multi-step orchestrator
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 92 | "Search Google for Rajaram Yadav portfolio, open the first result, and summarise it" | All 3 steps complete | |
| 93 | "Find the latest email from Priya and reply saying got it thanks" | Finds, drafts, confirms, sends | |
| 94 | "Create a folder called new-project in Documents, open it in VS Code, and create a README.md" | All 3 done | |
| 95 | Multi-step where step 2 fails | Kira reports what completed and what failed | |

### Developer tools
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 96 | "Open a terminal in my Documents folder" | Terminal opens at that path | |
| 97 | "Run git status" | Output spoken/shown | |
| 98 | "Open this folder in VS Code" | VS Code opens | |
| 99 | "Create a Python project called scraper" | Folder + main.py + requirements.txt created | |
| 100 | "Push my changes with message fix typo" | git add, commit, push run | |
| 101 | "Open my kira-ai repo on GitHub" | Browser opens repo | |

### WhatsApp
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 102 | "Send WhatsApp to Priya saying on my way" | Confirms → sends | |
| 103 | "Send WhatsApp to Priya" (no message) | Asks "What should I say?" | |
| 104 | "Read my latest WhatsApp from Priya" | Last 5 messages spoken | |

### Tasks
| # | Say this | Expected | Result |
|---|----------|----------|--------|
| 105 | "Add task: review pull request by tomorrow" | Added, confirmed | |
| 106 | "What are my tasks?" | All tasks spoken | |
| 107 | "Mark review pull request as done" | Marked complete | |
| 108 | "What's overdue?" | Overdue tasks listed | |

---

## PHASE 4 TESTS — Visual UI

### Orb
| # | Action | Expected | Result |
|---|--------|----------|--------|
| 109 | App launches | Orb visible, dim idle state | |
| 110 | Say "Hey Kira" | Orb goes bright cyan immediately | |
| 111 | Speaking a command | Waveform appears, bars animate | |
| 112 | Kira processing | Orb shifts to purple swirl | |
| 113 | Command executing | Orb goes amber, status text shows action | |
| 114 | Kira speaking | Orb goes green, pulses with voice | |
| 115 | Command complete | Orb returns to dim idle | |
| 116 | All transitions | Smooth lerp — no hard cuts | |

### HUD
| # | Action | Expected | Result |
|---|--------|----------|--------|
| 117 | App launches | HUD visible in bottom-right | |
| 118 | After a command | HUD shows last action | |
| 119 | Click HUD | Main window shows/hides | |
| 120 | HUD never steals focus | Other apps work normally | |

### Task log
| # | Action | Expected | Result |
|---|--------|----------|--------|
| 121 | Complete 5 commands | All appear in task log | |
| 122 | Click orb | Task log slides up | |
| 123 | Click outside | Log dismisses | |
| 124 | 20+ commands | Log scrolls, oldest removed | |

### Electron packaging
| # | Action | Expected | Result |
|---|--------|----------|--------|
| 125 | `npm run build` | .exe produced with no errors | |
| 126 | Run .exe on clean machine | Python backend starts automatically | |
| 127 | Reboot | Kira starts via Windows startup, HUD visible | |
| 128 | Change name in identity.py, rebuild | Tray + UI show new name | |

---

## FULL REGRESSION — Run before any public release

Run these 10 commands back to back without stopping:

| # | Command | Pass? |
|---|---------|-------|
| R1 | "Open Chrome and search for today's weather" | |
| R2 | "Send an email to test@example.com saying this is a test from Kira" | |
| R3 | "Create a calendar event called Demo tomorrow at 3pm" | |
| R4 | "Set a 2 minute timer" | |
| R5 | "What is 15 percent of 2500" | |
| R6 | "Open VS Code" | |
| R7 | "Take a screenshot" | |
| R8 | "What are my tasks for today?" | |
| R9 | "What's the weather in Kathmandu?" | |
| R10 | "What did I just ask you to do?" (memory/context test) | |

All 10 pass in one sitting = ship it.
