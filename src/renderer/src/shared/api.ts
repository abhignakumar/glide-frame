import type { ElectronAPI } from 'src/preload/index';

export function getElectronApi<T extends ElectronAPI['type']>(
  expected: T,
): Extract<ElectronAPI, { type: T }> {
  if (window.electronAPI.type !== expected) {
    throw new Error(`${expected} window loaded with the wrong preload API`);
  }
  return window.electronAPI as Extract<ElectronAPI, { type: T }>;
}
