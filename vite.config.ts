import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this from a project subpath, so assets need the prefix.
// Set NETRA_BASE=/ when deploying to a root domain instead.
const base = process.env.NETRA_BASE ?? '/netra/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
