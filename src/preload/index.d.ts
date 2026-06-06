import type { EditorAPI, RecorderAPI, StopRecorderAPI } from '../main/lib/types/ipc-api';

export type ElectronAPI = RecorderAPI | StopRecorderAPI | EditorAPI;

export declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
