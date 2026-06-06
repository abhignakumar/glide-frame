import { join } from 'path';

import { is } from '@electron-toolkit/utils';
import { BrowserWindow, screen } from 'electron';

export async function createRecorderWindow(): Promise<BrowserWindow> {
  const recorderWindow = new BrowserWindow({
    width: 134,
    height: 66,
    frame: false,
    show: false,
    resizable: false,
    alwaysOnTop: true,
    fullscreen: false,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/recorder.js'),
    },
  });
  recorderWindow.setVisibleOnAllWorkspaces(true);

  recorderWindow.on('ready-to-show', () => {
    recorderWindow.show();
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await recorderWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/recorder.html`);
  } else {
    await recorderWindow.loadFile(join(__dirname, '../renderer/recorder.html'));
  }

  return recorderWindow;
}

export async function createStopRecorderWindow(): Promise<BrowserWindow> {
  const stopRecorderWindow = new BrowserWindow({
    width: 66,
    height: 66,
    frame: false,
    show: false,
    resizable: false,
    alwaysOnTop: true,
    fullscreen: false,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/stop-recorder.js'),
    },
  });
  stopRecorderWindow.setVisibleOnAllWorkspaces(true);
  stopRecorderWindow.setContentProtection(true);

  stopRecorderWindow.on('ready-to-show', () => {
    stopRecorderWindow.show();
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await stopRecorderWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/stop-recorder.html`);
  } else {
    await stopRecorderWindow.loadFile(join(__dirname, '../renderer/stop-recorder.html'));
  }

  return stopRecorderWindow;
}

export async function createEditorWindow(): Promise<BrowserWindow> {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const editorWindow = new BrowserWindow({
    width,
    height,
    show: false,
    resizable: false,
    fullscreen: false,
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/editor.js'),
    },
  });

  editorWindow.on('ready-to-show', () => {
    editorWindow.show();
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await editorWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/editor.html`);
  } else {
    await editorWindow.loadFile(join(__dirname, '../renderer/editor.html'));
  }

  return editorWindow;
}
