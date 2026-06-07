import type { EditorAPI, RecorderAPI, StopRecorderAPI } from '../main/lib/types/ipc-api';
import type { ProjectData } from '../main/lib/types/types';

export type ElectronAPI = RecorderAPI | StopRecorderAPI | EditorAPI;
export type TProjectData = ProjectData;

export declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
