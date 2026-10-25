import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { startStdioServer, startHttpServer, shutdownHttpServer } = vi.hoisted(() => ({
  startStdioServer: vi.fn(async () => {}),
  startHttpServer: vi.fn(async () => ({ id: 'http-server' })),
  shutdownHttpServer: vi.fn(async () => {}),
}));

vi.mock('../transports/stdio.js', () => ({ startStdioServer }));
vi.mock('../transports/http.js', () => ({ startHttpServer }));
vi.mock('../transports/shutdown.js', () => ({ shutdownHttpServer }));

import { runMcp } from '../runner.js';

describe('runMcp', () => {
  const originalArgv = process.argv;
  let written: string[];

  beforeEach(() => {
    written = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      written.push(String(chunk));
      return true;
    });
    startStdioServer.mockClear();
    startHttpServer.mockClear();
    shutdownHttpServer.mockClear();
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(['--version', '-v'])(
    'prints name and version for %s without starting a transport',
    async (flag) => {
      process.argv = ['node', 'index.js', flag];
      const register = vi.fn();

      await runMcp({ name: 'ferrtrack', version: '1.2.3', register });

      expect(written).toEqual(['ferrtrack 1.2.3\n']);
      expect(register).not.toHaveBeenCalled();
      expect(startStdioServer).not.toHaveBeenCalled();
      expect(startHttpServer).not.toHaveBeenCalled();
    },
  );

  it('starts the stdio transport when no version flag is passed', async () => {
    vi.stubEnv('FERRLABS_MCP_MODE', 'stdio');
    process.argv = ['node', 'index.js'];
    const register = vi.fn();

    await runMcp({ name: 'ferrtrack', version: '1.2.3', register });

    expect(written).toEqual([]);
    expect(register).toHaveBeenCalledOnce();
    expect(startStdioServer).toHaveBeenCalledOnce();
  });

  it.each(['SIGTERM', 'SIGINT'] as const)(
    'shuts the http server down and exits on %s',
    async (signal) => {
      vi.stubEnv('FERRLABS_MCP_MODE', 'http');
      process.argv = ['node', 'index.js'];
      const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
      const before = process.listenerCount(signal);

      await runMcp({ name: 'ferrtrack', version: '1.2.3', register: vi.fn() });
      expect(process.listenerCount(signal)).toBe(before + 1);

      process.emit(signal);
      await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
      expect(shutdownHttpServer).toHaveBeenCalledWith({ id: 'http-server' });
    },
  );

  it('registers no signal handlers in stdio mode', async () => {
    vi.stubEnv('FERRLABS_MCP_MODE', 'stdio');
    process.argv = ['node', 'index.js'];
    const before = process.listenerCount('SIGTERM');

    await runMcp({ name: 'ferrtrack', version: '1.2.3', register: vi.fn() });

    expect(process.listenerCount('SIGTERM')).toBe(before);
  });
});
