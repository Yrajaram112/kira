"""
KIRA AI — Entry Point
Run this to start your assistant: python main.py

The assistant name, voice, and wake word are all configured in:
  config/identity.py  ← change ASSISTANT_NAME here to rename
"""

import logging
import sys
from config.identity import ASSISTANT_NAME
from config.settings import LOG_FILE, LOG_LEVEL

# ── Logging ──────────────────────────────────────────────────────
import os
os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("main")


def main():
    log.info(f"Starting {ASSISTANT_NAME} AI...")

    # These imports are here so logging is configured first
    from core.loop import KiraLoop

    try:
        loop = KiraLoop()
        loop.start()
    except KeyboardInterrupt:
        log.info(f"{ASSISTANT_NAME} shutting down.")
    except Exception as e:
        log.exception(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
