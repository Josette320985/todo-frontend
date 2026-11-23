import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { apiProxy } from './api-proxy.js'

// https://vite.dev/config/
const deferStylesheet = html => html.replace(/<link rel="stylesheet"([^>]+)>/g, (tag, attrs) => {
  const href = attrs.match(/href="([^"]+)"/)?.[1]
  if (!href) return tag
  const crossorigin = attrs.includes('crossorigin') ? ' crossorigin' : ''
  return `<link rel="preload" as="style" href="${href}"${crossorigin}><link rel="stylesheet" href="${href}"${crossorigin} media="print" data-deferred-css>`
})

export default defineConfig({
  server: { proxy: { '/api': apiProxy() } },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'defer-built-css',
      transformIndexHtml: {
        order: 'post',
        handler: deferStylesheet,
      },
    },
  ],
})
