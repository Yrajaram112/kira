/**
 * Global React state hook driven by a WebSocket connection to the Python backend.
 *
 * Exposes a single `useAssistantStore()` that returns the current state +
 * a few derived values. Internally it owns ONE WebSocket per browser/Electron
 * page (auto-reconnects with exponential backoff).
 */

import { useEffect, useState } from 'react';

const MAX_LOG = 20;
const MAX_WAVE_AGE_MS = 250;

const listeners = new Set();
let socket = null;
let reconnectTimer = null;
let reconnectDelay = 500;

const state = {
  connected: false,
  current: 'IDLE',
  command: '',
  lastSpoken: '',
  waveform: [],
  waveformTs: 0,
  log: [],
};

function notify() { listeners.forEach((fn) => fn(state)); }

function pushLog(entry) {
  state.log = [{ ...entry, id: cryptoRandomId() }, ...state.log].slice(0, MAX_LOG);
}

function cryptoRandomId() {
  try {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  } catch (_e) {
    return `${Date.now()}-${Math.random()}`;
  }
}

function handleMessage(raw) {
  let payload;
  try { payload = JSON.parse(raw); } catch (_e) { return; }

  switch (payload.event) {
    case 'state_change': {
      state.current = payload.state || 'IDLE';
      if (typeof payload.command === 'string') state.command = payload.command;
      if (typeof payload.text === 'string') state.lastSpoken = payload.text;
      break;
    }
    case 'waveform': {
      state.waveform = Array.isArray(payload.data) ? payload.data : [];
      state.waveformTs = Date.now();
      break;
    }
    case 'task_log': {
      pushLog({
        kind: payload.kind || 'generic',
        text: payload.text || '',
        ts:   payload.ts ? payload.ts * 1000 : Date.now(),
      });
      break;
    }
    case 'memory': {
      pushLog({
        kind: 'memory',
        text: payload.text || '',
        ts:   payload.ts ? payload.ts * 1000 : Date.now(),
      });
      break;
    }
    default:
      break;
  }
  notify();
}

function ensureSocket() {
  if (typeof window === 'undefined') return;
  if (socket && (socket.readyState === WebSocket.OPEN ||
                 socket.readyState === WebSocket.CONNECTING)) return;
  const url = (window.assistant && window.assistant.wsUrl) || 'ws://localhost:8765';
  try {
    socket = new WebSocket(url);
  } catch (_e) {
    scheduleReconnect();
    return;
  }
  socket.addEventListener('open', () => {
    state.connected = true;
    reconnectDelay = 500;
    notify();
  });
  socket.addEventListener('message', (ev) => handleMessage(ev.data));
  socket.addEventListener('close', () => {
    state.connected = false;
    notify();
    scheduleReconnect();
  });
  socket.addEventListener('error', () => { /* close handler will retry */ });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 1.7, 8000);
    ensureSocket();
  }, reconnectDelay);
}

export function useAssistantStore() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const sub = () => setVersion((v) => v + 1);
    listeners.add(sub);
    ensureSocket();
    const interval = setInterval(() => {
      if (state.waveform.length && (Date.now() - state.waveformTs) > MAX_WAVE_AGE_MS) {
        state.waveform = [];
        notify();
      }
    }, 80);
    return () => {
      listeners.delete(sub);
      clearInterval(interval);
    };
  }, []);
  return state;
}
