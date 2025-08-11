'use client'

import { useEffect, useState } from 'react'

interface ClientDateProps {
  format?: 'date' | 'time' | 'datetime'
  locale?: string
}

export default function ClientDate({ format = 'date', locale }: ClientDateProps) {
  const [text, setText] = useState<string>('')

  useEffect(() => {
    const now = new Date()
    const value =
      format === 'time'
        ? now.toLocaleTimeString(locale)
        : format === 'datetime'
          ? now.toLocaleString(locale)
          : now.toLocaleDateString(locale)
    setText(value)
  }, [format, locale])

  return <span suppressHydrationWarning>{text}</span>
}

