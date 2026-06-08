# ================================================================
#  KIRA AI — Identity Config
#  ONE place to rename your assistant. Change ASSISTANT_NAME
#  and everything else updates automatically across all modules.
# ================================================================

ASSISTANT_NAME      = "Kira"
# The phrase the user SAYS to wake the assistant. The assistant's NAME (above)
# is independent of this — you say the wake word, she answers as Kira.
# Current value matches WAKE_ENGINE="openwakeword" + OPENWW_MODEL="hey_jarvis"
# in config/settings.py. If you later switch to Porcupine with a custom "hey
# kira" .ppn, change this to "hey kira" and flip WAKE_ENGINE to "porcupine".
ASSISTANT_WAKE_WORD = "hey jarvis"
ASSISTANT_VOICE_ID  = "21m00Tcm4TlvDq8ikWAM"
ASSISTANT_GREETING  = f"Good morning! {ASSISTANT_NAME} is online and ready."
ASSISTANT_STANDBY   = f"{ASSISTANT_NAME} standing by."
ASSISTANT_ERROR     = "Sorry, I ran into a problem. Please try again."
ASSISTANT_CONFIRM   = "Done."
ASSISTANT_CLARIFY   = "I need a bit more information — could you tell me"
ASSISTANT_OFFLINE   = "Some of my services are offline."

OWNER_NAME = "Rajaram"
TIMEZONE   = "America/Chicago"
