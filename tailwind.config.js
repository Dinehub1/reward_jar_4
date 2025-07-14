/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(229, 231, 235)", // gray-200
        input: "rgb(229, 231, 235)", // gray-200
        ring: "rgb(59, 130, 246)", // blue-500
        background: "rgb(255, 255, 255)", // white
        foreground: "rgb(17, 24, 39)", // gray-900
        primary: {
          DEFAULT: "rgb(37, 99, 235)", // blue-600
          foreground: "rgb(255, 255, 255)", // white
        },
        secondary: {
          DEFAULT: "rgb(243, 244, 246)", // gray-100
          foreground: "rgb(17, 24, 39)", // gray-900
        },
        destructive: {
          DEFAULT: "rgb(239, 68, 68)", // red-500
          foreground: "rgb(255, 255, 255)", // white
        },
        muted: {
          DEFAULT: "rgb(243, 244, 246)", // gray-100
          foreground: "rgb(107, 114, 128)", // gray-500
        },
        accent: {
          DEFAULT: "rgb(243, 244, 246)", // gray-100
          foreground: "rgb(17, 24, 39)", // gray-900
        },
        popover: {
          DEFAULT: "rgb(255, 255, 255)", // white
          foreground: "rgb(17, 24, 39)", // gray-900
        },
        card: {
          DEFAULT: "rgb(255, 255, 255)", // white
          foreground: "rgb(17, 24, 39)", // gray-900
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}; 