import { readFileSync, writeFileSync } from 'node:fs'
import { routes, render } from '../dist-ssr/entry-server.js'

// Шаблон читается один раз: в цикле мы перезаписываем сам index.html.
const template = readFileSync('dist/index.html', 'utf8')
const MARKER = '<div id="root"></div>'

if (!template.includes(MARKER)) {
  throw new Error(`В dist/index.html не найден ${MARKER} — подставлять разметку некуда`)
}

for (const [i, key] of routes.entries()) {
  const file = key === 'home' ? 'dist/index.html' : `dist/${key}.html`
  writeFileSync(file, template.replace(MARKER, `<div id="root">${render(i)}</div>`))
  console.log(`пререндер ${file}`)
}
