import { contextBridge, ipcRenderer } from 'electron';

import { GET_MOUSE_MOVES, GET_PROJECT_DATA } from '../main/lib/constants';

import type { EditorAPI } from '../main/lib/types/ipc-api';

const projectDir = process.argv.find((arg) => arg.startsWith('projectDir='))?.split('=')[1];

if (!projectDir) {
  throw new Error('Project directory (projectDir) is undefined.');
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      type: 'editor',
      getProjectData: () => ipcRenderer.invoke(GET_PROJECT_DATA, projectDir),
      getMouseMoves: () => ipcRenderer.invoke(GET_MOUSE_MOVES, projectDir),
    } satisfies EditorAPI);
  } catch (error) {
    console.error(error);
  }
}
