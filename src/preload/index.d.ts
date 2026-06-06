import type { ElectronAPI } from '../main/lib/types/ipc-api';

export declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
