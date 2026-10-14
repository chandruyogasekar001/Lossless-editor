/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0d1117',
        surface: '#161b22',
        surfaceLight: '#21262d',
        surfaceBorder: '#30363d',
        accent: '#58a6ff',
        accentHover: '#388bfd',
        danger: '#f85149',
        success: '#3fb950',
        warning: '#d29922'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
