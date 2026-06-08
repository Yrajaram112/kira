/**
 * Preload: exposes a tiny, safe API to the renderer via contextBridge.
 *
 * The renderer never imports Node directly. It calls `window.assistant.*`.
 */

const { contextBridge, ipcRenderer } = require('electron');

const DEFAULT_WS_URL = 'ws://localhost:8765';

contextBridge.exposeInMainWorld('assistant', {
  wsUrl: process.env.ASSISTANT_WS_URL || DEFAULT_WS_URL,
  toggleMainWindow: () => ipcRenderer.invoke('toggle-main-window'),
  platform: process.platform,
});
