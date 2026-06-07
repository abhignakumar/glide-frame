import fs from 'fs';
import path from 'path';

import { ipcMain, BrowserWindow } from 'electron';

import { handleListDisplaySources, stopRecordingProcess } from './recorder-ipc';
import {
  CLOSE_CURRENT_WINDOW,
  GET_MOUSE_MOVES,
  GET_PROJECT_DATA,
  LIST_DISPLAY_SOURCES,
  STOP_RECORDING,
} from '../lib/constants';

import type { MouseMove, ProjectData } from '../lib/types/types';

export function setupIpc() {
  setupRecorderIpc();
  setupStopRecorderIpc();
  setupEditorIpc();
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

function setupEditorIpc(): void {
  ipcMain.handle(GET_PROJECT_DATA, (_event, projectDir: string): ProjectData => {
    const projectDataJsonString = fs.readFileSync(path.join(projectDir, 'project.json'), 'utf-8');
    const projectData = JSON.parse(projectDataJsonString) as ProjectData;
    return projectData;
  });

  ipcMain.handle(GET_MOUSE_MOVES, (_event, projectDir: string): MouseMove[] => {
    const mouseMovesJsonString = fs.readFileSync(
      path.join(projectDir, 'recording', 'mouse-moves.json'),
      'utf-8',
    );
    const mouseMoves = JSON.parse(mouseMovesJsonString) as MouseMove[];
    return mouseMoves;
  });
}
