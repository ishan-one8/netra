import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // Pages serves this from a project subpath, but the dev server should stay
  // at the root so http://localhost:5173 works as written everywhere.
  // Set NETRA_BASE=/ when deploying to a root domain instead.
  base: command === 'build' ? (process.env.NETRA_BASE ?? '/netra/') : '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
}))
