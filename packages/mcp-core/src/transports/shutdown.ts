import type { Server } from 'node:http';

export const SHUTDOWN_TIMEOUT_MS = 10_000;

export function shutdownHttpServer(
  server: Server,
  timeoutMs: number = SHUTDOWN_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      server.closeAllConnections();
      resolve();
    }, timeoutMs);
    server.close(() => {
      clearTimeout(timer);
      resolve();
    });
    server.closeIdleConnections();
  });
}
