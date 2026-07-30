import axios from 'axios'

interface ApiErrorPayload {
  error?: { message?: string }
  detail?: string
}

/** Return a clear message emitted by the API, with a safe fallback for users. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return fallback
  const payload = error.response?.data
  return payload?.error?.message || payload?.detail || fallback
}
