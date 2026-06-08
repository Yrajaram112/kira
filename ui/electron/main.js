/**
 * Electron main process.
 *
 * Owns three things:
 *  1. The main 400x600 frameless window (the orb).
 *  2. The 280x80 HUD overlay (always-on-top, click-through).
 *  3. The Python backend lifecycle (spawned as a child process unless
 *     ASSISTANT_NO_SPAWN_PY=1, useful while developing the UI alone).
 *
 * Both windows share one WebSocket connection that lives inside the renderer
 * processes; we don't run the WS client in main.js because preload exposes
 * the W3C WebSocket API directly to the renderer (no CSP issues — we control
 * both endpoints, served from file://).
 */

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');
const fs = require('node:fs');

const IS_DEV = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const DIST_DIR = path.join(__dirname, '..', 'dist');

let mainWindow = null;
let hudWindow = null;
let tray = null;
let pythonProc = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    resizable: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: false,
    skipTaskbar: false,
    title: 'Assistant',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  loadView(mainWindow, 'index.html');
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createHudWindow() {
  const display = require('electron').screen.getPrimaryDisplay();
  const { workArea } = display;
  hudWindow = new BrowserWindow({
    width: 280,
    height: 80,
    x: workArea.x + workArea.width - 296,
    y: workArea.y + workArea.height - 100,
    frame: false,
    resizable: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    title: 'Assistant HUD',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  hudWindow.setAlwaysOnTop(true, 'screen-saver');
  hudWindow.setIgnoreMouseEvents(true, { forward: true });
  loadView(hudWindow, 'hud.html');
  hudWindow.on('closed', () => { hudWindow = null; });
}

function loadView(win, file) {
  if (IS_DEV) {
    win.loadURL(`${DEV_URL}/${file}`);
  } else {
    win.loadFile(path.join(DIST_DIR, file));
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'tray-icon.png');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();
  tray = new Tray(icon);
  const menu = Menu.buildFromTemplate([
    {
      label: 'Show window',
      click: () => { if (mainWindow) mainWindow.show(); },
    },
    {
      label: 'Hide window',
      click: () => { if (mainWindow) mainWindow.hide(); },
    },
    { type: 'separator' },
    {
      label: 'Open repo',
      click: () => { shell.openExternal('https://github.com/'); },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => { app.quit(); },
    },
  ]);
  tray.setToolTip('Assistant');
  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (!mainWindow) { createMainWindow(); return; }
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function spawnPythonBackend() {
  if (process.env.ASSISTANT_NO_SPAWN_PY === '1') {
    console.log('[main] Skipping Python spawn (ASSISTANT_NO_SPAWN_PY=1).');
    return;
  }
  const projectRoot = path.resolve(__dirname, '..', '..');
  const venvPython = process.platform === 'win32'
    ? path.join(projectRoot, '.venv', 'Scripts', 'python.exe')
    : path.join(projectRoot, '.venv', 'bin', 'python');
  const py = fs.existsSync(venvPython) ? venvPython : 'python';
  console.log('[main] Spawning backend:', py, 'main.py (cwd=', projectRoot, ')');
  pythonProc = spawn(py, ['main.py'], {
    cwd: projectRoot,
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  });
  pythonProc.stdout.on('data', (b) => process.stdout.write(`[py] ${b}`));
  pythonProc.stderr.on('data', (b) => process.stderr.write(`[py-err] ${b}`));
  pythonProc.on('exit', (code) => {
    console.log('[main] Python backend exited with code', code);
    pythonProc = null;
  });
}

app.on('window-all-closed', (e) => {
  e.preventDefault();           // keep running in the tray
});

app.on('before-quit', () => {
  if (pythonProc) {
    try { pythonProc.kill(); } catch (_e) { /* ignore */ }
    pythonProc = null;
  }
});

ipcMain.handle('toggle-main-window', () => {
  if (!mainWindow) { createMainWindow(); return true; }
  if (mainWindow.isVisible()) { mainWindow.hide(); return false; }
  mainWindow.show();
  return true;
});

app.whenReady().then(() => {
  spawnPythonBackend();
  createMainWindow();
  createHudWindow();
  createTray();
});
