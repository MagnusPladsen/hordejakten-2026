import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

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

// robots.txt og sitemap.xml med riktig domene, laget ved bygging
const seoFiler = (url: string): Plugin => ({
  name: 'seo-filer',
  generateBundle() {
    const faner = ['teorier', 'hint', 'tavla', 'lag', 'spill', 'analyse', 'stream']
    const dato = new Date().toISOString().slice(0, 10)
    const sider = [`${url}/`, ...faner.map((f) => `${url}/?fane=${f}`)]
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${url}/sitemap.xml\n` })
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sider
        .map((s, i) => `  <url><loc>${s.replace(/&/g, '&amp;')}</loc><lastmod>${dato}</lastmod><changefreq>hourly</changefreq><priority>${i === 0 ? '1.0' : '0.7'}</priority></url>`)
        .join('\n')}\n</urlset>\n`,
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss(), apiIUtvikling(), seoFiler(loadEnv(mode, process.cwd(), '').VITE_SITE_URL ?? '')],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
}))
