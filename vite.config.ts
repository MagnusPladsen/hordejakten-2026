import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Kjører Vercel-funksjonene i api/ også under `bun run dev`
const apiIUtvikling = (): Plugin => ({
  name: 'api-i-utvikling',
  configureServer(server) {
    server.middlewares.use('/api/tiktok', async (_req, res) => {
      const { default: handler } = await server.ssrLoadModule('/api/tiktok.ts')
      const svar: Response = await handler()
      res.statusCode = svar.status
      res.setHeader('Content-Type', 'application/json')
      res.end(await svar.text())
    })
    server.middlewares.use('/api/kodejakten', async (_req, res) => {
      const { default: handler } = await server.ssrLoadModule('/api/kodejakten.ts')
      const svar: Response = await handler()
      res.statusCode = svar.status
      res.setHeader('Content-Type', 'application/json')
      res.end(await svar.text())
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), apiIUtvikling()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
