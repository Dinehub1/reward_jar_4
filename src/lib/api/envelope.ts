export interface ApiMeta {
  requestId: string
  timestamp: string
}

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
  meta: ApiMeta
}

export const envelope = <T>(data?: T, error?: string): ApiEnvelope<T> => ({
  success: !error,
  data: error ? undefined : data,
  error: error ?? undefined,
  meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() }
})

export default envelope

