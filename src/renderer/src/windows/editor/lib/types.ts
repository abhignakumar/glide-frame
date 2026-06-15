export interface ZoomCenter {
  x: number;
  y: number;
  timestampMs: number;
}

export interface PositionVelocityState {
  position: number;
  velocity: number;
}

export interface FinalFrameState {
  timestampMs: number;
  videoTranslateX: number;
  videoTranslateY: number;
  videoScale: number;
  mouseX: number;
  mouseY: number;
  mouseScale: number;
  mouseRotation: number;
}
