export interface ProjectData {
  id: string;
  createdAt: string;
  zoomSegments: ZoomSegment[];
}

export interface MouseClick {
  x: number;
  y: number;
  type: 'mouseUp' | 'mouseDown';
  button: 'left' | 'right' | 'other';
  unixTimeMs: number;
  processTimeMs: number;
}

export interface MouseMove {
  x: number;
  y: number;
  unixTimeMs: number;
  processTimeMs: number;
}

export interface ZoomSegment {
  id: string;
  startTimeMs: number;
  endTimeMs: number;
  scale: number;
}
