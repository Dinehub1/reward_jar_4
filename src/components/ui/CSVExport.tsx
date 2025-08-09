'use client'

import React from 'react'

export type CsvRow = Record<string, string | number | boolean | null | undefined>

function toCSV(rows: CsvRow[]): string {
  if (!rows || rows.length === 0) return ''
  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k))
      return set
    }, new Set<string>())
  )
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return ''
    const s = String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape((row as any)[h])).join(','))
  }
  return lines.join('\n')
}

export function downloadCSV(filename: string, rows: CsvRow[]) {
  const csv = toCSV(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const CSVExportButton: React.FC<{
  filename: string
  rows: CsvRow[]
  className?: string
  children?: React.ReactNode
}> = ({ filename, rows, className = '', children = 'Export CSV' }) => {
  return (
    <button
      type="button"
      onClick={() => downloadCSV(filename, rows)}
      className={`px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50 ${className}`}
    >
      {children}
    </button>
  )
}

export default CSVExportButton

