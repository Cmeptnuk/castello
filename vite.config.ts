import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Вшивает собранный CSS прямо в <style> и убирает файл из сборки.
    Отдельный <link rel=stylesheet> блокирует отрисовку и добавляет к
    критическому пути целый круг запроса — на мобильной сети это сотни
    миллисекунд ради ~8.5 КБ в gzip, которые дешевле отдать вместе с HTML. */
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html
        return html.replace(
          /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
          (tag, href: string) => {
            const name = href.replace(/^\//, '')
            const asset = bundle[name]
            if (!asset || asset.type !== 'asset' || typeof asset.source !== 'string') return tag
            delete bundle[name]
            return `<style>${asset.source}</style>`
          },
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [tailwindcss(), react(), inlineCss()],
  server: {
    // слушать 0.0.0.0, чтобы сайт открывался с телефона по локальной сети
    host: true
  }
})
