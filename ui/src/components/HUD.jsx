/**
 * HUD — the tiny floating overlay window.
 * Pulsing dot + assistant name + last-action text. Click-through (handled in
 * Electron main.js via setIgnoreMouseEvents).
 */

import { useAssistantStore } from '../store/useAssistantStore.js';
import { stateColor } from '../styles/theme.js';

const NAME = 'ASSISTANT';

export default function HUD() {
  const store = useAssistantStore();
  const color = stateColor(store.current);
  const lastText = store.lastSpoken || store.command
    || (store.current === 'IDLE' ? 'idle' : store.current.toLowerCase());

  return (
    <div className="hud">
      <div className="dot" style={{ background: color, color }} />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <span className="label">{NAME}</span>
        <span className="last-text">{lastText}</span>
      </div>
    </div>
  );
}
