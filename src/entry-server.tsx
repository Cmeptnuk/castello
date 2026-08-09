import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { SLIDE_KEYS } from './slides.ts'
import App from './App.tsx'

export const routes = SLIDE_KEYS

/** Разметка одного маршрута для подстановки в index.html на сборке. */
export function render(initialSlide: number) {
  return renderToString(
    <StrictMode>
      <App initialSlide={initialSlide} />
    </StrictMode>,
  )
}
