import { useEffect, useRef } from 'react'

export function useAutosaveDraft<T>(key: string, value: T, onSave: (v: T) => void, delayMs = 800) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!key) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}

    if (timeout.current) clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      onSave(value)
    }, delayMs)

    return () => {
      if (timeout.current) clearTimeout(timeout.current)
    }
  }, [key, value, onSave, delayMs])
}

