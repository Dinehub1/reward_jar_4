'use client'

import React, { useMemo } from 'react'

export type PreviewBarcodeType = 'QR_CODE' | 'CODE_128' | 'CODE128' | 'PDF417'

function hashStringToInts(input: string, count: number): number[] {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    out.push(Math.abs(h))
  }
  return out
}

function QrPreview({ value, size = 128 }: { value: string; size?: number }) {
  // Deterministic pseudo QR grid (not scannable, but visually realistic)
  const grid = useMemo(() => {
    const modules = 29 // typical
    const rnd = hashStringToInts(value, modules * modules)
    const cells: boolean[] = new Array(modules * modules).fill(false)
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        const idx = y * modules + x
        // Finder patterns corners
        const fp = (xx: number, yy: number) =>
          x >= xx && x < xx + 7 && y >= yy && y < yy + 7
        if (fp(0, 0) || fp(modules - 7, 0) || fp(0, modules - 7)) {
          // Draw finder: 7x7 outer, 5x5 white, 3x3 black
          const lx = x % modules, ly = y % modules
          const inOuter = true
          const inWhite = (lx % 7) >= 1 && (lx % 7) <= 5 && (ly % 7) >= 1 && (ly % 7) <= 5
          const inInner = (lx % 7) >= 2 && (lx % 7) <= 4 && (ly % 7) >= 2 && (ly % 7) <= 4
          cells[idx] = inOuter && !inWhite || inInner
          continue
        }
        // Pseudo random modules
        cells[idx] = (rnd[idx] & 1) === 0
      }
    }
    return { modules, cells }
  }, [value])

  const cellSize = Math.floor(size / grid.modules)
  const actual = cellSize * grid.modules

  return (
    <div
      className="bg-white p-2 rounded"
      style={{ width: actual + 8, height: actual + 8 }}
      aria-label="QR preview"
    >
      <div
        style={{
          width: actual,
          height: actual,
          display: 'grid',
          gridTemplateColumns: `repeat(${grid.modules}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${grid.modules}, ${cellSize}px)`,
          background: '#fff',
        }}
      >
        {grid.cells.map((on, i) => (
          <div key={i} style={{ width: cellSize, height: cellSize, background: on ? '#000' : '#fff' }} />
        ))}
      </div>
    </div>
  )
}

function Code128Preview({ value, width = 320, height = 64 }: { value: string; width?: number; height?: number }) {
  // Deterministic bar widths (not scannable), visually plausible
  const bars = useMemo(() => {
    const ints = hashStringToInts(value, 80)
    return ints.map((n, i) => ({
      w: 1 + (n % 3), // bar unit width 1..3
      black: i % 2 === 0,
    }))
  }, [value])
  const totalUnits = bars.reduce((sum, b) => sum + b.w, 0)
  const unitPx = Math.max(1, Math.floor(width / totalUnits))
  let x = 0
  return (
    <svg width={width} height={height} role="img" aria-label="Code128 preview">
      <rect x="0" y="0" width={width} height={height} fill="#fff" />
      {bars.map((b, idx) => {
        const w = b.w * unitPx
        const el = b.black ? (
          <rect key={idx} x={x} y={0} width={w} height={height} fill="#000" />
        ) : null
        x += w
        return el
      })}
    </svg>
  )
}

export interface BarcodePreviewProps {
  type: PreviewBarcodeType
  value: string
  className?: string
}

export const BarcodePreview: React.FC<BarcodePreviewProps> = ({ type, value, className }) => {
  if (type === 'QR_CODE') {
    return (
      <div className={`w-full flex items-center justify-center ${className || ''}`}>
        <QrPreview value={value} />
      </div>
    )
  }
  // PDF417 and Code128 both shown as wide codes in preview (visually similar)
  return (
    <div className={`w-full flex items-center justify-center ${className || ''}`}>
      <Code128Preview value={value} />
    </div>
  )
}

export default BarcodePreview

