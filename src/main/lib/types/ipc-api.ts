import type { MouseMove, MouseClick, ProjectData } from './types';

export interface RecorderAPI {
  type: 'recorder';
  closeCurrentWindow: () => void;
  listDisplaySources: () => Promise<void>;
}

export interface StopRecorderAPI {
  type: 'stop-recorder';
  stopRecording: () => void;
}

export interface EditorAPI {
  type: 'editor';
  getProjectData: () => Promise<ProjectData>;
  getMouseMoves: () => Promise<MouseMove[]>;
  getMouseClicks: () => Promise<MouseClick[]>;
  getProjectDir: () => string;
  getVideoSrcUrl: () => string;
}
