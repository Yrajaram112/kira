/**
 * StatusText — the one-line status label below the orb.
 * Fades on every change.
 */

import { useEffect, useState } from 'react';

function labelFor(state, command, lastSpoken) {
  switch (state) {
    case 'LISTENING':  return 'Listening...';
    case 'PROCESSING': return 'Thinking...';
    case 'EXECUTING':  return command ? `Executing: ${command}` : 'Executing...';
    case 'SPEAKING':   return lastSpoken ? `\u201C${truncate(lastSpoken, 64)}\u201D` : 'Speaking...';
    case 'IDLE':       return 'Standing by.';
    default:           return state;
  }
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max - 1)}\u2026` : str;
}

export default function StatusText({ state, command, lastSpoken }) {
  const target = labelFor(state, command, lastSpoken);
  const [shown, setShown] = useState(target);
  const [dim, setDim] = useState(false);

  useEffect(() => {
    if (target === shown) return undefined;
    setDim(true);
    const t = setTimeout(() => { setShown(target); setDim(false); }, 160);
    return () => clearTimeout(t);
  }, [target, shown]);

  return (
    <div className={`status-text ${dim ? 'dim' : ''}`}>{shown}</div>
  );
}
