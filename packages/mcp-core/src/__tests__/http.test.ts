import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWithTimeout, fetchTimeoutMs } from '../http.js';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.FERRLABS_MCP_HTTP_TIMEOUT_MS;
});

describe('fetchTimeoutMs', () => {
  it('defaults to 15000ms', () => {
    expect(fetchTimeoutMs()).toBe(15_000);
  });

  it('honours a valid override', () => {
    process.env.FERRLABS_MCP_HTTP_TIMEOUT_MS = '500';
    expect(fetchTimeoutMs()).toBe(500);
  });

  it('ignores a non-positive or non-numeric override', () => {
    process.env.FERRLABS_MCP_HTTP_TIMEOUT_MS = 'nope';
    expect(fetchTimeoutMs()).toBe(15_000);
    process.env.FERRLABS_MCP_HTTP_TIMEOUT_MS = '0';
    expect(fetchTimeoutMs()).toBe(15_000);
  });
});

describe('fetchWithTimeout', () => {
  it('aborts and throws a timeout error when the upstream hangs', async () => {
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        });
      });
    });

    await expect(fetchWithTimeout('https://example.test', {}, 10)).rejects.toThrow(/timed out/);
  });

  it('passes the signal through and returns the response on success', async () => {
    const seen: { signal?: AbortSignal } = {};
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      seen.signal = init.signal ?? undefined;
      return Promise.resolve(new Response('{"a":1}', { status: 201 }));
    });

    const res = await fetchWithTimeout('https://example.test');
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ a: 1 });
    expect(seen.signal).toBeInstanceOf(AbortSignal);
  });

  it('times out when the body stalls after headers arrive', async () => {
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      const stream = new ReadableStream({
        start(controller) {
          init.signal?.addEventListener('abort', () =>
            controller.error(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          );
        },
      });
      return Promise.resolve(new Response(stream));
    });

    const res = await fetchWithTimeout('https://example.test', {}, 10);
    await expect(res.text()).rejects.toThrow(/timed out/);
  });

  it('keeps a 204 response bodiless', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 204 })));

    const res = await fetchWithTimeout('https://example.test');
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });
});
