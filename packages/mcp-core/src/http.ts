const DEFAULT_TIMEOUT_MS = 15_000;

export function fetchTimeoutMs(): number {
  const raw = process.env.FERRLABS_MCP_HTTP_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

const BODY_READERS = ['text', 'json', 'arrayBuffer', 'blob', 'formData'] as const;

function timeoutError(url: string, timeoutMs: number, cause: unknown): unknown {
  if (cause instanceof Error && cause.name === 'AbortError') {
    return new Error(`Request to ${url} timed out after ${timeoutMs}ms`, { cause });
  }
  return cause;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = fetchTimeoutMs(),
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref();
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    for (const reader of BODY_READERS) {
      const original = res[reader];
      if (typeof original !== 'function') continue;
      Object.defineProperty(res, reader, {
        value: async () => {
          try {
            return await original.call(res);
          } catch (err) {
            throw timeoutError(url, timeoutMs, err);
          } finally {
            clearTimeout(timer);
          }
        },
      });
    }
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw timeoutError(url, timeoutMs, err);
  }
}
