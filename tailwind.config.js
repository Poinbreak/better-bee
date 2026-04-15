/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        foreground: '#f8fafc', // slate-50
        primary: {
          DEFAULT: '#eab308', // Yellow-500
          hover: '#ca8a04',
          foreground: '#020617',
        },
        surface: {
          DEFAULT: '#0f172a', // slate-900
          foreground: '#f8fafc',
          border: '#1e293b', // slate-800
        }
      },
    },
  },
  plugins: [],
}
