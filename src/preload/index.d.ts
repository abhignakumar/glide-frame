import type { EditorAPI, RecorderAPI, StopRecorderAPI } from '../main/lib/types/ipc-api';
import type {
  ProjectData,
  MouseMove,
  MouseClick,
  ZoomSegment,
  SpringConfig,
} from '../main/lib/types/types';

export type ElectronAPI = RecorderAPI | StopRecorderAPI | EditorAPI;
export type TProjectData = ProjectData;
export type TZoomSegment = ZoomSegment;
export type TMouseMove = MouseMove;
export type TMouseClick = MouseClick;
export type TSpringConfig = SpringConfig;

export declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
