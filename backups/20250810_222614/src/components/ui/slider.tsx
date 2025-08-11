"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value = [0], onValueChange, min = 0, max = 100, step = 1, className, disabled = false, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(event.target.value)
      onValueChange([newValue])
    }

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
            "slider:bg-blue-600 slider:rounded-lg slider:cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-track]:h-2 [&::-webkit-slider-track]:bg-gray-200 [&::-webkit-slider-track]:rounded-lg",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none",
            "[&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-gray-200 [&::-moz-range-track]:rounded-lg",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }