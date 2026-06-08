/**
 * Root component for the main 400x600 window.
 *
 * Layout (top → bottom):
 *   drag handle (frameless drag region) + ×/− buttons
 *   Orb
 *   Waveform
 *   StatusText
 *   TaskLog (slides in when orb is clicked)
 */

import { useState } from 'react';

import Orb from './components/Orb.jsx';
import StatusText from './components/StatusText.jsx';
import TaskLog from './components/TaskLog.jsx';
import Waveform from './components/Waveform.jsx';
import { useAssistantStore } from './store/useAssistantStore.js';

const ACTIVE_STATES = new Set(['LISTENING', 'SPEAKING']);

export default function App() {
  const store = useAssistantStore();
  const [logOpen, setLogOpen] = useState(false);

  const avgAmplitude = ACTIVE_STATES.has(store.current)
    ? averageAmplitude(store.waveform)
    : 0;

  return (
    <div
      className="shell"
      onClick={(e) => {
        // close log if the user clicks the shell background (not log or orb)
        if (logOpen && e.target.classList.contains('shell')) setLogOpen(false);
      }}
    >
      <div className="drag-handle" />
      <div className="title-buttons">
        <button
          type="button"
          onClick={() => window.assistant?.toggleMainWindow?.()}
          title="Hide window"
        >
          –
        </button>
      </div>

      <Orb
        state={store.current}
        amplitude={avgAmplitude}
        onClick={() => setLogOpen((v) => !v)}
      />
      <Waveform data={store.waveform} state={store.current} />
      <StatusText
        state={store.current}
        command={store.command}
        lastSpoken={store.lastSpoken}
      />

      <TaskLog entries={store.log} visible={logOpen} />
    </div>
  );
}

function averageAmplitude(arr) {
  if (!arr || arr.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i += 1) sum += arr[i] || 0;
  return Math.max(0, Math.min(1, sum / arr.length));
}
