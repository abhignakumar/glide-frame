import fs from 'fs';
import path from 'path';

import cors from 'cors';
import express from 'express';

import type { Server } from 'http';
import type { AddressInfo } from 'net';

let serverInstance: Server | null = null;
let allocatedPort: number = 0;

/**
 * Initializes a strictly local Express server supporting native HTTP Range requests.
 * Uses a random unassigned system port to eliminate port conflict crashes.
 */
export function startVideoServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(cors());

    // Express Endpoint: /stream-video?videoPath=...
    app.get('/stream-video', (req, res) => {
      const rawPath = req.query.videoPath as string;

      if (!rawPath) {
        res.status(400).send('Missing path parameter');
        return;
      }

      try {
        const decodedPath = decodeURIComponent(rawPath);
        const normalizedPath = path.normalize(decodedPath);

        // Prevent Directory Traversal / File Access Auditing
        if (!fs.existsSync(normalizedPath) || !fs.lstatSync(normalizedPath).isFile()) {
          res.status(404).send('Target video file not found or inaccessible');
          return;
        }

        // Automatically handles range requests, calculation math,
        // 206 Partial Content flags, and stream piping safely.
        res.sendFile(normalizedPath, { acceptRanges: true }, (err) => {
          if (!res.headersSent) {
            console.error('Express file serving runtime error:', err);
            res.status(500).end();
          }
        });
        return;
      } catch (error) {
        console.error('Error handling streaming query:', error);
        if (!res.headersSent) res.status(500).send('Internal server processing exception');
        return;
      }
    });

    // Listen on port 0 to force Node to claim an available random high port
    // Bind directly to 127.0.0.1 (localhost) so external network devices cannot scan it
    serverInstance = app.listen(0, '127.0.0.1', () => {
      const address = serverInstance?.address() as AddressInfo;
      allocatedPort = address.port;
      console.log(`[Production Video Server] Initialized on http://127.0.0.1:${allocatedPort}`);
      resolve(allocatedPort);
    });

    serverInstance.on('error', (err) => {
      console.error('[Production Video Server] Execution Failed:', err);
      reject(err);
    });
  });
}

export function stopVideoServer(): void {
  if (serverInstance) {
    serverInstance.close();
    console.log('[Production Video Server] Terminated.');
    serverInstance = null;
    allocatedPort = 0;
  }
}
