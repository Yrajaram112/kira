# ================================================================
#  KIRA AI — Settings
#  All API keys, model names, audio config, and timeouts.
#  Copy .env.example to .env and fill in your keys.
# ================================================================

import os
from dotenv import load_dotenv

load_dotenv()

# ── AI Models ───────────────────────────────────────────────────
CLAUDE_API_KEY        = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL          = "claude-sonnet-4-5"       # Sonnet for all commands
CLAUDE_MAX_TOKENS     = 1024
CLAUDE_TIMEOUT_SEC    = 15

# ── Voice — Wake-word engine ────────────────────────────────────
# Two backends are supported. Pick one via WAKE_ENGINE.
#   "openwakeword" — default. Open source, on-device, no signup, no API key.
#                    Uses pre-trained "hey_jarvis" model out of the box.
#   "porcupine"    — Picovoice Porcupine. Requires PORCUPINE_ACCESS_KEY in .env
#                    and a .ppn keyword file (download from console.picovoice.ai).
#                    Use this if/when you have Picovoice access.
WAKE_ENGINE           = "openwakeword"            # "openwakeword" | "porcupine"
WAKE_SENSITIVITY      = 0.6                       # 0.0–1.0; higher = more sensitive (more false +)
WAKE_COOLDOWN_SEC     = 1.5                       # Debounce window after a wake event

# openWakeWord (primary)
# Built-in models: "hey_jarvis", "alexa", "hey_mycroft", "hey_rhasspy", "ok_nabu".
# Custom model? Train at https://github.com/dscripka/openWakeWord and set the path.
OPENWW_MODEL          = "hey_jarvis"              # name OR path to a custom .tflite
OPENWW_THRESHOLD      = 0.5                       # 0.0–1.0; openWakeWord detection score gate
OPENWW_INFER_FW       = "onnx"                    # "onnx" | "tflite" (onnx is easier on Windows)

# Porcupine (fallback — only used when WAKE_ENGINE == "porcupine")
PORCUPINE_ACCESS_KEY   = os.getenv("PORCUPINE_ACCESS_KEY")
PORCUPINE_KEYWORD_PATH = "config/hey-kira_en_windows_v3_0_0.ppn"  # Download from picovoice.ai

# ── Voice — Input ───────────────────────────────────────────────
WHISPER_MODEL_SIZE    = "medium"                  # medium for Hinglish/Maithili/Nepali support
WHISPER_LANGUAGE      = None                      # None = auto-detect (owner is multilingual)
AUDIO_SAMPLE_RATE     = 16000
AUDIO_CHANNELS        = 1
RECORD_SILENCE_SEC    = 1.2                       # Stop recording after this silence
RECORD_MAX_SEC        = 8.0                       # Never record longer than this

# ── State machine timeouts (seconds) ─────────────────────────────
STATE_TIMEOUT_RECORDING     = 9.0
STATE_TIMEOUT_TRANSCRIBING  = 8.0
STATE_TIMEOUT_CLASSIFYING   = 20.0
STATE_TIMEOUT_CLARIFYING    = 12.0
STATE_TIMEOUT_CONFIRMING    = 8.0
STATE_TIMEOUT_EXECUTING     = 30.0
CLARIFY_MAX_ROUNDS          = 2

# ── Voice — Output ──────────────────────────────────────────────
ELEVENLABS_API_KEY    = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_MODEL      = "eleven_turbo_v2"         # Fast, low latency
TTS_FALLBACK          = True                      # Use pyttsx3 if ElevenLabs fails

# ── Memory ──────────────────────────────────────────────────────
DATABASE_URL          = os.getenv("DATABASE_URL", "postgresql://kira:kira@localhost:5432/kiradb")
EMBEDDING_MODEL       = "text-embedding-3-small"  # OpenAI embeddings for pgvector
OPENAI_API_KEY        = os.getenv("OPENAI_API_KEY")  # Only for embeddings
MEMORY_TOP_K          = 5                         # Memories to retrieve per query
SESSION_HISTORY_TURNS = 10                        # Conversation turns kept in context

# ── Browser ─────────────────────────────────────────────────────
BROWSER_HEADLESS      = False                     # True = invisible browser
BROWSER_TIMEOUT_SEC   = 10

# ── Integrations ────────────────────────────────────────────────
GOOGLE_CREDS_PATH     = "config/google_credentials.json"
GOOGLE_TOKEN_PATH     = "config/google_token.json"
GOOGLE_SCOPES         = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar",
]
OPENWEATHER_API_KEY   = os.getenv("OPENWEATHER_API_KEY")

# ── WebSocket (UI bridge) ────────────────────────────────────────
WS_HOST               = "localhost"
WS_PORT               = 8765

# ── Logging ─────────────────────────────────────────────────────
LOG_FILE              = "logs/kira.log"
LOG_LEVEL             = "INFO"
