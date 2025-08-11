export interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number
  onServerError?: (info: { url: string; status: number; message: string }) => void
  onTimeout?: (info: { url: string; timeoutMs: number }) => void
}

export async function fetchJsonWithTimeout<T = unknown>(
  url: string,
  options: FetchJsonOptions = {}
): Promise<T> {
  const { timeoutMs = 15000, onServerError, onTimeout, ...init } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      // Try parse JSON
      let message = response.statusText
      try {
        const json = await response.json()
        message = (json as any)?.error ?? (json as any)?.message ?? message
      } catch {
        // ignore
      }
      if (onServerError) {
        onServerError({ url, status: response.status, message })
      }
      throw new Error(`HTTP ${response.status}: ${message}`)
    }

    return (await response.json()) as T
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      if (onTimeout) onTimeout({ url, timeoutMs })
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`)
    }
    throw error
  }
}

