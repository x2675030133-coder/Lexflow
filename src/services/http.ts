type JsonRequestOptions = RequestInit & {
  timeoutMs?: number;
};

function createTimeoutError(timeoutMs: number) {
  return new Error(`Request timed out after ${Math.ceil(timeoutMs / 1000)}s`);
}

async function fetchWithTimeout(input: RequestInfo | URL, init: JsonRequestOptions = {}) {
  const { timeoutMs = 20000, signal, ...requestInit } = init;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  const abortHandler = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', abortHandler, { once: true });
    }
  }

  try {
    const response = await fetch(input, {
      ...requestInit,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (controller.signal.aborted) {
      throw createTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', abortHandler);
    }
  }
}

export async function getJsonWithTimeout<T>(input: RequestInfo | URL, timeoutMs = 20000) {
  const response = await fetchWithTimeout(input, { timeoutMs });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function postJsonWithTimeout<T>(input: RequestInfo | URL, body: unknown, timeoutMs = 20000) {
  const response = await fetchWithTimeout(input, {
    timeoutMs,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
