import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { shutdownHttpServer } from '../shutdown.js';

function listen(server: Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve((server.address() as AddressInfo).port));
  });
}

describe('shutdownHttpServer', () => {
  let server: Server;

  afterEach(() => {
    server.closeAllConnections();
    server.close();
  });

  it('lets an in-flight request finish before resolving', async () => {
    let release!: () => void;
    server = createServer((_req, res) => {
      release = () => res.end('done');
    });
    const port = await listen(server);

    const body = new Promise<string>((resolve) => {
      request({ port, host: '127.0.0.1', agent: false }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }).end();
    });
    await new Promise((r) => setTimeout(r, 50));

    let closed = false;
    const shutdown = shutdownHttpServer(server, 5_000).then(() => {
      closed = true;
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(closed).toBe(false);

    release();
    await shutdown;
    expect(await body).toBe('done');
    expect(closed).toBe(true);
  });

  it('force closes connections that outlive the timeout', async () => {
    server = createServer((_req, res) => {
      res.write('chunk');
    });
    const port = await listen(server);

    const aborted = new Promise<void>((resolve) => {
      const req = request({ port, host: '127.0.0.1', agent: false }, (res) => {
        res.on('error', () => resolve());
        res.on('close', () => resolve());
      });
      req.on('error', () => resolve());
      req.end();
    });
    await new Promise((r) => setTimeout(r, 50));

    await shutdownHttpServer(server, 100);
    await aborted;
    expect(server.listening).toBe(false);
  });
});
