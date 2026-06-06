import { contextBridge } from 'electron';

import type { EditorAPI } from '../main/lib/types/ipc-api';

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      type: 'editor',
    } satisfies EditorAPI);
  } catch (error) {
    console.error(error);
  }
}
