import { optimizer } from '@electron-toolkit/utils';
import { app, dialog, BrowserWindow } from 'electron';
import permissions from 'node-mac-permissions';

import { setupIpc } from './ipc/ipc';
import { stopRecordingProcess } from './ipc/recorder-ipc';
import { stopVideoServer } from './video-server';
import { createRecorderWindow } from './windows';

void app.whenReady().then(async () => {
  if (process.platform !== 'darwin') {
    dialog.showErrorBox('Unsupported Platform', 'This application is only supported on macOS.');
    app.quit();
    return;
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const screenCapturePermission = permissions.getAuthStatus('screen');
  if (screenCapturePermission !== 'authorized') {
    await dialog.showMessageBox({
      title: 'Screen Capture Access',
      message:
        'This application needs screen capture access to record the screen. Allow screen capture permission in system settings and restart the application.',
      type: 'info',
    });
    permissions.askForScreenCaptureAccess(true);
    app.quit();
    return;
  }
  const inputMonitoringPermission = permissions.getAuthStatus('input-monitoring');
  if (inputMonitoringPermission !== 'authorized') {
    await dialog.showMessageBox({
      title: 'Input Monitoring Access',
      message:
        'This application needs input monitoring access to capture the mouse events. Allow input monitoring permission in system settings and restart the application.',
      type: 'info',
    });
    await permissions.askForInputMonitoringAccess();
    app.quit();
    return;
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createRecorderWindow();
    }
  });

  setupIpc();

  await createRecorderWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  stopRecordingProcess(true);
  stopVideoServer();
});
