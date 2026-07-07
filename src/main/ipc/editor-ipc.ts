import fs from 'fs';

import { dialog, BrowserWindow } from 'electron';

import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron';

export async function handleExportVideoDialog(
  event: IpcMainInvokeEvent,
): Promise<{ filePath: string | null }> {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { filePath: null };

  const { canceled, filePath } = await dialog.showSaveDialog(window, {
    title: 'Export Video',
    defaultPath: 'export.mp4',
    buttonLabel: 'Export',
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
    properties: ['createDirectory'],
  });

  if (canceled || !filePath) {
    return { filePath: null };
  }

  return { filePath };
}

export function handleStartExport(event: IpcMainEvent, filePath: string) {
  const port = event.ports.length > 0 ? event.ports[0] : null;
  if (!port) {
    console.error('[Export] No MessagePort provided for streaming.');
    return;
  }

  let fd: number;
  try {
    fd = fs.openSync(filePath, 'w');
  } catch (err) {
    console.error('[Export] File open error:', err);
    port.postMessage({ type: 'error', message: JSON.stringify(err) });
    port.close();
    return;
  }

  port.on('message', (portEvent) => {
    if (!portEvent.data) return;

    const { type, chunk, position } = portEvent.data as {
      type: string;
      chunk?: Uint8Array;
      position?: number;
    };

    if (type === 'data' && chunk && chunk instanceof Uint8Array) {
      try {
        fs.writeSync(fd, chunk, 0, chunk.length, position ?? null);
      } catch (err) {
        console.error('[Export] File write error:', err);
        try {
          fs.closeSync(fd);
        } catch (err) {
          console.error('[Export] File close error:', err);
        }
        port.postMessage({ type: 'error', message: JSON.stringify(err) });
        port.close();
        return;
      }
    } else if (type === 'done') {
      try {
        fs.closeSync(fd);
      } catch (err) {
        console.error('[Export] File close error:', err);
        port.postMessage({ type: 'error', message: JSON.stringify(err) });
        port.close();
        return;
      }
      console.log('[Export] Finished writing to disk');
      port.postMessage({ type: 'success' });
      port.close();
      return;
    } else if (type === 'error') {
      try {
        fs.closeSync(fd);
      } catch (err) {
        console.error('[Export] File close error:', err);
        port.postMessage({ type: 'error', message: JSON.stringify(err) });
        port.close();
        return;
      }
      fs.unlink(filePath, () => {
        console.log('[Export] Cleaned up corrupted file due to renderer error.');
      });
      port.close();
      return;
    }
  });
  port.start();
  return;
}
