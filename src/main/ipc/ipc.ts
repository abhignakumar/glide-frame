import { ipcMain, BrowserWindow } from 'electron';

import { handleListDisplaySources, stopRecordingProcess } from './recorder-ipc';
import { CLOSE_CURRENT_WINDOW, LIST_DISPLAY_SOURCES, STOP_RECORDING } from '../lib/constants';

export function setupIpc() {
  setupRecorderIpc();
  setupStopRecorderIpc();
}

function setupRecorderIpc(): void {
  ipcMain.on(CLOSE_CURRENT_WINDOW, (event) => {
    const recorderWindow = BrowserWindow.fromWebContents(event.sender);
    recorderWindow?.close();
  });

  ipcMain.handle(LIST_DISPLAY_SOURCES, (event) => {
    handleListDisplaySources(event);
  });
}

function setupStopRecorderIpc(): void {
  ipcMain.on(STOP_RECORDING, (event) => {
    const stopRecorderWindow = BrowserWindow.fromWebContents(event.sender);
    stopRecordingProcess();
    stopRecorderWindow?.close();
  });
}
