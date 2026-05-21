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

# ── Voice — Input ───────────────────────────────────────────────
PORCUPINE_ACCESS_KEY  = os.getenv("PORCUPINE_ACCESS_KEY")
PORCUPINE_KEYWORD_PATH = "config/hey-kira_en_windows_v3_0_0.ppn"  # Download from picovoice.ai
WHISPER_MODEL_SIZE    = "small"                   # tiny / small / medium / large
WHISPER_LANGUAGE      = "en"
AUDIO_SAMPLE_RATE     = 16000
AUDIO_CHANNELS        = 1
RECORD_SILENCE_SEC    = 1.2                       # Stop recording after this silence
RECORD_MAX_SEC        = 8.0                       # Never record longer than this

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
