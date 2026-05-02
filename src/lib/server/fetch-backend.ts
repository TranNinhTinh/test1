/**
 * Server-side fetch to the real backend with a hard timeout.
 * Without this, a wrong URL or dead server leaves the browser request pending indefinitely.
 */
const timeoutMs = () => {
  const n = Number(process.env.BACKEND_FETCH_TIMEOUT_MS)
  return Number.isFinite(n) && n > 0 ? n : 15_000
}

export async function fetchBackend(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs()),
  })
}

export function isBackendFetchAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}
