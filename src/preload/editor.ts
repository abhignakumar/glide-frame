import { contextBridge, ipcRenderer } from 'electron';

import { GET_MOUSE_MOVES, GET_PROJECT_DATA } from '../main/lib/constants';

import type { EditorAPI } from '../main/lib/types/ipc-api';

const projectDir = process.argv.find((arg) => arg.startsWith('projectDir='))?.split('=')[1];
const videoServerPort = process.argv
  .find((arg) => arg.startsWith('videoServerPort='))
  ?.split('=')[1];

if (!projectDir) {
  throw new Error('Project directory (projectDir) is undefined.');
}
if (!videoServerPort) {
  throw new Error('Video server port (videoServerPort) is undefined.');
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      type: 'editor',
      getProjectData: () => ipcRenderer.invoke(GET_PROJECT_DATA, projectDir),
      getMouseMoves: () => ipcRenderer.invoke(GET_MOUSE_MOVES, projectDir),
      getProjectDir: () => projectDir,
      getVideoSrcUrl: () =>
        `http://127.0.0.1:${videoServerPort}/stream-video?videoPath=${encodeURIComponent(
          `${projectDir}/recording/display.mp4`,
        )}`,
    } satisfies EditorAPI);
  } catch (error) {
    console.error(error);
  }
}
